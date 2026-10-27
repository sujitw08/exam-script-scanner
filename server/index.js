import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import QRCode from 'qrcode';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100MB for high-res exam script images
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to determine local LAN IPv4 address
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3001;
const VITE_PORT = 5173;

// In-memory store for synchronized exam sessions
let currentExamData = {
  activeExam: 'CAT1',
  subjectCode: 'CS8401',
  subjectName: 'Data Structures & Algorithms',
  templateName: 'Standard University CAT Template',
  columns: [
    { key: 'regNo', label: 'Register No', required: true },
    { key: 'studentName', label: 'Student Name', required: false },
    { key: 'q1', label: 'Q1 (2m)', max: 2 },
    { key: 'q2', label: 'Q2 (2m)', max: 2 },
    { key: 'q3', label: 'Q3 (2m)', max: 2 },
    { key: 'q4', label: 'Q4 (2m)', max: 2 },
    { key: 'q5', label: 'Q5 (2m)', max: 2 },
    { key: 'q6', label: 'Q6 (13m)', max: 13 },
    { key: 'q7', label: 'Q7 (13m)', max: 13 },
    { key: 'q8', label: 'Q8 (14m)', max: 14 },
    { key: 'total', label: 'Total (50m)', max: 50, isTotal: true }
  ],
  records: []
};

// API to get network info & QR code
app.get('/api/network-info', async (req, res) => {
  const ip = getLocalNetworkIp();
  const mobileUrl = `http://${ip}:${VITE_PORT}`;
  const serverUrl = `http://${ip}:${PORT}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(mobileUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    });

    res.json({
      ip,
      mobileUrl,
      serverUrl,
      qrDataUrl,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code', details: err.message });
  }
});

// API to get current exam data
app.get('/api/exam-data', (req, res) => {
  res.json(currentExamData);
});

// API to update full exam data state
app.post('/api/exam-data', (req, res) => {
  currentExamData = { ...currentExamData, ...req.body };
  io.emit('exam:sync', currentExamData);
  res.json({ success: true, count: currentExamData.records.length });
});

// Socket.io Real-time Event Handlers
io.on('connection', (socket) => {
  console.log(`[SyncBridge] Client connected: ${socket.id}`);

  // Send initial data to newly connected client
  socket.emit('exam:sync', currentExamData);

  // When mobile uploads a new scanned script
  socket.on('script:scanned', (record) => {
    console.log(`[SyncBridge] New script received: RegNo ${record.regNo} (${record.examType || 'CAT1'})`);
    
    // Check if record for this regNo + exam already exists
    const existingIndex = currentExamData.records.findIndex(
      (r) => r.regNo === record.regNo && (r.examType || 'CAT1') === (record.examType || 'CAT1')
    );

    if (existingIndex >= 0) {
      currentExamData.records[existingIndex] = { ...currentExamData.records[existingIndex], ...record, updatedAt: Date.now() };
    } else {
      currentExamData.records.push({ ...record, id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: Date.now() });
    }

    // Broadcast update to all clients (especially laptop spreadsheet view)
    io.emit('exam:sync', currentExamData);
    io.emit('script:notify', { message: `Scanned RegNo: ${record.regNo}`, record });
  });

  // When manual correction is made (on laptop or mobile)
  socket.on('record:update', (updatedRecord) => {
    const idx = currentExamData.records.findIndex((r) => r.id === updatedRecord.id || r.regNo === updatedRecord.regNo);
    if (idx >= 0) {
      currentExamData.records[idx] = { ...currentExamData.records[idx], ...updatedRecord, updatedAt: Date.now() };
      io.emit('exam:sync', currentExamData);
      io.emit('record:updated', currentExamData.records[idx]);
    }
  });

  // When a record is deleted
  socket.on('record:delete', (recordId) => {
    currentExamData.records = currentExamData.records.filter((r) => r.id !== recordId);
    io.emit('exam:sync', currentExamData);
  });

  // When template or exam setting changes
  socket.on('template:update', (templateConfig) => {
    currentExamData = { ...currentExamData, ...templateConfig };
    io.emit('exam:sync', currentExamData);
  });

  socket.on('disconnect', () => {
    console.log(`[SyncBridge] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalNetworkIp();
  console.log(`=======================================================`);
  console.log(` Exam Script Scanner - Companion Sync Bridge Running!  `);
  console.log(` Laptop Dashboard: http://localhost:${VITE_PORT}       `);
  console.log(` Mobile Access URL: http://${ip}:${VITE_PORT}          `);
  console.log(` Sync Bridge API:  http://${ip}:${PORT}               `);
  console.log(`=======================================================`);
});
