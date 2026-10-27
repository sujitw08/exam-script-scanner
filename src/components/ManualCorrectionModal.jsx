import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  AlertTriangle, 
  Sparkles, 
  Calculator, 
  Laptop, 
  Maximize2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function ManualCorrectionModal({
  scriptRecord,
  currentTemplate,
  onSave,
  onDiscard,
  isLaptopConnected
}) {
  if (!scriptRecord) return null;

  const [regNo, setRegNo] = useState(scriptRecord.regNo || '');
  const [studentName, setStudentName] = useState(scriptRecord.studentName || '');
  const [examType, setExamType] = useState(scriptRecord.examType || 'CAT1');
  const [marks, setMarks] = useState({ ...scriptRecord.marks });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [notes, setNotes] = useState(scriptRecord.notes || '');

  // Extract question columns
  const questionCols = currentTemplate.columns.filter(
    (col) => !['regNo', 'studentName', 'total'].includes(col.key)
  );

  // Auto-calculate sum of question marks
  const calculatedTotal = questionCols.reduce((sum, col) => {
    const val = parseFloat(marks[col.key]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Sync state if record changes
  useEffect(() => {
    setRegNo(scriptRecord.regNo || '');
    setStudentName(scriptRecord.studentName || '');
    setExamType(scriptRecord.examType || 'CAT1');
    setMarks({ ...scriptRecord.marks });
  }, [scriptRecord]);

  const handleMarkChange = (key, value) => {
    const num = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
    setMarks(prev => ({
      ...prev,
      [key]: num
    }));
  };

  const applyQuickMark = (key, val, maxVal) => {
    let finalVal = val;
    if (val === 'max') finalVal = maxVal;
    if (val === 'zero') finalVal = 0;
    setMarks(prev => ({
      ...prev,
      [key]: finalVal
    }));
  };

  const handleSave = () => {
    if (!regNo.trim()) {
      alert('Please enter or verify the student Register Number.');
      return;
    }

    const updated = {
      ...scriptRecord,
      regNo: regNo.trim().toUpperCase(),
      studentName: studentName.trim(),
      examType,
      marks,
      total: calculatedTotal,
      confidence: 100, // Teacher has verified!
      uncertainFields: [],
      needsManualReview: false,
      reviewedAt: new Date().toLocaleTimeString()
    };

    onSave(updated);
  };

  const isFieldUncertain = (fieldKey) => {
    return (scriptRecord.uncertainFields || []).includes(fieldKey) || 
      (fieldKey === 'regNo' && !regNo);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: scriptRecord.isBlurry ? '#fee2e2' : '#e0e7ff',
              color: scriptRecord.isBlurry ? '#b91c1c' : '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {scriptRecord.isBlurry ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {scriptRecord.isBlurry ? 'Manual Correction Required' : 'Verify Scanned Script'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {scriptRecord.isBlurry 
                  ? 'Image clarity was low. Please confirm Register No & Marks against the photo.' 
                  : `OCR Confidence: ${scriptRecord.confidence}% • Engine: ${scriptRecord.engine || 'AI'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onDiscard}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content Body: Split Screen (Image Left, Fields Right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Left Column: Image Preview with Zoom/Rotate Controls */}
          <div style={{
            background: '#090d16',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            borderRight: '1px solid var(--border)',
            minHeight: '340px'
          }}>
            {/* Image Toolbar */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '4px',
              borderRadius: '10px',
              backdropFilter: 'blur(8px)'
            }}>
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px', background: 'transparent', color: '#fff', border: 'none' }}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px', background: 'transparent', color: '#fff', border: 'none' }}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px', background: 'transparent', color: '#fff', border: 'none' }}
                title="Rotate 90°"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={() => setHighContrast(!highContrast)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: highContrast ? '#4f46e5' : '#334155',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                B&W
              </button>
            </div>

            {/* Script Image Display */}
            <div style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: '12px',
              background: '#000000'
            }}>
              {scriptRecord.imageUrl ? (
                <img
                  src={scriptRecord.imageUrl}
                  alt="Scanned Answer Script"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '440px',
                    objectFit: 'contain',
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    filter: highContrast ? 'contrast(180%) grayscale(100%)' : 'none',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No Image Captured</div>
              )}
            </div>

            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
              Pinch or use zoom controls to inspect handwriting details
            </span>
          </div>

          {/* Right Column: Editable Fields & Dynamic Total */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Blurry / Low Confidence Alert Banner */}
            {scriptRecord.isBlurry && (
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#991b1b',
                fontSize: '0.85rem'
              }}>
                <AlertTriangle size={18} />
                <span>
                  <strong>Blurry script detected.</strong> Verify the Register Number and marks before saving to Excel.
                </span>
              </div>
            )}

            {/* Student Register Number & Exam Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Student Register / Roll No <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                  placeholder="e.g. 7376221CS101"
                  className={isFieldUncertain('regNo') ? 'unclear-field-highlight' : ''}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Exam Type
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  <option value="CAT1">CAT 1</option>
                  <option value="CAT2">CAT 2</option>
                  <option value="CAT3">CAT 3</option>
                  <option value="Semester">Semester</option>
                </select>
              </div>
            </div>

            {/* Optional Student Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Student Name (Optional)
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student Name (if written on front sheet)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  outline: 'none'
                }}
              />
            </div>

            {/* Question-wise Marks Inputs */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Question-wise Marks Entry
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {questionCols.length} Questions in {examType}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '4px'
              }}>
                {questionCols.map((col) => {
                  const uncertain = isFieldUncertain(col.key);
                  const markVal = marks[col.key] !== undefined ? marks[col.key] : '';

                  return (
                    <div
                      key={col.key}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                          {col.label}
                        </span>
                        {col.max && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            /{col.max}m
                          </span>
                        )}
                      </div>

                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={col.max || 100}
                        value={markVal}
                        onChange={(e) => handleMarkChange(col.key, e.target.value)}
                        className={uncertain ? 'unclear-field-highlight' : ''}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border)',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 700,
                          fontSize: '1rem',
                          textAlign: 'center',
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      />

                      {/* Quick Steppers */}
                      {col.max && (
                        <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => applyQuickMark(col.key, 'max', col.max)}
                            style={{
                              flex: 1,
                              fontSize: '0.68rem',
                              padding: '2px 0',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              background: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            Full
                          </button>
                          <button
                            type="button"
                            onClick={() => applyQuickMark(col.key, 'zero', col.max)}
                            style={{
                              flex: 1,
                              fontSize: '0.68rem',
                              padding: '2px 0',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              background: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            0
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculated Grand Total Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  Auto Calculated Total
                </span>
                <p style={{ fontSize: '0.78rem', color: '#15803d' }}>
                  Sum of all question marks
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: '"JetBrains Mono", monospace',
                  color: '#14532d'
                }}>
                  {calculatedTotal}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#15803d' }}>
                  /{currentTemplate.maxMarks || 50}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={onDiscard}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                <Check size={18} />
                <span>Save to Excel Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
