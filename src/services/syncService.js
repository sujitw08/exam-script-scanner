import { io } from 'socket.io-client';

class SyncService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Set();
    this.serverUrl = localStorage.getItem('EXAM_SCANNER_SERVER_URL') || '';
  }

  init(customUrl) {
    if (customUrl) {
      this.serverUrl = customUrl;
      localStorage.setItem('EXAM_SCANNER_SERVER_URL', customUrl);
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    // Try current window origin or saved server URL or default localhost:3001
    const targetUrl = this.serverUrl || `${window.location.protocol}//${window.location.hostname}:3001`;

    console.log(`[SyncService] Connecting to sync bridge at ${targetUrl}...`);

    this.socket = io(targetUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 8000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[SyncService] Connected to Laptop Bridge successfully!');
      this.notifyListeners('connection', { connected: true, socketId: this.socket.id });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('[SyncService] Disconnected from Laptop Bridge.');
      this.notifyListeners('connection', { connected: false });
    });

    this.socket.on('exam:sync', (data) => {
      this.notifyListeners('sync', data);
    });

    this.socket.on('script:notify', (info) => {
      this.notifyListeners('notify', info);
    });

    this.socket.on('record:updated', (record) => {
      this.notifyListeners('recordUpdated', record);
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(type, payload) {
    for (const listener of this.listeners) {
      try {
        listener(type, payload);
      } catch (err) {
        console.error('[SyncService listener error]', err);
      }
    }
  }

  sendScannedScript(record) {
    if (this.socket && this.isConnected) {
      this.socket.emit('script:scanned', record);
    }
  }

  sendUpdateRecord(record) {
    if (this.socket && this.isConnected) {
      this.socket.emit('record:update', record);
    }
  }

  sendDeleteRecord(recordId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('record:delete', recordId);
    }
  }

  sendTemplateUpdate(templateData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('template:update', templateData);
    }
  }
}

export const syncService = new SyncService();
