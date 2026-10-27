import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Flashlight, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Zap,
  Info
} from 'lucide-react';
import { runHybridOCR } from '../services/ocrEngine';

export default function ScannerView({
  activeExam,
  currentTemplate,
  geminiApiKey,
  onScriptExtracted,
  isProcessing,
  setIsProcessing
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // Back camera on mobile
  const [cameraError, setCameraError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [scanStats, setScanStats] = useState({ scannedToday: 0 });

  // Start Camera
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable or blocked. You can upload photos or try a sample script below.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    // Attempt camera start on mount
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
        setTorchOn(!torchOn);
      } else {
        alert('Torch/Flashlight is not supported by this device camera.');
      }
    } catch (err) {
      console.warn('Torch error:', err);
    }
  };

  // Flip Camera
  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture from live video stream
  const capturePhoto = async () => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    setProcessingStatus('Capturing high-res frame...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      await processImage(imageDataUrl);
    } catch (err) {
      alert('Capture failed: ' + err.message);
      setIsProcessing(false);
    }
  };

  // Process image using OCR Engine
  const processImage = async (imageDataUrl) => {
    setIsProcessing(true);
    setProcessingStatus('Analyzing answer sheet & marks table...');

    try {
      setProcessingStatus('Running smart extraction (Reg No & Question Marks)...');
      const ocrResult = await runHybridOCR(imageDataUrl, {
        apiKey: geminiApiKey,
        expectedColumns: currentTemplate.columns
      });

      setProcessingStatus('Validating extracted marks against total...');
      
      const record = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        regNo: ocrResult.regNo || '',
        studentName: ocrResult.studentName || '',
        examType: ocrResult.examType || activeExam,
        marks: ocrResult.marks || {},
        total: ocrResult.total || 0,
        confidence: ocrResult.confidence || 0,
        uncertainFields: ocrResult.uncertainFields || [],
        isBlurry: ocrResult.isBlurry || false,
        blurScore: ocrResult.blurScore || 0,
        needsManualReview: ocrResult.needsManualReview,
        engine: ocrResult.engine,
        imageUrl: imageDataUrl,
        timestamp: new Date().toLocaleTimeString()
      };

      setScanStats(prev => ({ scannedToday: prev.scannedToday + 1 }));
      onScriptExtracted(record);
    } catch (err) {
      console.error('Processing error:', err);
      // Even on total OCR error, open manual entry with image so the teacher doesn't lose progress!
      const fallbackRecord = {
        id: `rec_${Date.now()}`,
        regNo: '',
        studentName: '',
        examType: activeExam,
        marks: {},
        total: 0,
        confidence: 20,
        uncertainFields: ['regNo', 'total'],
        isBlurry: true,
        needsManualReview: true,
        engine: 'Manual Required',
        imageUrl: imageDataUrl,
        timestamp: new Date().toLocaleTimeString()
      };
      onScriptExtracted(fallbackRecord);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Handle uploaded files
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageDataUrl = event.target.result;
      await processImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Generate realistic Sample Answer Script for instant one-click testing
  const generateSampleAnswerScript = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    // Paper background with subtle texture
    ctx.fillStyle = '#fdfcf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // College Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COLLEGE OF ENGINEERING & TECHNOLOGY', canvas.width / 2, 85);

    ctx.font = '600 20px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`CONTINUOUS ASSESSMENT TEST - ${activeExam}`, canvas.width / 2, 120);
    ctx.fillText('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', canvas.width / 2, 150);

    // Student Info Box
    ctx.strokeRect(60, 180, canvas.width - 120, 140);
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('REGISTER NO:', 80, 225);
    ctx.fillText('STUDENT NAME:', 80, 265);
    ctx.fillText('SUBJECT:', 80, 300);

    // Realistic handwritten style entries
    const sampleRegNos = ['7376221CS108', '7376221CS142', '7376221CS189', '21CS045', '21CS098'];
    const sampleNames = ['Aarav Sharma', 'Deepika Ramesh', 'Siddharth V', 'Kavya Sundaram'];
    const chosenRegNo = sampleRegNos[Math.floor(Math.random() * sampleRegNos.length)];
    const chosenName = sampleNames[Math.floor(Math.random() * sampleNames.length)];

    ctx.font = '600 24px "Courier New", monospace';
    ctx.fillStyle = '#1e40af'; // Blue ink
    ctx.fillText(chosenRegNo, 260, 225);
    ctx.fillText(chosenName, 260, 265);
    ctx.fillText('CS8401 - Data Structures & Algorithms', 260, 300);

    // Marks Evaluation Table
    ctx.strokeRect(60, 360, canvas.width - 120, 680);
    
    // Table Header
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(60, 360, canvas.width - 120, 50);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Part', 90, 395);
    ctx.fillText('Q.No', 220, 395);
    ctx.fillText('Max Marks', 400, 395);
    ctx.fillText('Marks Awarded', 650, 395);

    // Rows
    const questions = [
      { q: 'Q1', max: 2, marks: 2, part: 'Part A' },
      { q: 'Q2', max: 2, marks: 1.5, part: 'Part A' },
      { q: 'Q3', max: 2, marks: 2, part: 'Part A' },
      { q: 'Q4', max: 2, marks: 2, part: 'Part A' },
      { q: 'Q5', max: 2, marks: 1, part: 'Part A' },
      { q: 'Q6', max: 13, marks: 11, part: 'Part B' },
      { q: 'Q7', max: 13, marks: 12.5, part: 'Part B' },
      { q: 'Q8', max: 14, marks: 13, part: 'Part B' },
    ];

    let startY = 460;
    let totalScore = 0;

    questions.forEach((item, idx) => {
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(60, startY + 10);
      ctx.lineTo(canvas.width - 60, startY + 10);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '18px sans-serif';
      ctx.fillText(item.part, 90, startY);
      ctx.fillText(item.q, 230, startY);
      ctx.fillText(String(item.max), 430, startY);

      // Random small jitter in marks
      const markGiven = Math.min(item.max, Math.max(0, item.marks - (Math.random() > 0.5 ? 0.5 : 0)));
      totalScore += markGiven;

      ctx.font = 'bold 26px "Courier New", monospace';
      ctx.fillStyle = '#b91c1c'; // Red evaluator ink
      ctx.fillText(String(markGiven), 700, startY);

      startY += 55;
    });

    // Grand Total Row
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(60, startY + 10, canvas.width - 120, 70);
    ctx.strokeRect(60, startY + 10, canvas.width - 120, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('GRAND TOTAL (out of 50):', 120, startY + 55);

    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(String(totalScore), 700, startY + 55);

    // Evaluator signature
    ctx.font = 'italic 22px cursive';
    ctx.fillStyle = '#0284c7';
    ctx.fillText('Staff Signature: Dr. R. Murugan', 580, canvas.height - 100);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    processImage(dataUrl);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      position: 'relative',
      minHeight: 'calc(100vh - 75px)',
      background: '#090d16'
    }}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={false}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Camera Viewport */}
      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            padding: '30px',
            textAlign: 'center'
          }}>
            <Camera size={54} color="#64748b" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#f8fafc', fontSize: '1.2rem', marginBottom: '8px' }}>
              Camera Scanner Ready
            </h3>
            <p style={{ maxWidth: '400px', fontSize: '0.9rem', marginBottom: '20px' }}>
              {cameraError || 'Position the student answer script front sheet with Register Number and Marks table inside frame.'}
            </p>
            <button onClick={() => startCamera()} className="btn btn-primary">
              <Camera size={18} />
              Enable Camera
            </button>
          </div>
        )}

        {/* Framing Edge Guides overlay */}
        {cameraActive && (
          <div className="camera-guide-box">
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="scan-laser" />
            
            <div style={{
              position: 'absolute',
              top: '12px',
              left: 0,
              right: 0,
              textAlign: 'center',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span>Align Register No & Marks Table</span>
            </div>
          </div>
        )}

        {/* Processing State Overlay */}
        {isProcessing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '4px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: '#6366f1',
              animation: 'spin 0.9s linear infinite',
              marginBottom: '20px'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              Scanning Answer Script...
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', maxWidth: '320px' }}>
              {processingStatus}
            </p>
            <span className="badge badge-cat" style={{ marginTop: '16px' }}>
              Exam: {activeExam}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div style={{
        padding: '18px 24px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 20
      }}>
        {/* Quick Demo & Help Info bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#94a3b8',
          fontSize: '0.82rem',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={15} color="#eab308" />
            <span>Auto-detects blurry images & prompts manual correction</span>
          </div>

          <button
            onClick={generateSampleAnswerScript}
            disabled={isProcessing}
            style={{
              background: 'rgba(99, 102, 241, 0.18)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} />
            <span>Try Sample Answer Script</span>
          </button>
        </div>

        {/* Shutter & Utility Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          maxWidth: '500px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Torch button */}
          <button
            onClick={toggleTorch}
            className="btn btn-secondary btn-icon"
            style={{
              background: torchOn ? '#fef08a' : 'rgba(255, 255, 255, 0.12)',
              color: torchOn ? '#854d0e' : '#ffffff',
              border: 'none'
            }}
            title="Toggle Flashlight / Torch"
          >
            <Flashlight size={20} />
          </button>

          {/* Big Shutter / Capture Button */}
          <button
            onClick={capturePhoto}
            disabled={isProcessing || !cameraActive}
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '4px solid #4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 24px rgba(79, 70, 229, 0.5)',
              transform: isProcessing ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.15s ease'
            }}
            title="Capture & Scan Answer Script"
          >
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Camera size={28} />
            </div>
          </button>

          {/* Upload Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary btn-icon"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: 'none'
            }}
            title="Upload Script Photo from Storage"
          >
            <Upload size={20} />
          </button>

          {/* Flip Camera Button */}
          <button
            onClick={flipCamera}
            className="btn btn-secondary btn-icon"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: 'none'
            }}
            title="Flip Camera (Front/Back)"
          >
            <RotateCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
