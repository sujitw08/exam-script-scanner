import { createWorker } from 'tesseract.js';

/**
 * Pre-processes image using Canvas for better OCR accuracy:
 * - Increases contrast
 * - Grayscale conversion
 * - Optional binarization
 */
export async function preprocessImage(imageDataUrl, { binarize = false, contrast = 1.3 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        let val = factor * (avg - 128) + 128;
        val = Math.max(0, Math.min(255, val));

        if (binarize) {
          val = val > 140 ? 255 : 0;
        }

        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * Evaluates image sharpness / blurriness using Laplacian variance on canvas
 */
export async function detectImageBlur(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Scale down for fast calculation
      canvas.width = Math.min(400, img.width);
      canvas.height = Math.min(400, img.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let totalVariance = 0;
      let count = 0;

      for (let y = 1; y < canvas.height - 1; y += 2) {
        for (let x = 1; x < canvas.width - 1; x += 2) {
          const idx = (y * canvas.width + x) * 4;
          const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
          const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
          const top = (data[idx - canvas.width * 4] + data[idx - canvas.width * 4 + 1] + data[idx - canvas.width * 4 + 2]) / 3;
          const bottom = (data[idx + canvas.width * 4] + data[idx + canvas.width * 4 + 1] + data[idx + canvas.width * 4 + 2]) / 3;

          const laplacian = Math.abs(4 * center - left - right - top - bottom);
          totalVariance += laplacian;
          count++;
        }
      }

      const blurScore = totalVariance / count;
      // blurScore < 12 generally indicates soft/blurry capture
      resolve({
        score: blurScore,
        isBlurry: blurScore < 11.5
      });
    };
    img.onerror = () => resolve({ score: 20, isBlurry: false });
    img.src = imageDataUrl;
  });
}

/**
 * Gemini Vision OCR Engine:
 * Sends image to Google Gemini API for high-precision handwritten script reading.
 */
export async function extractWithGemini(imageDataUrl, apiKey, expectedColumns = []) {
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please add your key in Settings.');
  }

  // Strip base64 data prefix
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');

  const questionsList = expectedColumns
    .filter(c => !['regNo', 'studentName', 'total'].includes(c.key))
    .map(c => `${c.key} (${c.label || c.key}, max: ${c.max || 'any'})`)
    .join(', ');

  const systemPrompt = `You are an expert exam evaluation assistant. Your task is to extract student information and marks from the scanned exam answer script header/front page.
Target fields to extract:
1. Register Number / Roll Number (e.g. 7376221CS101, 21CS045, etc.)
2. Student Name (if written, else leave empty)
3. Exam Type (CAT1, CAT2, CAT3, Mid-Term, Semester)
4. Question-wise marks for questions: [${questionsList || 'q1, q2, q3, q4, q5, q6, q7, q8'}]
5. Total Marks (if written on script or sum of marks)
6. Confidence level (0 to 100)
7. Uncertain fields: List of field keys where handwriting is ambiguous, faint, or cropped.

Return ONLY a valid JSON object matching this exact schema:
{
  "regNo": "string",
  "studentName": "string",
  "examType": "CAT1" | "CAT2" | "CAT3" | "Semester" | "Other",
  "marks": {
    "q1": number | null,
    "q2": number | null,
    "q3": number | null,
    "q4": number | null,
    "q5": number | null,
    "q6": number | null,
    "q7": number | null,
    "q8": number | null
  },
  "total": number,
  "confidence": number,
  "uncertainFields": ["string"],
  "notes": "string"
}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json'
    }
  };

  // Use Gemini 2.0 Flash or 1.5 Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const jsonResponse = await response.json();
  const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);
    return result;
  } catch (err) {
    throw new Error(`Failed to parse Gemini JSON output: ${err.message}`);
  }
}

/**
 * Tesseract.js Offline Fallback OCR:
 * Runs 100% locally in browser without requiring internet or API keys.
 */
let tesseractWorker = null;

async function getTesseractWorker() {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker('eng');
  }
  return tesseractWorker;
}

export async function extractWithTesseract(imageDataUrl, expectedColumns = []) {
  const worker = await getTesseractWorker();
  const enhancedImage = await preprocessImage(imageDataUrl, { contrast: 1.5, binarize: false });
  
  const { data: { text, confidence } } = await worker.recognize(enhancedImage);
  console.log('[Tesseract raw text]:', text);

  // Extract Register Number using regular expressions
  // Matches formats like 7376211CS101, 21CS102, 192011001, etc.
  const regNoMatch = text.match(/(?:REG(?:ISTER)?\.?\s*(?:NO\.?|NUMBER)?|ROLL\s*NO\.?|ID)\s*[:\-]?\s*([A-Z0-9]{5,15})/i) 
    || text.match(/\b([0-9]{2}[A-Z]{2,4}[0-9]{3,5})\b/i)
    || text.match(/\b([0-9]{7,12})\b/i);

  const regNo = regNoMatch ? regNoMatch[1].toUpperCase() : '';

  // Extract Exam Type
  let examType = 'CAT1';
  if (/CAT[\s\-_]*3/i.test(text)) examType = 'CAT3';
  else if (/CAT[\s\-_]*2/i.test(text)) examType = 'CAT2';
  else if (/CAT[\s\-_]*1/i.test(text)) examType = 'CAT1';
  else if (/SEM(?:ESTER)?/i.test(text)) examType = 'Semester';

  // Extract Question Marks
  const marks = {};
  let computedTotal = 0;
  const uncertainFields = [];

  const questionKeys = expectedColumns.filter(c => !['regNo', 'studentName', 'total'].includes(c.key));
  const targetQuestions = questionKeys.length > 0 ? questionKeys : ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];

  targetQuestions.forEach((qKey, index) => {
    const qNum = index + 1;
    // Look for patterns like "Q1: 2" or "1. 2" or table entries
    const regex = new RegExp(`(?:Q(?:uestion)?\\.?\\s*${qNum}|\\b${qNum}\\b)[\\s\\.:\\-_|]+(\\d+(?:\\.\\d+)?)`, 'i');
    const match = text.match(regex);
    if (match) {
      const val = parseFloat(match[1]);
      marks[typeof qKey === 'object' ? qKey.key : qKey] = val;
      computedTotal += val;
    } else {
      marks[typeof qKey === 'object' ? qKey.key : qKey] = 0;
      uncertainFields.push(typeof qKey === 'object' ? qKey.key : qKey);
    }
  });

  // Check if Total is explicitly written
  const totalMatch = text.match(/TOTAL(?:\s*MARKS)?\s*[:\-]?\s*(\d+(?:\\.\d+)?)/i);
  const total = totalMatch ? parseFloat(totalMatch[1]) : computedTotal;

  if (!regNo) uncertainFields.push('regNo');

  return {
    regNo: regNo || '',
    studentName: '',
    examType,
    marks,
    total,
    confidence: Math.round(confidence) || 60,
    uncertainFields,
    engine: 'Tesseract.js (Offline)'
  };
}

/**
 * Unified Smart Hybrid OCR:
 * Tries Gemini Vision if API key is provided, falls back to Tesseract.js.
 */
export async function runHybridOCR(imageDataUrl, { apiKey = '', expectedColumns = [] } = {}) {
  const blurAnalysis = await detectImageBlur(imageDataUrl);

  let result;
  if (apiKey && apiKey.trim().length > 10) {
    try {
      console.log('[OCR] Running Gemini Vision extraction...');
      result = await extractWithGemini(imageDataUrl, apiKey, expectedColumns);
      result.engine = 'Gemini 2.0 Flash Vision';
    } catch (err) {
      console.warn('[OCR] Gemini failed, falling back to local Tesseract:', err.message);
      result = await extractWithTesseract(imageDataUrl, expectedColumns);
      result.notes = `Gemini API fallback (${err.message}). Used offline OCR.`;
    }
  } else {
    console.log('[OCR] No Gemini API key provided. Using local Tesseract.js engine.');
    result = await extractWithTesseract(imageDataUrl, expectedColumns);
  }

  // Combine blur detection into result
  result.isBlurry = blurAnalysis.isBlurry;
  result.blurScore = Math.round(blurAnalysis.score);

  // If blurry or confidence < 75 or missing regNo, mark as needing manual review
  result.needsManualReview = result.isBlurry || result.confidence < 75 || !result.regNo || (result.uncertainFields && result.uncertainFields.length > 2);

  return result;
}
