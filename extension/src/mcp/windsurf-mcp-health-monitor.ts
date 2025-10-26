import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Windsurf MCP Health Monitor with Auto-Restart
 * 
 * Problem: Windsurf uses config file (~/.codeium/windsurf/mcp_config.json) instead of API
 * When MCP server process dies, Wind surf doesn't auto-restart it (unlike Cursor)
 * 
 * Solution: Monitor MCP server process health and restart automatically
 */

export interface WindsurfMCPHealthStatus {
    isHealthy: boolean;
    processAlive: boolean;
    lastCheck: Date;
    restartCount: number;
    error?: string;
}

export class WindsurfMCPHealthMonitor {
    private static instance: WindsurfMCPHealthMonitor;
    private healthCheckInterval: NodeJS.Timeout | undefined;
    private mcpServerProcess: child_process.ChildProcess | undefined;
    private currentStatus: WindsurfMCPHealthStatus = {
        isHealthy: false,
        processAlive: false,
        lastCheck: new Date(),
        restartCount: 0
    };
    private statusChangeCallbacks: Array<(status: WindsurfMCPHealthStatus) => void> = [];
    private extensionContext: vscode.ExtensionContext | undefined;
    private mcpServerPath: string | undefined;
    private restartAttempts: number = 0;
    private lastRestartTime: number = 0;
    private readonly MAX_RESTART_ATTEMPTS = 5;
    private readonly RESTART_COOLDOWN_MS = 10000; // 10 seconds between attempts
    private readonly HEALTH_CHECK_INTERVAL_MS = 15000; // Check every 15 seconds

    private constructor() {}

    static getInstance(): WindsurfMCPHealthMonitor {
        if (!WindsurfMCPHealthMonitor.instance) {
            WindsurfMCPHealthMonitor.instance = new WindsurfMCPHealthMonitor();
        }
        return WindsurfMCPHealthMonitor.instance;
    }

    /**
     * Initialize monitor with extension context
     */
    initialize(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.mcpServerPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'index.js');
        console.log('[Windsurf Health] Initialized with MCP server:', this.mcpServerPath);
    }

    /**
     * Start monitoring MCP server health with auto-restart
     */
    startMonitoring() {
        if (this.healthCheckInterval) {
            console.log('[Windsurf Health] Monitoring already running');
            return;
        }

        console.log('[Windsurf Health] 🏥 Starting MCP health monitoring...');
        console.log('[Windsurf Health] ✨ AUTO-RESTART ENABLED');
        console.log(`[Windsurf Health] Check interval: ${this.HEALTH_CHECK_INTERVAL_MS}ms`);
        
        // Initial check
        this.checkHealth();

        // Schedule periodic checks
        this.healthCheckInterval = setInterval(() => {
            this.checkHealth();
        }, this.HEALTH_CHECK_INTERVAL_MS);

        console.log('[Windsurf Health] ✅ Monitoring started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
            console.log('[Windsurf Health] ⏹️  Monitoring stopped');
        }

        // Kill managed process if exists
        if (this.mcpServerProcess && !this.mcpServerProcess.killed) {
            this.mcpServerProcess.kill();
            this.mcpServerProcess = undefined;
        }
    }

    /**
     * Check MCP server health
     * Strategy: Check if node process running with our MCP server path
     */
    private async checkHealth() {
        try {
            console.log('[Windsurf Health] 🔍 Checking MCP server health...');
            
            const isAlive = await this.isProcessAlive();
            
            if (isAlive) {
                console.log('[Windsurf Health] ✅ MCP server process is alive');
                this.updateStatus(true, true);
                
                // Reset restart counter on successful health check
                if (this.restartAttempts > 0) {
                    console.log('[Windsurf Health] ✅ Server recovered - resetting restart counter');
                    this.restartAttempts = 0;
                }
            } else {
                console.log('[Windsurf Health] ❌ MCP server process not found');
                this.updateStatus(false, false, 'MCP server process not running');
                
                // Attempt auto-restart
                await this.attemptRestart();
            }
            
        } catch (error) {
            console.error('[Windsurf Health] ❌ Health check failed:', error);
            this.updateStatus(false, false, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Check if MCP server process is alive
     * Uses platform-specific process detection
     */
    private async isProcessAlive(): Promise<boolean> {
        return new Promise((resolve) => {
            const platform = os.platform();
            
            if (platform === 'win32') {
                // Windows: Use tasklist to find node processes running our MCP server
                const cmd = `tasklist /FI "IMAGENAME eq node.exe" /FO CSV`;
                
                child_process.exec(cmd, (error, stdout) => {
                    if (error) {
                        console.log('[Windsurf Health] ⚠️ Could not check processes:', error.message);
                        resolve(false);
                        return;
                    }
                    
                    // Check if any node process is running
                    // We can't easily match exact command line args on Windows
                    // So we'll use a simpler heuristic: is node.exe running?
                    const hasNodeProcess = stdout.toLowerCase().includes('node.exe');
                    
                    if (hasNodeProcess) {
                        console.log('[Windsurf Health] Found node.exe process');
                    }
                    
                    resolve(hasNodeProcess);
                });
            } else {
                // Linux/Mac: Use ps to find processes with our MCP server path
                const cmd = `ps aux | grep "node" | grep "mcp-server/index.js" | grep -v grep`;
                
                child_process.exec(cmd, (error, stdout) => {
                    if (error) {
                        // ps returns error if no match found
                        resolve(false);
                        return;
                    }
                    
                    const hasProcess = stdout.trim().length > 0;
                    if (hasProcess) {
                        console.log('[Windsurf Health] Found MCP server process');
                    }
                    resolve(hasProcess);
                });
            }
        });
    }

    /**
     * Attempt to restart MCP server
     */
    private async attemptRestart() {
        const now = Date.now();
        const timeSinceLastRestart = now - this.lastRestartTime;
        
        // Check if we've exceeded max attempts
        if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
            console.log(`[Windsurf Health] ⚠️ MAX RESTART ATTEMPTS REACHED (${this.MAX_RESTART_ATTEMPTS})`);
            
            // Reset after cooldown
            if (timeSinceLastRestart > this.RESTART_COOLDOWN_MS * 3) {
                console.log('[Windsurf Health] 🔄 Cooldown period passed - resetting counter');
                this.restartAttempts = 0;
                this.lastRestartTime = 0;
            } else {
                console.log('[Windsurf Health] ⏳ Waiting for cooldown before retry...');
                return;
            }
        }
        
        // Check cooldown between attempts
        if (timeSinceLastRestart < this.RESTART_COOLDOWN_MS) {
            console.log(`[Windsurf Health] ⏳ Too soon to restart (${(this.RESTART_COOLDOWN_MS - timeSinceLastRestart) / 1000}s remaining)`);
            return;
        }
        
        console.log(`[Windsurf Health] 🔄 AUTO-RESTARTING MCP server (attempt ${this.restartAttempts + 1}/${this.MAX_RESTART_ATTEMPTS})...`);
        this.restartAttempts++;
        this.lastRestartTime = now;
        
        const success = await this.restartMCPServer();
        
        if (success) {
            console.log('[Windsurf Health] ✅ MCP server restarted successfully');
            vscode.window.showInformationMessage('✅ Auxly MCP server restarted automatically');
        } else {
            console.log('[Windsurf Health] ❌ MCP server restart failed');
            
            if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
                vscode.window.showWarningMessage(
                    '⚠️ Auxly MCP server failed to restart automatically. Please reload the window.',
                    'Reload Window'
                ).then(action => {
                    if (action === 'Reload Window') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
            }
        }
    }

    /**
     * Restart MCP server by spawning new process
     */
    private async restartMCPServer(): Promise<boolean> {
        try {
            if (!this.extensionContext || !this.mcpServerPath) {
                console.error('[Windsurf Health] ❌ Not initialized');
                return false;
            }

            // Kill existing process if we're managing it
            if (this.mcpServerProcess && !this.mcpServerProcess.killed) {
                console.log('[Windsurf Health] 🔪 Killing existing process...');
                this.mcpServerProcess.kill();
                this.mcpServerProcess = undefined;
                
                // Wait for process to die
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Get workspace info
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const workspacePath = workspaceFolders && workspaceFolders.length > 0 
                ? workspaceFolders[0].uri.fsPath 
                : '';
            
            const workspaceHash = workspacePath ? 
                require('crypto').createHash('md5').update(workspacePath).digest('hex').substring(0, 8) : 
                'default';
            
            const apiUrl = vscode.workspace.getConfiguration('auxly')?.get<string>('apiUrl') 
                || 'https://auxly.tzamun.com:8000';

            // Find node executable
            const nodeExecutable = this.findNodeExecutable();
            
            console.log('[Windsurf Health] 🚀 Spawning new MCP server process...');
            console.log('[Windsurf Health]   Node:', nodeExecutable);
            console.log('[Windsurf Health]   Script:', this.mcpServerPath);
            console.log('[Windsurf Health]   Workspace:', workspacePath);

            // Spawn MCP server process
            this.mcpServerProcess = child_process.spawn(
                nodeExecutable,
                [this.mcpServerPath],
                {
                    env: {
                        ...process.env,
                        AUXLY_WORKSPACE_PATH: workspacePath,
                        AUXLY_WORKSPACE_ID: workspaceHash,
                        AUXLY_API_URL: apiUrl
                    },
                    stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
                    detached: false
                }
            );

            // Handle process events
            this.mcpServerProcess.on('error', (error) => {
                console.error('[Windsurf Health] ❌ Process error:', error);
                this.mcpServerProcess = undefined;
            });

            this.mcpServerProcess.on('exit', (code, signal) => {
                console.log(`[Windsurf Health] ⚠️  Process exited: code=${code}, signal=${signal}`);
                this.mcpServerProcess = undefined;
                
                // Trigger health check to restart
                setTimeout(() => this.checkHealth(), 2000);
            });

            // Log stdout/stderr for debugging
            this.mcpServerProcess.stdout?.on('data', (data) => {
                console.log('[Windsurf MCP Server]', data.toString().trim());
            });

            this.mcpServerProcess.stderr?.on('data', (data) => {
                console.error('[Windsurf MCP Server ERROR]', data.toString().trim());
            });

            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify process is still alive
            const isAlive = this.mcpServerProcess && !this.mcpServerProcess.killed;
            
            if (isAlive) {
                console.log('[Windsurf Health] ✅ Process spawned successfully (PID:', this.mcpServerProcess?.pid, ')');
                this.currentStatus.restartCount++;
                return true;
            } else {
                console.error('[Windsurf Health] ❌ Process died immediately after spawn');
                return false;
            }
            
        } catch (error) {
            console.error('[Windsurf Health] ❌ Failed to restart MCP server:', error);
            return false;
        }
    }

    /**
     * Find Node.js executable
     */
    private findNodeExecutable(): string {
        // Try to find bundled Node.js with Windsurf
        const windsurfPath = process.execPath;
        const windsurfDir = path.dirname(windsurfPath);
        
        const possibleNodePaths = [
            path.join(windsurfDir, 'node.exe'),
            path.join(windsurfDir, 'node'),
            path.join(windsurfDir, 'resources', 'node.exe'),
            path.join(windsurfDir, 'resources', 'node'),
            'node' // Fallback to system Node.js
        ];
        
        for (const nodePath of possibleNodePaths) {
            if (nodePath === 'node') {
                return 'node';
            }
            
            if (fs.existsSync(nodePath)) {
                console.log('[Windsurf Health] ✅ Found Node.js at:', nodePath);
                return nodePath;
            }
        }
        
        console.log('[Windsurf Health] ⚠️  Using system node');
        return 'node';
    }

    /**
     * Update health status and notify listeners
     */
    private updateStatus(isHealthy: boolean, processAlive: boolean, error?: string) {
        const wasHealthy = this.currentStatus.isHealthy;
        
        this.currentStatus = {
            ...this.currentStatus,
            isHealthy,
            processAlive,
            lastCheck: new Date(),
            error
        };

        // Notify listeners if status changed
        if (wasHealthy !== isHealthy) {
            console.log(`[Windsurf Health] 🔄 Status changed: ${wasHealthy} → ${isHealthy}`);
            this.notifyStatusChange();
        }
    }

    /**
     * Get current health status
     */
    getStatus(): WindsurfMCPHealthStatus {
        return { ...this.currentStatus };
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(callback: (status: WindsurfMCPHealthStatus) => void): vscode.Disposable {
        this.statusChangeCallbacks.push(callback);
        
        // Send current status immediately
        callback(this.getStatus());

        return new vscode.Disposable(() => {
            const index = this.statusChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.statusChangeCallbacks.splice(index, 1);
            }
        });
    }

    /**
     * Notify all listeners of status change
     */
    private notifyStatusChange() {
        const status = this.getStatus();
        this.statusChangeCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('[Windsurf Health] Error in status change callback:', error);
            }
        });
    }

    /**
     * Manually trigger restart (for testing/commands)
     */
    async manualRestart(): Promise<boolean> {
        console.log('[Windsurf Health] 🔄 Manual restart requested');
        this.restartAttempts = 0; // Reset counter for manual restart
        return await this.restartMCPServer();
    }

    /**
     * Dispose and clean up
     */
    dispose() {
        this.stopMonitoring();
        this.statusChangeCallbacks = [];
    }
}

