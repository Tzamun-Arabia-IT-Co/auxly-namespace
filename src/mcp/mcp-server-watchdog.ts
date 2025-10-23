import * as vscode from 'vscode';
import { MCPServerManager } from './mcp-server-manager';

/**
 * Process Watchdog with automatic recovery
 */
export class MCPServerWatchdog {
    private serverManager: MCPServerManager;
    private restartAttempts = 0;
    private maxRestartAttempts = 5;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private isShuttingDown = false;
    private outputChannel: vscode.OutputChannel;
    
    constructor(context: vscode.ExtensionContext) {
        this.serverManager = new MCPServerManager(context);
        this.outputChannel = this.serverManager.getOutputChannel();
    }
    
    async start(): Promise<void> {
        if (this.isShuttingDown) {
            return;
        }
        
        try {
            this.outputChannel.appendLine(`[Watchdog] Starting MCP server (attempt ${this.restartAttempts + 1}/${this.maxRestartAttempts})`);
            await this.serverManager.start();
            
            // Start health checks
            if (!this.healthCheckInterval) {
                this.healthCheckInterval = setInterval(() => this.checkHealth(), 30000);
                this.outputChannel.appendLine('[Watchdog] Health checks started (30s interval)');
            }
            
            // Reset restart counter after successful start
            setTimeout(() => {
                if (this.restartAttempts > 0) {
                    this.outputChannel.appendLine('[Watchdog] Server stable, resetting restart counter');
                }
                this.restartAttempts = 0;
            }, 60000);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`[Watchdog] Failed to start MCP server: ${errorMessage}`);
            await this.handleStartupFailure(error);
        }
    }
    
    private async handleStartupFailure(error: any): Promise<void> {
        if (this.restartAttempts < this.maxRestartAttempts) {
            this.restartAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.restartAttempts), 30000);
            
            this.outputChannel.appendLine(
                `[Watchdog] Will retry in ${delay}ms (attempt ${this.restartAttempts}/${this.maxRestartAttempts})`
            );
            
            setTimeout(() => {
                this.start();
            }, delay);
        } else {
            this.outputChannel.appendLine('[Watchdog] Max restart attempts reached');
            vscode.window.showErrorMessage(
                'MCP Task Manager server failed to start after multiple attempts. Check the output logs.',
                'View Logs',
                'Retry'
            ).then(selection => {
                if (selection === 'View Logs') {
                    this.outputChannel.show();
                } else if (selection === 'Retry') {
                    this.restartAttempts = 0;
                    this.start();
                }
            });
        }
    }
    
    private checkHealth(): void {
        if (!this.serverManager.isServerRunning()) {
            this.outputChannel.appendLine('[Watchdog] Health check failed: server not running');
            this.outputChannel.appendLine('[Watchdog] Attempting automatic restart...');
            this.start();
        } else {
            // Uncomment for verbose health check logging
            // this.outputChannel.appendLine('[Watchdog] Health check passed');
        }
    }
    
    stop(): void {
        this.isShuttingDown = true;
        this.outputChannel.appendLine('[Watchdog] Stopping watchdog...');
        
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        
        this.serverManager.stop();
    }
    
    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }
}

