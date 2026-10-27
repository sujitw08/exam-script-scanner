import { spawn } from 'child_process';

console.log('🚀 Starting ScriptScan Pro Companion Server & Vite Dev Server...');

// Start Backend Sync Bridge on port 3001
const server = spawn('node', ['server/index.js'], { stdio: 'inherit', shell: true });

// Start Frontend Vite Server on port 5173
const vite = spawn('npx', ['vite', '--host'], { stdio: 'inherit', shell: true });

const cleanup = () => {
  server.kill();
  vite.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
