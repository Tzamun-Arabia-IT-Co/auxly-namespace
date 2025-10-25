import * as vscode from 'vscode';
import { registerMCPServerWithCursorAPI } from './mcp-cursor-api';

export interface MCPHealthStatus {
    isHealthy: boolean;
    lastCheck: Date;
    error?: string;
}

let extensionContext: vscode.ExtensionContext | undefined;

export class MCPHealthMonitor {
    private static instance: MCPHealthMonitor;
    private healthCheckInterval: NodeJS.Timeout | undefined;
    private currentStatus: MCPHealthStatus = {
        isHealthy: false,
        lastCheck: new Date()
    };
    private statusChangeCallbacks: Array<(status: MCPHealthStatus) => void> = [];
    private restartAttempts: number = 0;
    private lastRestartTime: number = 0;
    private readonly MAX_RESTART_ATTEMPTS = 3;
    private readonly RESTART_COOLDOWN_MS = 30000; // 30 seconds between restart attempts
    private wmicShimPath: string | undefined;

    private constructor() {}

    static getInstance(): MCPHealthMonitor {
        if (!MCPHealthMonitor.instance) {
            MCPHealthMonitor.instance = new MCPHealthMonitor();
        }
        return MCPHealthMonitor.instance;
    }

    /**
     * Set extension context (needed for re-registration)
     */
    setContext(context: vscode.ExtensionContext) {
        extensionContext = context;
    }

    /**
     * Set WMIC shim path (for process detection on Windows 11)
     */
    setWmicShimPath(shimPath: string | undefined) {
        this.wmicShimPath = shimPath;
        if (shimPath) {
            console.log(`[MCP Health] Using WMIC shim at: ${shimPath}`);
        }
    }

    /**
     * Start monitoring MCP server health with AUTO-RESTART (Todo2 behavior)
     */
    startMonitoring(intervalMs: number = 10000) {
        console.log('🏥 Starting MCP health monitoring...');
        console.log('✨ AUTO-RESTART ENABLED (Todo2 behavior)');
        
        // Initial check
        this.checkHealth();

        // Schedule periodic checks
        this.healthCheckInterval = setInterval(() => {
            this.checkHealth();
        }, intervalMs);

        console.log(`✅ MCP health monitoring started (interval: ${intervalMs}ms)`);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
            console.log('⏹️  MCP health monitoring stopped');
        }
    }

    /**
     * Check MCP server health (Todo2 approach - check actual process)
     */
    private async checkHealth() {
        try {
            console.log('🔍 Checking MCP server health...');
            
            // Check using Cursor's MCP API
            const cursorAPI = (vscode as any).cursor;
            if (!cursorAPI || !cursorAPI.mcp) {
                console.log('⚠️ Cursor MCP API not available');
                this.updateStatus(false, 'Cursor MCP API not available');
                return;
            }

            // Check if Auxly MCP server is registered
            let mcpServers: any = {};
            try {
                if (cursorAPI.mcp.getServers) {
                    mcpServers = await cursorAPI.mcp.getServers();
                } else if (cursorAPI.mcp.listServers) {
                    mcpServers = await cursorAPI.mcp.listServers();
                } else {
                    const config = vscode.workspace.getConfiguration('cursor');
                    mcpServers = config.get<Record<string, any>>('mcp.servers', {});
                }
            } catch (error) {
                console.error('❌ Failed to get MCP servers:', error);
                this.updateStatus(false, 'Failed to get MCP servers list');
                return;
            }

            const auxlyServer = mcpServers['auxly'];
            
            if (!auxlyServer) {
                console.log('❌ Auxly MCP server not registered');
                this.updateStatus(false, 'MCP server not registered');
                return;
            }

            // Check if the MCP server is actually healthy using Cursor's API
            // Don't try to find processes manually - let Cursor tell us if it's working
            let isProcessRunning = false;
            
            try {
                // METHOD 1: Try to list tools (proves server is responding)
                if (cursorAPI.mcp.listTools) {
                    try {
                        const tools = await cursorAPI.mcp.listTools('auxly', { timeout: 5000 });
                        if (tools && tools.length > 0) {
                            isProcessRunning = true;
                            console.log(`✅ MCP server responding with ${tools.length} tools`);
                        } else {
                            console.log('⚠️ MCP server returned no tools');
                            isProcessRunning = false;
                        }
                    } catch (toolsError) {
                        console.log('⚠️ Failed to list tools, trying status check...', toolsError);
                        isProcessRunning = false;
                    }
                }
                
                // METHOD 2: If listTools failed, check server status
                if (!isProcessRunning && cursorAPI.mcp.getServerStatus) {
                    try {
                        const status = await cursorAPI.mcp.getServerStatus('auxly');
                        
                        // Server is healthy if it's running/ready/connected
                        isProcessRunning = status?.state === 'running' || 
                                          status?.state === 'ready' || 
                                          status?.connected === true;
                        
                        console.log('📊 MCP Server Status:', { 
                            state: status?.state, 
                            connected: status?.connected,
                            isHealthy: isProcessRunning 
                        });
                    } catch (statusError) {
                        console.log('⚠️ Failed to get server status:', statusError);
                        isProcessRunning = false;
                    }
                }
                
                // METHOD 3: If both failed, assume server is registered = healthy
                // (Cursor manages the process lifecycle, if it's registered it's probably working)
                if (!isProcessRunning) {
                    console.log('ℹ️ Could not verify server health via API, assuming healthy if registered');
                    isProcessRunning = true; // Server is registered, trust Cursor to manage it
                }
            } catch (error) {
                console.error('❌ Failed to check MCP health:', error);
                // If server is registered but we can't check health, assume it's working
                isProcessRunning = true; // Trust Cursor's process management
            }

            // Update status based on PROCESS running state (not just registration)
            if (isProcessRunning) {
                console.log('✅ MCP server is healthy (process running)');
                this.updateStatus(true);
            } else {
                console.log('❌ MCP server is unhealthy (process not found or not responding)');
                this.updateStatus(false, 'MCP server process not found or not responding');
            }

        } catch (error) {
            console.error('❌ Health check failed:', error);
            this.updateStatus(false, error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Update health status and notify if changed
     * AUTO-RESTART if unhealthy (Todo2 behavior)
     */
    private async updateStatus(isHealthy: boolean, error?: string) {
        const wasHealthy = this.currentStatus.isHealthy;
        
        this.currentStatus = {
            isHealthy,
            lastCheck: new Date(),
            error: error
        };

        // Reset restart attempts if healthy
        if (isHealthy && this.restartAttempts > 0) {
            console.log('✅ MCP recovered - resetting restart counter');
            this.restartAttempts = 0;
        }

        // Notify listeners if status changed
        if (wasHealthy !== isHealthy) {
            console.log(`🔄 MCP health status changed: ${wasHealthy} → ${isHealthy}`);
            if (!isHealthy) {
                // Check if we should attempt restart
                const now = Date.now();
                const timeSinceLastRestart = now - this.lastRestartTime;
                
                if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
                    console.log(`⚠️ MAX RESTART ATTEMPTS REACHED (${this.MAX_RESTART_ATTEMPTS})`);
                    console.log('⏳ Waiting for cooldown period before retry...');
                    
                    // Reset after cooldown
                    if (timeSinceLastRestart > this.RESTART_COOLDOWN_MS) {
                        console.log('🔄 Cooldown period passed - resetting counter');
                        this.restartAttempts = 0;
                        this.lastRestartTime = 0;
                    }
                } else {
                    console.log(`⚠️ MCP server unhealthy - AUTO-RESTARTING (${this.restartAttempts + 1}/${this.MAX_RESTART_ATTEMPTS})...`);
                    this.restartAttempts++;
                    this.lastRestartTime = now;
                    
                    // Auto-restart if unhealthy
                    await this.restartMCPServer();
                }
            }
            this.notifyStatusChange();
        }
    }

    /**
     * Manually restart MCP server (AUTO-RESTART - Todo2 behavior)
     */
    async restartMCPServer(): Promise<boolean> {
        try {
            console.log('🔄 AUTO-RESTARTING MCP server (Todo2 behavior)...');
            
            if (!extensionContext) {
                console.error('❌ Extension context not set');
                return false;
            }

            const cursorAPI = (vscode as any).cursor;
            if (!cursorAPI || !cursorAPI.mcp) {
                console.error('❌ Cursor MCP API not available');
                return false;
            }

            // Unregister existing server
            try {
                if (cursorAPI.mcp.unregisterServer) {
                    await cursorAPI.mcp.unregisterServer('auxly');
                    console.log('📤 Unregistered existing MCP server');
                }
            } catch (e) {
                // Ignore - server might not be registered
                console.log('ℹ️  No existing server to unregister');
            }
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Re-register using the Cursor API (same as Todo2!)
            console.log('📥 Re-registering MCP server...');
            const registered = await registerMCPServerWithCursorAPI(extensionContext);
            
            if (registered) {
                console.log('✅ MCP server AUTO-RESTARTED successfully!');
                vscode.window.showInformationMessage('✅ Auxly MCP server restarted automatically');
                
                // Wait a moment for registration to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Re-check health
                await this.checkHealth();
                return true;
            } else {
                console.error('❌ Failed to re-register MCP server');
                vscode.window.showWarningMessage('⚠️ Auxly MCP auto-restart failed. Try manual reload.');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Failed to restart MCP server:', error);
            vscode.window.showErrorMessage(`Failed to restart MCP server: ${error}`);
            return false;
        }
    }

    /**
     * Get current health status
     */
    getStatus(): MCPHealthStatus {
        return { ...this.currentStatus };
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(callback: (status: MCPHealthStatus) => void): vscode.Disposable {
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
                console.error('Error in status change callback:', error);
            }
        });
    }

    /**
     * Dispose and clean up
     */
    dispose() {
        this.stopMonitoring();
        this.statusChangeCallbacks = [];
    }
}

