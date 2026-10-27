import * as XLSX from 'xlsx';

/**
 * Predefined exam templates commonly used in universities and colleges
 */
export const PRESET_TEMPLATES = {
  CAT1: {
    id: 'CAT1',
    name: 'CAT 1 (50 Marks)',
    examType: 'CAT1',
    maxMarks: 50,
    columns: [
      { key: 'regNo', label: 'Register No', required: true, width: 18 },
      { key: 'studentName', label: 'Student Name', required: false, width: 22 },
      { key: 'q1', label: 'Q1 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q2', label: 'Q2 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q3', label: 'Q3 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q4', label: 'Q4 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q5', label: 'Q5 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q6', label: 'Q6 (13m)', max: 13, part: 'Part B', width: 12 },
      { key: 'q7', label: 'Q7 (13m)', max: 13, part: 'Part B', width: 12 },
      { key: 'q8', label: 'Q8 (14m)', max: 14, part: 'Part B', width: 12 },
      { key: 'total', label: 'Total (50m)', max: 50, isTotal: true, width: 14 }
    ]
  },
  CAT2: {
    id: 'CAT2',
    name: 'CAT 2 (50 Marks)',
    examType: 'CAT2',
    maxMarks: 50,
    columns: [
      { key: 'regNo', label: 'Register No', required: true, width: 18 },
      { key: 'studentName', label: 'Student Name', required: false, width: 22 },
      { key: 'q1', label: 'Q1 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q2', label: 'Q2 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q3', label: 'Q3 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q4', label: 'Q4 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q5', label: 'Q5 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q6', label: 'Q6 (13m)', max: 13, part: 'Part B', width: 12 },
      { key: 'q7', label: 'Q7 (13m)', max: 13, part: 'Part B', width: 12 },
      { key: 'q8', label: 'Q8 (14m)', max: 14, part: 'Part B', width: 12 },
      { key: 'total', label: 'Total (50m)', max: 50, isTotal: true, width: 14 }
    ]
  },
  CAT3: {
    id: 'CAT3',
    name: 'CAT 3 / Model Exam (100 Marks)',
    examType: 'CAT3',
    maxMarks: 100,
    columns: [
      { key: 'regNo', label: 'Register No', required: true, width: 18 },
      { key: 'studentName', label: 'Student Name', required: false, width: 22 },
      { key: 'q1', label: 'Q1 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q2', label: 'Q2 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q3', label: 'Q3 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q4', label: 'Q4 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q5', label: 'Q5 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q6', label: 'Q6 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q7', label: 'Q7 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q8', label: 'Q8 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q9', label: 'Q9 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q10', label: 'Q10 (2m)', max: 2, part: 'Part A', width: 10 },
      { key: 'q11', label: 'Q11 (16m)', max: 16, part: 'Part B', width: 12 },
      { key: 'q12', label: 'Q12 (16m)', max: 16, part: 'Part B', width: 12 },
      { key: 'q13', label: 'Q13 (16m)', max: 16, part: 'Part B', width: 12 },
      { key: 'q14', label: 'Q14 (16m)', max: 16, part: 'Part B', width: 12 },
      { key: 'q15', label: 'Q15 (16m)', max: 16, part: 'Part B', width: 12 },
      { key: 'total', label: 'Total (100m)', max: 100, isTotal: true, width: 14 }
    ]
  }
};

/**
 * Parses uploaded Excel workbook template (.xlsx or .xls)
 */
export async function parseExcelTemplate(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!json || json.length === 0) {
          throw new Error('The uploaded file appears to be empty.');
        }

        // Find header row (row containing "Register", "Reg", "Roll", or "Total")
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(10, json.length); i++) {
          const rowStr = (json[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('reg') || rowStr.includes('roll') || rowStr.includes('marks') || rowStr.includes('q1')) {
            headerRowIndex = i;
            break;
          }
        }

        const rawHeaders = json[headerRowIndex] || [];
        const detectedColumns = [];
        let hasRegNo = false;
        let hasTotal = false;

        rawHeaders.forEach((col, idx) => {
          if (!col) return;
          const label = String(col).trim();
          const lower = label.toLowerCase();

          let key = `col_${idx}`;
          let isTotal = false;
          let required = false;

          if (lower.includes('reg') || lower.includes('roll') || lower.includes('id')) {
            key = 'regNo';
            required = true;
            hasRegNo = true;
          } else if (lower.includes('name') || lower.includes('student')) {
            key = 'studentName';
          } else if (lower.includes('total') || lower === 'tot') {
            key = 'total';
            isTotal = true;
            hasTotal = true;
          } else if (/^q\d+/i.test(lower)) {
            key = lower.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          }

          detectedColumns.push({
            key,
            label,
            originalIndex: idx,
            required,
            isTotal,
            width: isTotal ? 14 : key === 'regNo' ? 18 : 12
          });
        });

        if (!hasTotal) {
          detectedColumns.push({ key: 'total', label: 'Total', isTotal: true, width: 14 });
        }

        // Extract any existing students / roster from the template rows
        const existingStudents = [];
        for (let r = headerRowIndex + 1; r < json.length; r++) {
          const row = json[r];
          if (!row || row.length === 0) continue;

          const student = {};
          detectedColumns.forEach(col => {
            if (col.originalIndex !== undefined && row[col.originalIndex] !== undefined) {
              student[col.key] = row[col.originalIndex];
            }
          });

          if (student.regNo) {
            existingStudents.push(student);
          }
        }

        resolve({
          sheetName: firstSheetName,
          columns: detectedColumns,
          existingStudents,
          headerRowIndex
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses user-provided text template (comma separated, pipe separated, or tab separated)
 * e.g. "RegNo, StudentName, Q1, Q2, Q3, Q4, Q5, Total"
 */
export function parseTextTemplate(text) {
  if (!text || !text.trim()) return null;

  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headerLine = lines[0];
  const delimiters = [',', '\t', '|', ';'];
  let chosenDelim = ',';
  let maxCount = 0;

  for (const d of delimiters) {
    const count = headerLine.split(d).length;
    if (count > maxCount) {
      maxCount = count;
      chosenDelim = d;
    }
  }

  const rawCols = headerLine.split(chosenDelim).map(c => c.trim()).filter(Boolean);
  const columns = rawCols.map((col, idx) => {
    const lower = col.toLowerCase();
    let key = `q${idx + 1}`;
    let isTotal = false;
    let required = false;

    if (lower.includes('reg') || lower.includes('roll') || lower.includes('id')) {
      key = 'regNo';
      required = true;
    } else if (lower.includes('name') || lower.includes('student')) {
      key = 'studentName';
    } else if (lower.includes('total') || lower === 'tot') {
      key = 'total';
      isTotal = true;
    } else if (/q\d+/i.test(lower)) {
      key = lower.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    }

    return {
      key,
      label: col,
      required,
      isTotal,
      width: isTotal ? 14 : key === 'regNo' ? 18 : 12
    };
  });

  return columns;
}

/**
 * Exports current exam marksheet into a formatted Excel .xlsx file
 */
export function exportToExcel({
  examType = 'CAT1',
  subjectCode = 'CS8401',
  subjectName = 'Data Structures',
  columns = [],
  records = []
}) {
  const wb = XLSX.utils.book_new();

  // Create Title and Header Information
  const headerData = [
    [`EXAMINATION EVALUATION MARKSHEET - ${examType.toUpperCase()}`],
    [`Subject: ${subjectCode} - ${subjectName}`, '', '', `Generated: ${new Date().toLocaleDateString()}`],
    [`Total Answer Scripts Evaluated: ${records.length}`],
    [] // empty row
  ];

  // Column Labels row
  const colLabels = columns.map(c => c.label || c.key);
  headerData.push(colLabels);

  // Data rows sorted by Register Number
  const sortedRecords = [...records].sort((a, b) => (String(a.regNo || '')).localeCompare(String(b.regNo || '')));

  const dataRows = sortedRecords.map(rec => {
    return columns.map(col => {
      if (col.key === 'regNo') return rec.regNo || '';
      if (col.key === 'studentName') return rec.studentName || '';
      if (col.key === 'total' || col.isTotal) {
        return Number(rec.total) || 0;
      }
      // Question marks
      return rec.marks?.[col.key] !== undefined ? Number(rec.marks[col.key]) : (rec[col.key] || 0);
    });
  });

  // Calculate summary stats row
  const statsRows = [];
  if (sortedRecords.length > 0) {
    const totalColIdx = columns.findIndex(c => c.key === 'total' || c.isTotal);
    const totals = sortedRecords.map(r => Number(r.total) || 0);
    const avg = (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1);
    const max = Math.max(...totals);
    const min = Math.min(...totals);

    statsRows.push([]);
    const summaryRow = new Array(columns.length).fill('');
    summaryRow[0] = 'SUMMARY STATISTICS:';
    if (totalColIdx >= 0) {
      summaryRow[totalColIdx] = `Avg: ${avg} | Max: ${max} | Min: ${min}`;
    }
    statsRows.push(summaryRow);
  }

  const allRows = [...headerData, ...dataRows, ...statsRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = columns.map(col => ({ wch: col.width || 12 }));

  XLSX.utils.book_append_sheet(wb, ws, `${examType}_Marks`);

  const fileName = `${subjectCode}_${examType}_Marksheet_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
