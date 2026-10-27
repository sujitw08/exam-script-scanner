import React from 'react';
import { Camera, FileSpreadsheet, Laptop, Settings2, Download, Table } from 'lucide-react';

export default function MobileBottomNav({
  activeView,
  setActiveView,
  onOpenLaptopModal,
  onOpenTemplateModal,
  onExportExcel,
  isLaptopConnected,
  totalRecords = 0
}) {
  return (
    <nav className="mobile-bottom-nav">
      <button
        onClick={() => setActiveView('scanner')}
        className={`mobile-nav-item ${activeView === 'scanner' ? 'active' : ''}`}
      >
        <div className="icon-wrapper">
          <Camera size={20} />
        </div>
        <span>Scan</span>
      </button>

      <button
        onClick={() => setActiveView('spreadsheet')}
        className={`mobile-nav-item ${activeView === 'spreadsheet' ? 'active' : ''}`}
      >
        <div className="icon-wrapper" style={{ position: 'relative' }}>
          <Table size={20} />
          {totalRecords > 0 && (
            <span className="mobile-nav-badge">{totalRecords}</span>
          )}
        </div>
        <span>Marksheet</span>
      </button>

      <button
        onClick={onOpenLaptopModal}
        className="mobile-nav-item"
      >
        <div className="icon-wrapper" style={{ position: 'relative' }}>
          <Laptop size={20} />
          <span 
            className="status-dot" 
            style={{ background: isLaptopConnected ? '#10b981' : '#94a3b8' }} 
          />
        </div>
        <span>Laptop</span>
      </button>

      <button
        onClick={onOpenTemplateModal}
        className="mobile-nav-item"
      >
        <div className="icon-wrapper">
          <Settings2 size={20} />
        </div>
        <span>Template</span>
      </button>

      <button
        onClick={onExportExcel}
        className="mobile-nav-item export-action"
      >
        <div className="icon-wrapper">
          <Download size={20} />
        </div>
        <span>Excel</span>
      </button>
    </nav>
  );
}
