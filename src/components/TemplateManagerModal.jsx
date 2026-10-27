import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Settings, 
  Layers, 
  FileText 
} from 'lucide-react';
import { PRESET_TEMPLATES, parseExcelTemplate, parseTextTemplate } from '../services/excelService';

export default function TemplateManagerModal({
  isOpen,
  onClose,
  currentTemplate,
  onApplyTemplate,
  subjectCode,
  setSubjectCode,
  subjectName,
  setSubjectName
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'upload' | 'text'
  const [selectedPreset, setSelectedPreset] = useState(currentTemplate.id || 'CAT1');
  const [textTemplate, setTextTemplate] = useState('RegNo, StudentName, Q1 (2m), Q2 (2m), Q3 (2m), Q4 (2m), Q5 (2m), Q6 (13m), Q7 (13m), Q8 (14m), Total');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Handle preset select
  const handleSelectPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    const template = PRESET_TEMPLATES[presetKey];
    if (template) {
      onApplyTemplate(template);
    }
  };

  // Handle sample Excel file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    try {
      const parsed = await parseExcelTemplate(file);
      const customTemplate = {
        id: 'CUSTOM_UPLOADED',
        name: `Imported Template: ${file.name}`,
        examType: currentTemplate.examType || 'CAT1',
        maxMarks: 50,
        columns: parsed.columns
      };

      onApplyTemplate(customTemplate, parsed.existingStudents);
      setUploadSuccess(`Successfully imported ${parsed.columns.length} columns and ${parsed.existingStudents.length} student records from ${file.name}`);
    } catch (err) {
      setUploadError('Failed to parse Excel template: ' + err.message);
    }
  };

  // Handle text template submit
  const handleApplyTextTemplate = () => {
    const columns = parseTextTemplate(textTemplate);
    if (!columns || columns.length === 0) {
      alert('Please provide valid comma or tab separated column names.');
      return;
    }

    const customTemplate = {
      id: 'CUSTOM_TEXT',
      name: 'Custom Text Template',
      examType: currentTemplate.examType || 'CAT1',
      maxMarks: 50,
      columns
    };

    onApplyTemplate(customTemplate);
    alert('Text template applied successfully!');
    onClose();
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
        maxWidth: '650px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Excel Template & Subject Setup
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Match college marksheets or use standard university CAT templates
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Subject Info Inputs */}
        <div style={{ padding: '16px 24px', background: '#f1f5f9', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Subject Code
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                placeholder="e.g. CS8401"
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Subject Name
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Data Structures and Algorithms"
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem' }}
              />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#ffffff' }}>
          <button
            onClick={() => setActiveTab('preset')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'preset' ? '2.5px solid #4f46e5' : 'none',
              color: activeTab === 'preset' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            University Presets (CAT1/2/3)
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'upload' ? '2.5px solid #4f46e5' : 'none',
              color: activeTab === 'upload' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Upload Sample Excel (.xlsx)
          </button>

          <button
            onClick={() => setActiveTab('text')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'text' ? '2.5px solid #4f46e5' : 'none',
              color: activeTab === 'text' ? '#4f46e5' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Paste Text Template
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'preset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Select an exam structure standard for Anna University / autonomous engineering colleges:
              </p>

              {Object.keys(PRESET_TEMPLATES).map((key) => {
                const preset = PRESET_TEMPLATES[key];
                const isSelected = selectedPreset === key;

                return (
                  <div
                    key={key}
                    onClick={() => handleSelectPreset(key)}
                    style={{
                      border: isSelected ? '2px solid #4f46e5' : '1px solid var(--border)',
                      background: isSelected ? '#f5f3ff' : '#ffffff',
                      borderRadius: '14px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                          {preset.name}
                        </h4>
                        <span className="badge badge-cat">{preset.examType}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                        {preset.columns.filter(c => !['regNo', 'studentName', 'total'].includes(c.key)).length} Questions • Max {preset.maxMarks} Marks
                      </p>
                    </div>

                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid #4f46e5' : '2px solid #cbd5e1',
                      background: isSelected ? '#4f46e5' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}>
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
              }}>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="template-excel-file"
                />
                <label htmlFor="template-excel-file" style={{ cursor: 'pointer' }}>
                  <Upload size={36} color="#4f46e5" style={{ marginBottom: '12px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    Click to Upload Sample Excel Marksheet
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                    Supports .xlsx, .xls, .csv from your college or department
                  </p>
                </label>
              </div>

              {uploadSuccess && (
                <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  {uploadSuccess}
                </div>
              )}

              {uploadError && (
                <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Enter comma or tab separated column names:
              </label>
              <textarea
                rows={4}
                value={textTemplate}
                onChange={(e) => setTextTemplate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.88rem'
                }}
              />
              <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Example: <code>RegNo, StudentName, Q1(2m), Q2(2m), Q3(2m), Q4(2m), Q5(2m), Q6(13m), Q7(13m), Q8(14m), Total</code>
              </p>
              <button onClick={handleApplyTextTemplate} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                Apply Text Template
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
