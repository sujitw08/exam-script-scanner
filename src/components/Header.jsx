import React from 'react';
import { 
  Laptop, 
  Sparkles, 
  FileSpreadsheet, 
  Settings2, 
  Download, 
  Camera, 
  Table, 
  Wifi, 
  WifiOff,
  GraduationCap
} from 'lucide-react';

export default function Header({
  activeView,
  setActiveView,
  activeExam,
  setActiveExam,
  subjectCode,
  setSubjectCode,
  subjectName,
  setSubjectName,
  isLaptopConnected,
  hasGeminiKey,
  onOpenLaptopModal,
  onOpenGeminiModal,
  onOpenTemplateModal,
  onExportExcel,
  totalRecords = 0
}) {
  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 18px',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand & Exam Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                ScriptScan <span style={{ color: '#4f46e5' }}>Pro</span>
              </h1>
              <span className="badge badge-cat">{activeExam}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
              {subjectCode} • {subjectName} ({totalRecords} scripts evaluated)
            </p>
          </div>
        </div>

        {/* View Switcher: Scanner vs Excel Spreadsheet (Desktop only, Mobile uses Bottom Nav) */}
        <div className="hidden-mobile" style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '12px',
          padding: '3px',
          gap: '3px'
        }}>
          <button
            onClick={() => setActiveView('scanner')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: activeView === 'scanner' ? '#ffffff' : 'transparent',
              color: activeView === 'scanner' ? '#4f46e5' : '#64748b',
              boxShadow: activeView === 'scanner' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Camera size={16} />
            <span>Scan Scripts</span>
          </button>

          <button
            onClick={() => setActiveView('spreadsheet')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: activeView === 'spreadsheet' ? '#ffffff' : 'transparent',
              color: activeView === 'spreadsheet' ? '#4f46e5' : '#64748b',
              boxShadow: activeView === 'spreadsheet' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Table size={16} />
            <span>Excel Sheet ({totalRecords})</span>
          </button>
        </div>

        {/* Action Controls & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Exam Type Selector */}
          <select
            value={activeExam}
            onChange={(e) => setActiveExam(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#1e293b',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="CAT1">CAT 1 (50m)</option>
            <option value="CAT2">CAT 2 (50m)</option>
            <option value="CAT3">CAT 3 / Model (100m)</option>
            <option value="Semester">Semester Exam</option>
          </select>

          {/* Laptop Connection Status Pill */}
          <button
            onClick={onOpenLaptopModal}
            title={isLaptopConnected ? "Connected to Laptop Hub" : "Connect with Laptop"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '10px',
              border: isLaptopConnected ? '1px solid #a7f3d0' : '1px solid var(--border)',
              background: isLaptopConnected ? '#ecfdf5' : '#ffffff',
              color: isLaptopConnected ? '#065f46' : '#64748b',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isLaptopConnected ? <Wifi size={15} color="#10b981" /> : <Laptop size={15} />}
            <span className="hidden-sm">
              {isLaptopConnected ? 'Laptop Live' : 'Connect Laptop'}
            </span>
          </button>

          {/* Gemini AI Key Status */}
          <button
            onClick={onOpenGeminiModal}
            title="Configure Gemini Vision AI API Key"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '10px',
              border: hasGeminiKey ? '1px solid #c7d2fe' : '1px solid #fed7aa',
              background: hasGeminiKey ? '#eef2ff' : '#fff7ed',
              color: hasGeminiKey ? '#4338ca' : '#c2410c',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={15} color={hasGeminiKey ? '#4f46e5' : '#ea580c'} />
            <span className="hidden-sm">
              {hasGeminiKey ? 'Gemini AI Active' : 'AI Setup'}
            </span>
          </button>

          {/* Template Config (Desktop only, mobile has bottom bar) */}
          <button
            onClick={onOpenTemplateModal}
            className="btn btn-secondary hidden-mobile"
            style={{ padding: '7px 10px', borderRadius: '10px' }}
            title="Custom Excel Template Settings"
          >
            <Settings2 size={16} />
          </button>

          {/* Export Excel Button (Desktop only, mobile has bottom bar) */}
          <button
            onClick={onExportExcel}
            className="btn btn-success hidden-mobile"
            style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem' }}
            title="Download Excel Sheet (.xlsx)"
          >
            <Download size={15} />
            <span>Excel</span>
          </button>
        </div>
      </div>
    </header>
  );
}
