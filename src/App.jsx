import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import ScannerView from './components/ScannerView';
import SpreadsheetView from './components/SpreadsheetView';
import ManualCorrectionModal from './components/ManualCorrectionModal';
import LaptopConnectModal from './components/LaptopConnectModal';
import TemplateManagerModal from './components/TemplateManagerModal';
import GeminiSettingsModal from './components/GeminiSettingsModal';
import MobileBottomNav from './components/MobileBottomNav';
import { PRESET_TEMPLATES, exportToExcel } from './services/excelService';
import { syncService } from './services/syncService';

export default function App() {
  // App views: 'scanner' | 'spreadsheet'
  const [activeView, setActiveView] = useState('scanner');

  // Exam and Subject Metadata
  const [activeExam, setActiveExam] = useState(() => localStorage.getItem('EXAM_SCANNER_ACTIVE_EXAM') || 'CAT1');
  const [subjectCode, setSubjectCode] = useState(() => localStorage.getItem('EXAM_SCANNER_SUBJ_CODE') || 'CS8401');
  const [subjectName, setSubjectName] = useState(() => localStorage.getItem('EXAM_SCANNER_SUBJ_NAME') || 'Data Structures & Algorithms');

  // Template configuration
  const [currentTemplate, setCurrentTemplate] = useState(() => {
    const saved = localStorage.getItem('EXAM_SCANNER_TEMPLATE');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return PRESET_TEMPLATES.CAT1;
  });

  // Evaluated student answer script records
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('EXAM_SCANNER_RECORDS');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Modal and Review state
  const [activeScriptReview, setActiveScriptReview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLaptopConnected, setIsLaptopConnected] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('EXAM_SCANNER_GEMINI_KEY') || '');

  // Modal Open states
  const [laptopModalOpen, setLaptopModalOpen] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('EXAM_SCANNER_ACTIVE_EXAM', activeExam);
  }, [activeExam]);

  useEffect(() => {
    localStorage.setItem('EXAM_SCANNER_SUBJ_CODE', subjectCode);
    localStorage.setItem('EXAM_SCANNER_SUBJ_NAME', subjectName);
  }, [subjectCode, subjectName]);

  useEffect(() => {
    localStorage.setItem('EXAM_SCANNER_TEMPLATE', JSON.stringify(currentTemplate));
  }, [currentTemplate]);

  useEffect(() => {
    localStorage.setItem('EXAM_SCANNER_RECORDS', JSON.stringify(records));
  }, [records]);

  // When activeExam changes, switch template if using presets
  const handleExamChange = (newExam) => {
    setActiveExam(newExam);
    if (PRESET_TEMPLATES[newExam]) {
      setCurrentTemplate(PRESET_TEMPLATES[newExam]);
    }
  };

  // Initialize Socket.io Live Sync with Laptop Companion Server
  useEffect(() => {
    syncService.init();

    const unsubscribe = syncService.subscribe((type, payload) => {
      if (type === 'connection') {
        setIsLaptopConnected(payload.connected);
      } else if (type === 'sync') {
        if (payload.records && payload.records.length >= 0) {
          // Merge incoming records from laptop bridge
          setRecords(payload.records);
        }
      } else if (type === 'notify') {
        setNotification(payload.message);
        setTimeout(() => setNotification(null), 4000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle extracted script from Scanner (Camera or File or Sample)
  const handleScriptExtracted = (extractedRecord) => {
    // If blurry or low confidence or missing regNo, immediately pop up the Manual Correction Modal!
    if (extractedRecord.needsManualReview) {
      setActiveScriptReview(extractedRecord);
    } else {
      // Auto-save high-confidence scan directly
      saveRecordToDataset(extractedRecord);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      setNotification(`✓ Scanned RegNo ${extractedRecord.regNo}: Total ${extractedRecord.total}`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Save record to local state and broadcast to laptop
  const saveRecordToDataset = (recordToSave) => {
    setRecords(prev => {
      const existingIdx = prev.findIndex(r => r.regNo === recordToSave.regNo && (r.examType || 'CAT1') === (recordToSave.examType || 'CAT1'));
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = recordToSave;
      } else {
        updated = [recordToSave, ...prev];
      }
      return updated;
    });

    // Push to live laptop companion server
    syncService.sendScannedScript(recordToSave);
  };

  // Handle Manual Correction Modal Save
  const handleSaveManualCorrection = (correctedRecord) => {
    saveRecordToDataset(correctedRecord);
    setActiveScriptReview(null);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.85 } });
    setNotification(`✓ Saved RegNo: ${correctedRecord.regNo}`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle Update Record from Spreadsheet table
  const handleUpdateRecord = (updatedRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    syncService.sendUpdateRecord(updatedRecord);
  };

  // Handle Delete Record
  const handleDeleteRecord = (recordId) => {
    if (window.confirm('Delete this answer script record from marksheet?')) {
      setRecords(prev => prev.filter(r => r.id !== recordId));
      syncService.sendDeleteRecord(recordId);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportToExcel({
      examType: activeExam,
      subjectCode,
      subjectName,
      columns: currentTemplate.columns,
      records
    });
  };

  // Apply custom template or preset
  const handleApplyTemplate = (newTemplate, existingRoster = []) => {
    setCurrentTemplate(newTemplate);
    if (existingRoster && existingRoster.length > 0) {
      setRecords(prev => {
        const merged = [...prev];
        existingRoster.forEach(student => {
          if (!merged.some(r => r.regNo === student.regNo)) {
            merged.push({
              id: `rec_roster_${student.regNo}`,
              regNo: student.regNo,
              studentName: student.studentName || '',
              examType: activeExam,
              marks: {},
              total: 0,
              confidence: 100
            });
          }
        });
        return merged;
      });
    }
    syncService.sendTemplateUpdate(newTemplate);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '9999px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fade-in 0.2s ease-out'
        }}>
          <span>{notification}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        activeExam={activeExam}
        setActiveExam={handleExamChange}
        subjectCode={subjectCode}
        setSubjectCode={setSubjectCode}
        subjectName={subjectName}
        setSubjectName={setSubjectName}
        isLaptopConnected={isLaptopConnected}
        hasGeminiKey={Boolean(geminiApiKey)}
        onOpenLaptopModal={() => setLaptopModalOpen(true)}
        onOpenGeminiModal={() => setGeminiModalOpen(true)}
        onOpenTemplateModal={() => setTemplateModalOpen(true)}
        onExportExcel={handleExportExcel}
        totalRecords={records.length}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeView === 'scanner' ? (
          <ScannerView
            activeExam={activeExam}
            currentTemplate={currentTemplate}
            geminiApiKey={geminiApiKey}
            onScriptExtracted={handleScriptExtracted}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        ) : (
          <SpreadsheetView
            records={records}
            currentTemplate={currentTemplate}
            activeExam={activeExam}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onOpenManualEdit={(rec) => setActiveScriptReview(rec)}
            onExportExcel={handleExportExcel}
            onSwitchToScanner={() => setActiveView('scanner')}
          />
        )}
      </main>

      {/* Manual Correction Modal (When Image is blurry or needs verification) */}
      {activeScriptReview && (
        <ManualCorrectionModal
          scriptRecord={activeScriptReview}
          currentTemplate={currentTemplate}
          onSave={handleSaveManualCorrection}
          onDiscard={() => setActiveScriptReview(null)}
          isLaptopConnected={isLaptopConnected}
        />
      )}

      {/* Laptop Connect & QR Pairing Modal */}
      <LaptopConnectModal
        isOpen={laptopModalOpen}
        onClose={() => setLaptopModalOpen(false)}
        isLaptopConnected={isLaptopConnected}
        onConnectCustomUrl={(url) => syncService.init(url)}
      />

      {/* Template & Subject Setup Modal */}
      <TemplateManagerModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        currentTemplate={currentTemplate}
        onApplyTemplate={handleApplyTemplate}
        subjectCode={subjectCode}
        setSubjectCode={setSubjectCode}
        subjectName={subjectName}
        setSubjectName={setSubjectName}
      />

      {/* Gemini Vision Settings Modal */}
      <GeminiSettingsModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        apiKey={geminiApiKey}
        onSaveApiKey={(key) => {
          setGeminiApiKey(key);
          localStorage.setItem('EXAM_SCANNER_GEMINI_KEY', key);
        }}
      />

      {/* Mobile-First Bottom Navigation Bar */}
      <MobileBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenLaptopModal={() => setLaptopModalOpen(true)}
        onOpenTemplateModal={() => setTemplateModalOpen(true)}
        onExportExcel={handleExportExcel}
        isLaptopConnected={isLaptopConnected}
        totalRecords={records.length}
      />
    </div>
  );
}
