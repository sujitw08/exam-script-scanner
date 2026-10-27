import React, { useState } from 'react';
import { Sparkles, Key, Check, X, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export default function GeminiSettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey
}) {
  if (!isOpen) return null;

  const [inputKey, setInputKey] = useState(apiKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  const handleTestKey = async () => {
    if (!inputKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${inputKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with "OK" if this key is active.' }] }]
        })
      });

      if (res.ok) {
        setTestResult({ success: true, message: 'Gemini Vision AI is active and ready for exam script scanning!' });
        onSaveApiKey(inputKey.trim());
      } else {
        const errorData = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: errorData.error?.message || `API Key validation failed with status ${res.status}`
        });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Network error while testing key: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setTestResult(null);
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
        maxWidth: '520px',
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
              background: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Gemini Vision AI Engine
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Ultra-high accuracy handwritten script extraction
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Google Gemini API Key
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border)',
                  fontSize: '0.92rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Key is stored securely in your browser's local storage.
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                Get Free API Key <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div style={{
              background: testResult.success ? '#ecfdf5' : '#fef2f2',
              border: testResult.success ? '1px solid #a7f3d0' : '1px solid #fecaca',
              color: testResult.success ? '#065f46' : '#991b1b',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {testResult.success ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Hybrid Architecture Info */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '0.8rem',
            color: '#475569',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              Why use Gemini Vision?
            </div>
            <div>• Reads cursive, messy, or faint handwritten register numbers and marks grids.</div>
            <div>• Validates question marks and detects blurred photos automatically.</div>
            <div>• <strong>Offline backup:</strong> If no key is set or no internet, the app automatically switches to built-in local Tesseract OCR.</div>
          </div>

          {/* Test and Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={handleTestKey}
              disabled={testing}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              {testing ? 'Testing...' : 'Test & Verify Key'}
            </button>

            {inputKey && (
              <button
                onClick={handleClear}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Clear
              </button>
            )}

            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
