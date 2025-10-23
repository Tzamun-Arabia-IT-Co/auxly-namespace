"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerWatchdog = void 0;
const vscode = __importStar(require("vscode"));
const mcp_server_manager_1 = require("./mcp-server-manager");
/**
 * Process Watchdog with automatic recovery
 */
class MCPServerWatchdog {
    constructor(context) {
        this.restartAttempts = 0;
        this.maxRestartAttempts = 5;
        this.healthCheckInterval = null;
        this.isShuttingDown = false;
        this.serverManager = new mcp_server_manager_1.MCPServerManager(context);
        this.outputChannel = this.serverManager.getOutputChannel();
    }
    async start() {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`[Watchdog] Failed to start MCP server: ${errorMessage}`);
            await this.handleStartupFailure(error);
        }
    }
    async handleStartupFailure(error) {
        if (this.restartAttempts < this.maxRestartAttempts) {
            this.restartAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.restartAttempts), 30000);
            this.outputChannel.appendLine(`[Watchdog] Will retry in ${delay}ms (attempt ${this.restartAttempts}/${this.maxRestartAttempts})`);
            setTimeout(() => {
                this.start();
            }, delay);
        }
        else {
            this.outputChannel.appendLine('[Watchdog] Max restart attempts reached');
            vscode.window.showErrorMessage('MCP Task Manager server failed to start after multiple attempts. Check the output logs.', 'View Logs', 'Retry').then(selection => {
                if (selection === 'View Logs') {
                    this.outputChannel.show();
                }
                else if (selection === 'Retry') {
                    this.restartAttempts = 0;
                    this.start();
                }
            });
        }
    }
    checkHealth() {
        if (!this.serverManager.isServerRunning()) {
            this.outputChannel.appendLine('[Watchdog] Health check failed: server not running');
            this.outputChannel.appendLine('[Watchdog] Attempting automatic restart...');
            this.start();
        }
        else {
            // Uncomment for verbose health check logging
            // this.outputChannel.appendLine('[Watchdog] Health check passed');
        }
    }
    stop() {
        this.isShuttingDown = true;
        this.outputChannel.appendLine('[Watchdog] Stopping watchdog...');
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        this.serverManager.stop();
    }
    getOutputChannel() {
        return this.outputChannel;
    }
}
exports.MCPServerWatchdog = MCPServerWatchdog;
//# sourceMappingURL=mcp-server-watchdog.js.map