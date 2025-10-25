import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * MCP Server Manager with proper process handling
 */
export class MCPServerManager {
    private serverProcess: ChildProcess | null = null;
    private outputChannel: vscode.OutputChannel;
    private isRunning = false;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('MCP Task Manager');
    }

    async start(): Promise<void> {
        try {
            const serverPath = this.getServerPath();
            this.outputChannel.appendLine(`[Manager] Starting MCP server from: ${serverPath}`);
            
            // Verify server file exists
            if (!fs.existsSync(serverPath)) {
                throw new Error(`MCP server not found at: ${serverPath}`);
            }
            
            this.outputChannel.appendLine(`[Manager] Server file exists: ${fs.statSync(serverPath).size} bytes`);
            
            // Check if package.json exists (for dependencies)
            const serverDir = path.dirname(serverPath);
            const packageJsonPath = path.join(serverDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                this.outputChannel.appendLine(`[Manager] Package type: ${pkg.type || 'commonjs'}`);
            }
            
            // Start the server process with proper stdio configuration
            this.outputChannel.appendLine(`[Manager] Spawning Node.js process...`);
            this.serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    AUXLY_API_URL: 'https://auxly.tzamun.com:8000',
                    AUXLY_API_KEY: 'your-api-key-here'
                },
                cwd: serverDir
            });
            
            // Capture stdout for MCP protocol (should be JSON-RPC)
            this.serverProcess.stdout?.on('data', (data) => {
                const message = data.toString();
                this.outputChannel.appendLine(`[SERVER STDOUT] ${message}`);
            });
            
            // Capture stderr for diagnostic logs
            this.serverProcess.stderr?.on('data', (data) => {
                const message = data.toString();
                this.outputChannel.appendLine(`[SERVER STDERR] ${message}`);
            });
            
            // Handle process exit
            this.serverProcess.on('exit', (code, signal) => {
                this.outputChannel.appendLine(`[Manager] Server exited with code ${code}, signal ${signal}`);
                this.isRunning = false;
            });
            
            // Handle process errors
            this.serverProcess.on('error', (error) => {
                this.outputChannel.appendLine(`[Manager] Server process error: ${error.message}`);
                this.outputChannel.appendLine(`[Manager] Error stack: ${error.stack}`);
                this.isRunning = false;
                vscode.window.showErrorMessage(`MCP Server failed to start: ${error.message}`);
            });
            
            this.outputChannel.appendLine(`[Manager] Process spawned with PID: ${this.serverProcess.pid}`);
            
            // Wait for server to be ready
            await this.waitForServerReady();
            
            this.isRunning = true;
            this.outputChannel.appendLine('[Manager] MCP server started successfully');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';
            this.outputChannel.appendLine(`[Manager] Failed to start server: ${errorMessage}`);
            this.outputChannel.appendLine(`[Manager] Stack: ${errorStack}`);
            throw error;
        }
    }
    
    private async waitForServerReady(timeout = 10000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Server startup timeout - no ready signal received'));
            }, timeout);
            
            // Listen for initialization message from server stderr
            const onData = (data: Buffer) => {
                const message = data.toString();
                this.outputChannel.appendLine(`[Manager] Checking message: ${message.substring(0, 100)}...`);
                
                if (message.includes('ready') || message.includes('connected') || message.includes('initialized')) {
                    clearTimeout(timer);
                    this.serverProcess?.stderr?.off('data', onData);
                    this.outputChannel.appendLine('[Manager] Server ready signal received!');
                    resolve();
                }
            };
            
            this.serverProcess?.stderr?.on('data', onData);
            
            // Also accept if process is still running after 2 seconds
            setTimeout(() => {
                if (this.serverProcess && !this.serverProcess.killed) {
                    clearTimeout(timer);
                    this.serverProcess?.stderr?.off('data', onData);
                    this.outputChannel.appendLine('[Manager] Server process is running (timeout fallback)');
                    resolve();
                }
            }, 2000);
        });
    }
    
    private getServerPath(): string {
        const extensionPath = this.context.extensionPath;
        const serverPath = path.join(extensionPath, 'dist', 'mcp-server', 'index.js');
        this.outputChannel.appendLine(`[Manager] Extension path: ${extensionPath}`);
        this.outputChannel.appendLine(`[Manager] Server path: ${serverPath}`);
        return serverPath;
    }
    
    isServerRunning(): boolean {
        return this.isRunning && this.serverProcess !== null && !this.serverProcess.killed;
    }
    
    stop(): void {
        if (this.serverProcess && !this.serverProcess.killed) {
            this.outputChannel.appendLine('[Manager] Stopping MCP server...');
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
            this.isRunning = false;
        }
    }
    
    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }
}

