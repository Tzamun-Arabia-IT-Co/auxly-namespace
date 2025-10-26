import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Windsurf MCP Process Monitor
 * 
 * APPROACH: Monitor the actual MCP server process by checking if its PID is alive
 * When process dies, prompt user to reload window
 */

export interface WindsurfMCPStatus {
    isConnected: boolean;
    lastCheck: Date;
    disconnectTime?: Date;
    processPid?: number;
}

export class WindsurfMCPReconnectHelper {
    private static instance: WindsurfMCPReconnectHelper;
    private checkInterval: NodeJS.Timeout | undefined;
    private lastKnownState: boolean = true;
    private hasPromptedUser: boolean = false;
    private readonly CHECK_INTERVAL_MS = 5000; // Check every 5 seconds
    private mcpProcessPid: number | undefined;
    private configPath: string;

    private constructor() {
        this.configPath = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
        console.log('[Windsurf MCP Monitor] Initialized');
        console.log('[Windsurf MCP Monitor] Config path:', this.configPath);
    }

    static getInstance(): WindsurfMCPReconnectHelper {
        if (!WindsurfMCPReconnectHelper.instance) {
            WindsurfMCPReconnectHelper.instance = new WindsurfMCPReconnectHelper();
        }
        return WindsurfMCPReconnectHelper.instance;
    }

    /**
     * Start monitoring MCP process
     */
    startMonitoring() {
        console.log('[Windsurf MCP Monitor] 🔍 Starting MCP process monitoring...');
        
        // Initial PID discovery
        this.discoverMCPProcess();
        
        // Initial check after a delay (let Windsurf start MCP)
        setTimeout(() => this.checkProcess(), 5000);

        // Periodic checks
        this.checkInterval = setInterval(() => {
            this.checkProcess();
        }, this.CHECK_INTERVAL_MS);

        console.log('[Windsurf MCP Monitor] ✅ Monitoring started (checking every 5s)');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
            console.log('[Windsurf MCP Monitor] ⏹️  Monitoring stopped');
        }
    }

    /**
     * Discover MCP process PID by scanning for node processes running the MCP server
     */
    private async discoverMCPProcess() {
        try {
            console.log('[Windsurf MCP Monitor] 🔍 Discovering Auxly MCP process...');
            
            const isWindows = process.platform === 'win32';
            let processes: string;

            if (isWindows) {
                // Windows: Use WMIC to find node processes
                const { stdout } = await execAsync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv');
                processes = stdout;
            } else {
                // Linux/Mac: Use ps to find node processes
                const { stdout } = await execAsync('ps aux | grep node');
                processes = stdout;
            }

            // Look for the Auxly MCP server in the process list
            // Search for: mcp-server/index.js OR dist/mcp-server/index.js
            const lines = processes.split('\n');
            for (const line of lines) {
                // More flexible matching: look for mcp-server and index.js
                if ((line.includes('mcp-server') || line.includes('mcp_server')) && 
                    line.includes('index.js') && 
                    !line.includes('grep')) { // Exclude grep command itself
                    
                    console.log('[Windsurf MCP Monitor] 🔍 Found matching process line:', line.substring(0, 200));
                    
                    // Extract PID from the line
                    const pidMatch = isWindows 
                        ? line.match(/,(\d+)$/)  // Windows CSV format: ...,PID
                        : line.match(/^\S+\s+(\d+)/);  // Linux ps format: user PID ...
                    
                    if (pidMatch) {
                        this.mcpProcessPid = parseInt(pidMatch[1], 10);
                        console.log('[Windsurf MCP Monitor] ✅ Found Auxly MCP process with PID:', this.mcpProcessPid);
                        return;
                    }
                }
            }

            console.log('[Windsurf MCP Monitor] ⚠️  Auxly MCP process not found yet (may not be started)');
        } catch (error) {
            console.error('[Windsurf MCP Monitor] ❌ Error discovering MCP process:', error);
        }
    }

    /**
     * Check if MCP process is still running
     */
    private async checkProcess() {
        try {
            // If we don't have a PID yet, try to discover it
            if (!this.mcpProcessPid) {
                await this.discoverMCPProcess();
                if (!this.mcpProcessPid) {
                    // Still no PID, wait for next check
                    console.log('[Windsurf MCP Monitor] ⏳ Still waiting for MCP process to start...');
                    return;
                }
            }

            // Check if process is still alive
            const isAlive = await this.isProcessAlive(this.mcpProcessPid);

            if (isAlive) {
                // Process is alive!
                if (!this.lastKnownState) {
                    console.log('[Windsurf MCP Monitor] 🎉 MCP process restored! PID:', this.mcpProcessPid);
                    this.lastKnownState = true;
                    this.hasPromptedUser = false;
                }
            } else {
                // Process is dead!
                console.warn('[Windsurf MCP Monitor] ❌ MCP process died! PID:', this.mcpProcessPid);
                
                // Try to discover new process first (maybe Windsurf restarted it?)
                const oldPid = this.mcpProcessPid;
                this.mcpProcessPid = undefined; // Reset PID for rediscovery
                await this.discoverMCPProcess();
                
                if (this.mcpProcessPid && this.mcpProcessPid !== oldPid) {
                    // New process found! Windsurf restarted it automatically
                    console.log('[Windsurf MCP Monitor] 🎉 MCP process restarted by Windsurf! New PID:', this.mcpProcessPid);
                    this.lastKnownState = true;
                    this.hasPromptedUser = false;
                } else {
                    // No new process, prompt user to reload
                    this.handleDisconnect();
                }
            }

        } catch (error) {
            console.error('[Windsurf MCP Monitor] ❌ Error checking process:', error);
        }
    }

    /**
     * Check if a process with given PID is alive
     */
    private async isProcessAlive(pid: number): Promise<boolean> {
        try {
            const isWindows = process.platform === 'win32';
            
            if (isWindows) {
                // Windows: Use tasklist
                const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /NH`);
                return stdout.includes(pid.toString());
            } else {
                // Linux/Mac: Use kill -0 (doesn't actually kill, just checks if process exists)
                await execAsync(`kill -0 ${pid}`);
                return true; // If no error, process exists
            }
        } catch (error) {
            // Error means process doesn't exist
            return false;
        }
    }

    /**
     * Handle MCP disconnection - prompt user to reload
     */
    private handleDisconnect() {
        // Don't spam the user with multiple prompts
        if (this.hasPromptedUser) {
            return;
        }

        if (this.lastKnownState) {
            // State changed from connected to disconnected
            console.log('[Windsurf MCP Monitor] ❌ MCP process killed! Prompting reload...');
            this.lastKnownState = false;
            this.hasPromptedUser = true;

            // Show helpful prompt with sound
            vscode.window.showWarningMessage(
                '⚠️ Auxly MCP server process was killed. Reload window to restart it?',
                'Reload Now',
                'Later'
            ).then(action => {
                if (action === 'Reload Now') {
                    console.log('[Windsurf MCP Monitor] User chose to reload window');
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                } else {
                    console.log('[Windsurf MCP Monitor] User chose to reload later');
                }
            });
        }
    }

    /**
     * Manual trigger to prompt reload (for testing/commands)
     */
    promptReload() {
        this.hasPromptedUser = false; // Reset flag to allow prompt
        this.handleDisconnect();
    }

    /**
     * Get current status
     */
    getStatus(): WindsurfMCPStatus {
        return {
            isConnected: this.lastKnownState,
            lastCheck: new Date(),
            processPid: this.mcpProcessPid
        };
    }

    /**
     * Dispose and clean up
     */
    dispose() {
        this.stopMonitoring();
    }
}


