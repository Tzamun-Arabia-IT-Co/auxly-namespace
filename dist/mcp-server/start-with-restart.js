#!/usr/bin/env node

/**
 * Auxly MCP Auto-Restart Wrapper
 * Monitors and automatically restarts the MCP server if it crashes
 * Uses CommonJS format for direct Node execution
 */

const { spawn } = require('child_process');
const path = require('path');

const SERVER_PATH = path.join(__dirname, 'index.js');
const MAX_RESTART_DELAY = 5000; // 5 seconds
const MIN_RESTART_DELAY = 1000; // 1 second

let restartCount = 0;
let lastRestartTime = Date.now();
let serverProcess = null;

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: '📘',
    ERROR: '❌',
    SUCCESS: '✅',
    RESTART: '🔄'
  }[type] || 'ℹ️';
  
  console.error(`[${timestamp}][${type}] ${prefix} ${message}`);
}

function startServer() {
  log('Starting Auxly MCP Server...', 'INFO');
  
  serverProcess = spawn('node', [SERVER_PATH], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env }
  });

  serverProcess.on('spawn', () => {
    log(`Auxly MCP Server started (PID: ${serverProcess.pid})`, 'SUCCESS');
    restartCount = 0; // Reset restart count on successful start
  });

  serverProcess.on('error', (error) => {
    log(`Failed to start server: ${error.message}`, 'ERROR');
    scheduleRestart();
  });

  serverProcess.on('exit', (code, signal) => {
    if (code === 0) {
      log('Server exited normally', 'INFO');
      process.exit(0);
    } else if (signal === 'SIGTERM' || signal === 'SIGINT') {
      log('Server terminated by signal', 'INFO');
      process.exit(0);
    } else {
      log(`Server crashed with code ${code} (signal: ${signal})`, 'ERROR');
      scheduleRestart();
    }
  });
}

function scheduleRestart() {
  const now = Date.now();
  const timeSinceLastRestart = now - lastRestartTime;
  
  // Calculate restart delay with exponential backoff
  let delay = MIN_RESTART_DELAY;
  if (timeSinceLastRestart < 10000) { // If crashed within 10 seconds
    restartCount++;
    delay = Math.min(
      MIN_RESTART_DELAY * Math.pow(2, restartCount - 1),
      MAX_RESTART_DELAY
    );
  } else {
    restartCount = 0; // Reset if server ran for a while
  }
  
  log(`Auto-restart scheduled in ${delay}ms (attempt #${restartCount + 1})`, 'RESTART');
  
  setTimeout(() => {
    lastRestartTime = Date.now();
    startServer();
  }, delay);
}

// Handle termination signals
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...', 'INFO');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...', 'INFO');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 1000);
});

// Start the server
log('🚀 Auxly MCP Auto-Restart Monitor Started', 'SUCCESS');
log('Features: Auto-restart on crash, exponential backoff, graceful shutdown', 'INFO');
startServer();


