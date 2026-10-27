import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Wifi, 
  WifiOff, 
  QrCode, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  Smartphone,
  Share2
} from 'lucide-react';
import QRCode from 'qrcode';

export default function LaptopConnectModal({
  isOpen,
  onClose,
  isLaptopConnected,
  onConnectCustomUrl
}) {
  if (!isOpen) return null;

  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customIp, setCustomIp] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Fetch local network info from companion server
  const fetchNetworkInfo = async () => {
    setLoading(true);
    try {
      const port = 3001;
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:${port}/api/network-info`);
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
        setQrDataUrl(data.qrDataUrl);
      } else {
        throw new Error('Server returned ' + res.status);
      }
    } catch (err) {
      console.warn('Could not fetch auto network info:', err);
      // Fallback: generate QR for current window location
      try {
        const url = window.location.href;
        const qr = await QRCode.toDataURL(url, { width: 260, margin: 2 });
        setQrDataUrl(qr);
        setNetworkInfo({
          ip: window.location.hostname,
          mobileUrl: url
        });
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  const handleCustomConnect = () => {
    if (!customIp) return;
    const url = customIp.startsWith('http') ? customIp : `http://${customIp}:3001`;
    onConnectCustomUrl(url);
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
        maxWidth: '560px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
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
              background: '#e0e7ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Laptop size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Connect to Laptop
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Real-time synchronization between mobile scanner & laptop spreadsheet
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Connection Status Badge */}
          <div style={{
            background: isLaptopConnected ? '#ecfdf5' : '#f8fafc',
            border: isLaptopConnected ? '1.5px solid #a7f3d0' : '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isLaptopConnected ? <Wifi size={20} color="#10b981" /> : <WifiOff size={20} color="#94a3b8" />}
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isLaptopConnected ? '#065f46' : '#334155' }}>
                  {isLaptopConnected ? 'Live Connection Active' : 'Waiting for Laptop Connection'}
                </span>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {isLaptopConnected 
                    ? 'Scanned scripts stream instantly to your laptop screen.' 
                    : 'Ensure your phone and laptop are on the same Wi-Fi network.'}
                </p>
              </div>
            </div>

            <button
              onClick={fetchNetworkInfo}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer'
              }}
              title="Refresh connection status"
            >
              <RefreshCw size={15} color="#475569" className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* QR Code Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              Scan QR with Phone or Laptop
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '340px', marginBottom: '14px' }}>
              Open your phone camera to open this scanner app directly on mobile:
            </p>

            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              marginBottom: '12px'
            }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Connect QR Code" style={{ width: '200px', height: '200px' }} />
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Generating QR...
                </div>
              )}
            </div>

            {/* URL Display */}
            {networkInfo?.mobileUrl && (
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontFamily: '"JetBrains Mono", monospace',
                color: '#4f46e5',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{networkInfo.mobileUrl}</span>
              </div>
            )}
          </div>

          {/* How It Works Steps */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '0.82rem',
            color: '#475569',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontWeight: 700, color: '#1e293b' }}>How to scan on mobile and review on laptop:</div>
            <div><strong>1. Same Wi-Fi:</strong> Connect both your mobile phone and laptop to the same Wi-Fi or mobile hotspot.</div>
            <div><strong>2. Open on Phone:</strong> Scan the QR code above with your phone camera to launch the Scanner.</div>
            <div><strong>3. Keep Laptop Open:</strong> As you snap student answer scripts on your phone, marks and photos appear live in the spreadsheet on your laptop!</div>
          </div>

          {/* Custom Server IP Option */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Or Enter Laptop IP Address Manually:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. 192.168.1.5"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '0.88rem',
                  fontFamily: '"JetBrains Mono", monospace'
                }}
              />
              <button onClick={handleCustomConnect} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
