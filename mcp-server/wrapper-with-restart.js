#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const SERVER_PATH = path.join(__dirname, 'index.js');
const MAX_RESTARTS = 10;
const RESTART_DELAY = 2000; // 2 seconds

let restartCount = 0;
let lastRestartTime = Date.now();
let currentProcess = null;

function log(msg) {
  console.error(`[Auxly MCP Wrapper] ${msg}`);
}

function startServer() {
  log(`Starting MCP server (attempt ${restartCount + 1})...`);
  
  // CRITICAL: Use 'pipe' for stdin/stdout to enable MCP stdio transport!
  // Keep stderr as 'inherit' for logging
  currentProcess = spawn('node', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env }
  });
  
  // Pipe stdin from parent (Cursor) to child (MCP server)
  process.stdin.pipe(currentProcess.stdin);
  
  // Pipe stdout from child (MCP server) to parent (Cursor)
  currentProcess.stdout.pipe(process.stdout);
  
  currentProcess.on('exit', (code, signal) => {
    log(`Server exited with code ${code}, signal ${signal}`);
    
    const now = Date.now();
    
    // Reset restart count if it's been more than 60 seconds since last restart
    if (now - lastRestartTime > 60000) {
      restartCount = 0;
    }
    
    lastRestartTime = now;
    restartCount++;
    
    if (restartCount > MAX_RESTARTS) {
      log(`Max restarts (${MAX_RESTARTS}) exceeded. Giving up.`);
      process.exit(1);
    }
    
    // Restart after delay
    log(`Restarting in ${RESTART_DELAY}ms...`);
    setTimeout(startServer, RESTART_DELAY);
  });
  
  currentProcess.on('error', (err) => {
    log(`Failed to start server: ${err}`);
    process.exit(1);
  });
}

// Clean shutdown on SIGINT/SIGTERM
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...');
  if (currentProcess) {
    currentProcess.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down...');
  if (currentProcess) {
    currentProcess.kill('SIGTERM');
  }
  process.exit(0);
});

log('Auxly MCP Wrapper starting...');
log(`Server path: ${SERVER_PATH}`);
startServer();


