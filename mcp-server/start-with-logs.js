#!/usr/bin/env node

/**
 * Wrapper script to start MCP server with proper error logging
 * This helps us diagnose why Cursor can't initialize the server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Log file for debugging
const logFile = path.join(__dirname, 'mcp-server-debug.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    // Also log to stderr (MCP allows stderr for diagnostics)
    console.error(logMessage.trim());
}

log('========================================');
log('MCP Server Wrapper Starting');
log(`Node Version: ${process.version}`);
log(`Working Directory: ${process.cwd()}`);
log(`Script Directory: ${__dirname}`);
log(`Environment: ${JSON.stringify(process.env, null, 2)}`);

// Path to the actual MCP server
const serverPath = path.join(__dirname, 'dist', 'index.js');
log(`Server Path: ${serverPath}`);
log(`Server Exists: ${fs.existsSync(serverPath)}`);

// Check if it's an ES module
const packagePath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
log(`Package Type: ${pkg.type || 'commonjs'}`);

try {
    // Start the actual MCP server
    log('Starting MCP server...');
    
    const server = spawn('node', [serverPath], {
        stdio: ['inherit', 'inherit', 'inherit'],
        env: process.env,
        cwd: __dirname
    });

    server.on('error', (error) => {
        log(`ERROR spawning server: ${error.message}`);
        log(`ERROR stack: ${error.stack}`);
        process.exit(1);
    });

    server.on('exit', (code, signal) => {
        log(`Server exited with code ${code} and signal ${signal}`);
        if (code !== 0) {
            process.exit(code);
        }
    });

    log('MCP server process started');

} catch (error) {
    log(`FATAL ERROR: ${error.message}`);
    log(`FATAL stack: ${error.stack}`);
    process.exit(1);
}

