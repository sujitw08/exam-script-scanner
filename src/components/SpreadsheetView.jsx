import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Edit3, 
  Search, 
  Eye, 
  Plus, 
  Filter, 
  Sparkles, 
  BarChart2, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ArrowUpDown
} from 'lucide-react';

export default function SpreadsheetView({
  records = [],
  currentTemplate,
  activeExam,
  onUpdateRecord,
  onDeleteRecord,
  onOpenManualEdit,
  onExportExcel,
  onSwitchToScanner
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExam, setFilterExam] = useState('ALL');
  const [sortField, setSortField] = useState('regNo');
  const [sortAsc, setSortAsc] = useState(true);
  const [editingCell, setEditingCell] = useState(null); // { recordId, key }
  const [editValue, setEditValue] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [mobileViewMode, setMobileViewMode] = useState('cards'); // 'cards' | 'table'

  // Filter records
  const filtered = records.filter(r => {
    const matchesSearch = 
      (r.regNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesExam = filterExam === 'ALL' || (r.examType || 'CAT1') === filterExam;
    return matchesSearch && matchesExam;
  });

  // Sort records
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'total') {
      valA = parseFloat(valA) || 0;
      valB = parseFloat(valB) || 0;
      return sortAsc ? valA - valB : valB - valA;
    }

    valA = String(valA || '');
    valB = String(valB || '');
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  // Quick statistics
  const totalCount = records.length;
  const totals = records.map(r => parseFloat(r.total) || 0);
  const avg = totalCount > 0 ? (totals.reduce((a, b) => a + b, 0) / totalCount).toFixed(1) : 0;
  const max = totalCount > 0 ? Math.max(...totals) : 0;
  const min = totalCount > 0 ? Math.min(...totals) : 0;
  const maxMarks = currentTemplate.maxMarks || 50;
  const passMarks = maxMarks * 0.5; // 50% pass criterion
  const passedCount = totals.filter(t => t >= passMarks).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  // Handle inline edit cell
  const startEdit = (rec, key, currentVal) => {
    setEditingCell({ id: rec.id, key });
    setEditValue(currentVal !== undefined ? String(currentVal) : '');
  };

  const saveInlineEdit = (rec) => {
    if (!editingCell) return;
    const { key } = editingCell;

    const updated = { ...rec };
    if (key === 'regNo') {
      updated.regNo = editValue.trim().toUpperCase();
    } else if (key === 'studentName') {
      updated.studentName = editValue.trim();
    } else if (key === 'total') {
      updated.total = parseFloat(editValue) || 0;
    } else {
      // Question mark
      updated.marks = { ...updated.marks, [key]: parseFloat(editValue) || 0 };
      // Recalculate total
      const questionCols = currentTemplate.columns.filter(c => !['regNo', 'studentName', 'total'].includes(c.key));
      updated.total = questionCols.reduce((sum, col) => sum + (parseFloat(updated.marks[col.key]) || 0), 0);
    }

    onUpdateRecord(updated);
    setEditingCell(null);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Evaluated Card */}
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Evaluated</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{totalCount}</span>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Answer Scripts</span>
          </div>
        </div>

        {/* Class Average */}
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Class Average</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5' }}>{avg}</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/{maxMarks} marks</span>
          </div>
        </div>

        {/* Highest & Lowest */}
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Highest / Lowest</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{max}</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{min}</span>
          </div>
        </div>

        {/* Pass Percentage */}
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Pass Rate (≥50%)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: passRate >= 75 ? '#10b981' : '#f59e0b' }}>
              {passRate}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>({passedCount}/{totalCount})</span>
          </div>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: '360px'
          }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Register No or Student Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                outline: 'none',
                fontSize: '0.88rem',
                background: '#ffffff'
              }}
            />
          </div>

          {/* Exam Filter */}
          <select
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 600,
              color: '#334155',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Exams</option>
            <option value="CAT1">CAT 1</option>
            <option value="CAT2">CAT 2</option>
            <option value="CAT3">CAT 3</option>
            <option value="Semester">Semester</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Mobile view toggle */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '10px',
            padding: '2px'
          }}>
            <button
              onClick={() => setMobileViewMode('cards')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: mobileViewMode === 'cards' ? '#fff' : 'transparent',
                color: mobileViewMode === 'cards' ? '#4f46e5' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Cards
            </button>
            <button
              onClick={() => setMobileViewMode('table')}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: mobileViewMode === 'table' ? '#fff' : 'transparent',
                color: mobileViewMode === 'table' ? '#4f46e5' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Table
            </button>
          </div>

          <button onClick={onSwitchToScanner} className="btn btn-primary" style={{ fontSize: '0.86rem' }}>
            <Plus size={16} />
            <span className="hidden-mobile">Scan Script</span>
          </button>

          <button onClick={onExportExcel} className="btn btn-success hidden-mobile" style={{ fontSize: '0.86rem' }}>
            <Download size={16} />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      {mobileViewMode === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {sorted.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', borderRadius: '16px' }}>
              <FileSpreadsheet size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
              <p style={{ fontWeight: 600, color: '#475569' }}>No Answer Scripts in Marksheet</p>
              <p style={{ fontSize: '0.82rem' }}>Scan scripts using your camera or try a sample script.</p>
            </div>
          ) : (
            sorted.map((rec, idx) => (
              <div key={rec.id} className="student-mobile-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>#{idx + 1}</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                      {rec.regNo || 'MISSING'}
                    </span>
                    <span className="badge badge-cat">{rec.examType || 'CAT1'}</span>
                  </div>

                  {/* Total Pill */}
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    padding: '3px 10px',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: '#15803d'
                  }}>
                    {rec.total} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>/{maxMarks}</span>
                  </div>
                </div>

                {rec.studentName && (
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
                    {rec.studentName}
                  </p>
                )}

                {/* Question-wise Pills */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  background: '#f8fafc',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  marginBottom: '10px'
                }}>
                  {currentTemplate.columns
                    .filter(c => !['regNo', 'studentName', 'total'].includes(c.key))
                    .map(col => {
                      const mark = rec.marks?.[col.key] !== undefined ? rec.marks[col.key] : (rec[col.key] || 0);
                      return (
                        <span
                          key={col.key}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#ffffff',
                            border: '1px solid var(--border)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            color: '#334155'
                          }}
                        >
                          {col.label}: <strong style={{ color: '#4f46e5' }}>{mark}</strong>
                        </span>
                      );
                    })}
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {rec.imageUrl && (
                      <button
                        onClick={() => setPreviewImage(rec.imageUrl)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'transparent',
                          border: 'none',
                          color: '#4f46e5',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} />
                        <span>View Photo</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onOpenManualEdit(rec)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteRecord(rec.id)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '8px',
                        border: '1px solid #fee2e2',
                        background: '#ffffff',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Excel Data Grid Table */}
      <div 
        className="glass-panel" 
        style={{
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          display: mobileViewMode === 'cards' ? 'none' : 'block'
        }}
      >
        <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '12px 14px', width: '50px', color: '#64748b' }}>#</th>
                <th style={{ padding: '12px 14px', width: '60px', color: '#64748b' }}>Photo</th>
                
                <th 
                  onClick={() => toggleSort('regNo')}
                  style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Register No</span>
                    <ArrowUpDown size={14} color="#94a3b8" />
                  </div>
                </th>

                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>
                  Student Name
                </th>

                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>
                  Exam
                </th>

                {/* Question Columns */}
                {currentTemplate.columns
                  .filter(c => !['regNo', 'studentName', 'total'].includes(c.key))
                  .map(col => (
                    <th
                      key={col.key}
                      style={{
                        padding: '12px 10px',
                        fontWeight: 700,
                        color: '#475569',
                        textAlign: 'center',
                        minWidth: '70px'
                      }}
                    >
                      <div>{col.label}</div>
                      {col.max && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({col.max}m)</span>}
                    </th>
                  ))}

                {/* Grand Total Column */}
                <th
                  onClick={() => toggleSort('total')}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 800,
                    color: '#166534',
                    background: '#f0fdf4',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minWidth: '95px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>Total</span>
                    <ArrowUpDown size={14} color="#166534" />
                  </div>
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'center', width: '100px', color: '#64748b' }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={currentTemplate.columns.length + 4} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                    <FileSpreadsheet size={42} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>No Answer Scripts in Marksheet yet</p>
                    <p style={{ fontSize: '0.85rem' }}>Scan answer scripts using your mobile camera or load a sample script to get started.</p>
                  </td>
                </tr>
              ) : (
                sorted.map((rec, idx) => {
                  return (
                    <tr
                      key={rec.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* S.No */}
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.82rem' }}>
                        {idx + 1}
                      </td>

                      {/* Photo Thumbnail */}
                      <td style={{ padding: '8px 10px' }}>
                        {rec.imageUrl ? (
                          <div
                            onClick={() => setPreviewImage(rec.imageUrl)}
                            style={{
                              width: '38px',
                              height: '48px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              position: 'relative'
                            }}
                            title="Click to view full answer script image"
                          >
                            <img src={rec.imageUrl} alt="Script" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>N/A</span>
                        )}
                      </td>

                      {/* Register Number (Inline Editable) */}
                      <td style={{ padding: '10px 14px', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#1e293b' }}>
                        {editingCell?.id === rec.id && editingCell?.key === 'regNo' ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                            onBlur={() => saveInlineEdit(rec)}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(rec)}
                            style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #4f46e5' }}
                          />
                        ) : (
                          <span
                            onClick={() => startEdit(rec, 'regNo', rec.regNo)}
                            style={{ cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: '4px' }}
                            title="Click to edit Register No"
                          >
                            {rec.regNo || 'MISSING'}
                          </span>
                        )}
                      </td>

                      {/* Student Name */}
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {editingCell?.id === rec.id && editingCell?.key === 'studentName' ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(rec)}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(rec)}
                            style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #4f46e5' }}
                          />
                        ) : (
                          <span
                            onClick={() => startEdit(rec, 'studentName', rec.studentName)}
                            style={{ cursor: 'pointer' }}
                            title="Click to edit Student Name"
                          >
                            {rec.studentName || '-'}
                          </span>
                        )}
                      </td>

                      {/* Exam Type */}
                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge badge-cat">{rec.examType || 'CAT1'}</span>
                      </td>

                      {/* Question Marks Columns */}
                      {currentTemplate.columns
                        .filter(c => !['regNo', 'studentName', 'total'].includes(c.key))
                        .map(col => {
                          const mark = rec.marks?.[col.key] !== undefined ? rec.marks[col.key] : (rec[col.key] || 0);
                          const isEditing = editingCell?.id === rec.id && editingCell?.key === col.key;

                          return (
                            <td
                              key={col.key}
                              style={{
                                padding: '10px 10px',
                                textAlign: 'center',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontWeight: 600,
                                color: '#1e293b'
                              }}
                            >
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => saveInlineEdit(rec)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(rec)}
                                  style={{ width: '55px', padding: '3px', textAlign: 'center', border: '1px solid #4f46e5', borderRadius: '4px' }}
                                />
                              ) : (
                                <span
                                  onClick={() => startEdit(rec, col.key, mark)}
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: '#f1f5f9',
                                    cursor: 'pointer'
                                  }}
                                  title="Click to edit mark"
                                >
                                  {mark}
                                </span>
                              )}
                            </td>
                          );
                        })}

                      {/* Grand Total */}
                      <td
                        style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                          background: '#f0fdf4',
                          fontWeight: 800,
                          fontSize: '1rem',
                          fontFamily: '"JetBrains Mono", monospace',
                          color: '#15803d'
                        }}
                      >
                        {rec.total}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => onOpenManualEdit(rec)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: '#fff',
                              color: '#4f46e5',
                              cursor: 'pointer'
                            }}
                            title="Side-by-side script review"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => onDeleteRecord(rec.id)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              background: '#fff',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                            title="Delete script record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Image Zoom Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }}>
            <img
              src={previewImage}
              alt="Answer script proof"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
            />
            <span style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#000',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem'
            }}>
              Click anywhere to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
