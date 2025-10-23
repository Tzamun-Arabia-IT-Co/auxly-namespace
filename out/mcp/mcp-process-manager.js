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
exports.MCPProcessManager = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
/**
 * MCP Process Manager - Manages MCP server process lifecycle
 *
 * OUT-OF-THE-BOX SOLUTION:
 * Instead of relying on external wrapper scripts, this manager:
 * 1. Spawns MCP server process directly from extension
 * 2. Monitors it using Node's ChildProcess events
 * 3. Auto-restarts on crashes with exponential backoff
 * 4. Updates Cursor MCP configuration dynamically
 *
 * This is more reliable because the extension is always running!
 */
class MCPProcessManager {
    constructor(context) {
        this.context = context;
        this.mcpProcess = null;
        this.isShuttingDown = false;
        this.restartAttempts = 0;
        this.MAX_RESTART_ATTEMPTS = 10;
        this.restartTimeout = null;
        this.healthCheckInterval = null;
        this.outputChannel = vscode.window.createOutputChannel('Auxly MCP Process Manager');
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBar.command = 'auxly.showMCPStatus';
        context.subscriptions.push(this.outputChannel, this.statusBar);
    }
    static getInstance(context) {
        if (!MCPProcessManager.instance) {
            MCPProcessManager.instance = new MCPProcessManager(context);
        }
        return MCPProcessManager.instance;
    }
    /**
     * Start the MCP server process and monitor it
     */
    async start() {
        if (this.mcpProcess) {
            this.log('⚠️ MCP process already running');
            return true;
        }
        this.log('═══════════════════════════════════════════════');
        this.log('🚀 STARTING MCP SERVER PROCESS');
        this.log('═══════════════════════════════════════════════');
        try {
            // Get MCP server path
            const mcpServerPath = path.join(this.context.extensionPath, 'dist', 'mcp-server', 'index.js');
            this.log(`📁 MCP Server Path: ${mcpServerPath}`);
            // Spawn MCP server process
            this.mcpProcess = (0, child_process_1.spawn)('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'production'
                }
            });
            this.log(`✅ MCP process spawned (PID: ${this.mcpProcess.pid})`);
            this.updateStatusBar('$(loading~spin) MCP Starting...', 'yellow');
            // Setup process monitoring
            this.setupProcessMonitoring();
            // Start health checks (every 5 seconds)
            this.startHealthChecks();
            // Reset restart attempts on successful start
            this.restartAttempts = 0;
            // Wait a moment for process to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Update Cursor MCP configuration
            await this.updateCursorMCPConfig();
            this.log('✅ MCP server started successfully!');
            this.updateStatusBar('$(check) MCP: Healthy', 'green');
            return true;
        }
        catch (error) {
            this.log(`❌ Failed to start MCP server: ${error}`);
            this.updateStatusBar('$(error) MCP: Failed', 'red');
            return false;
        }
    }
    /**
     * Setup process monitoring with auto-restart
     */
    setupProcessMonitoring() {
        if (!this.mcpProcess)
            return;
        // Monitor stdout
        this.mcpProcess.stdout?.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
                this.log(`[MCP OUT] ${message}`);
            }
        });
        // Monitor stderr
        this.mcpProcess.stderr?.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
                this.log(`[MCP ERR] ${message}`, 'error');
            }
        });
        // Monitor process exit
        this.mcpProcess.on('exit', (code, signal) => {
            this.log('═══════════════════════════════════════════════');
            this.log(`⚠️ MCP PROCESS EXITED`);
            this.log(`Exit Code: ${code}`);
            this.log(`Signal: ${signal}`);
            this.log('═══════════════════════════════════════════════');
            this.mcpProcess = null;
            if (!this.isShuttingDown) {
                this.updateStatusBar('$(warning) MCP: Crashed', 'yellow');
                this.scheduleRestart();
            }
        });
        // Monitor process errors
        this.mcpProcess.on('error', (error) => {
            this.log(`❌ MCP process error: ${error.message}`, 'error');
            if (!this.isShuttingDown) {
                this.updateStatusBar('$(error) MCP: Error', 'red');
                this.scheduleRestart();
            }
        });
        this.log('✅ Process monitoring setup complete');
    }
    /**
     * Schedule automatic restart with exponential backoff
     */
    scheduleRestart() {
        if (this.isShuttingDown) {
            this.log('🛑 Shutdown in progress, skipping restart');
            return;
        }
        if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
            this.log(`❌ Max restart attempts (${this.MAX_RESTART_ATTEMPTS}) reached. Giving up.`);
            this.updateStatusBar('$(error) MCP: Failed (max retries)', 'red');
            vscode.window.showErrorMessage('Auxly MCP server failed to start after multiple attempts. Please check logs.', 'Open Logs').then(choice => {
                if (choice === 'Open Logs') {
                    this.outputChannel.show();
                }
            });
            return;
        }
        this.restartAttempts++;
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s, ...
        const delay = Math.min(Math.pow(2, this.restartAttempts) * 1000, 30000);
        this.log(`🔄 Scheduling restart attempt ${this.restartAttempts}/${this.MAX_RESTART_ATTEMPTS} in ${delay}ms...`);
        this.updateStatusBar(`$(sync~spin) MCP: Restarting (${this.restartAttempts}/${this.MAX_RESTART_ATTEMPTS})...`, 'yellow');
        this.restartTimeout = setTimeout(async () => {
            this.log(`♻️ Auto-restart attempt ${this.restartAttempts}...`);
            const success = await this.start();
            if (success) {
                this.log('✅ Auto-restart successful!');
                vscode.window.showInformationMessage('✅ Auxly MCP server restarted successfully!');
            }
            else {
                this.log('❌ Auto-restart failed');
            }
        }, delay);
    }
    /**
     * Start health checks every 5 seconds
     */
    startHealthChecks() {
        // Clear existing interval
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.log('🏥 Starting health checks (every 5 seconds)...');
        this.healthCheckInterval = setInterval(() => {
            this.checkHealth();
        }, 5000);
    }
    /**
     * Check if MCP process is healthy
     */
    checkHealth() {
        if (!this.mcpProcess || this.mcpProcess.killed) {
            this.log('❌ Health check failed: Process not running');
            this.updateStatusBar('$(error) MCP: Not Running', 'red');
            if (!this.isShuttingDown && !this.restartTimeout) {
                this.log('🔄 Triggering auto-restart from health check...');
                this.scheduleRestart();
            }
        }
        else {
            // Process is running
            this.log('✅ Health check passed: Process running (PID: ' + this.mcpProcess.pid + ')');
            this.updateStatusBar('$(check) MCP: Healthy', 'green');
        }
    }
    /**
     * Update Cursor MCP configuration to use stdio transport
     */
    async updateCursorMCPConfig() {
        try {
            this.log('📝 Updating Cursor MCP configuration...');
            const config = vscode.workspace.getConfiguration();
            const mcpServers = config.get('mcpServers') || {};
            // Configure Auxly MCP to use stdio (direct communication)
            mcpServers['auxly'] = {
                command: 'node',
                args: [
                    path.join(this.context.extensionPath, 'dist', 'mcp-server', 'index.js')
                ],
                disabled: false
            };
            await config.update('mcpServers', mcpServers, vscode.ConfigurationTarget.Global);
            this.log('✅ Cursor MCP configuration updated');
        }
        catch (error) {
            this.log(`⚠️ Failed to update Cursor MCP config: ${error}`, 'error');
        }
    }
    /**
     * Stop the MCP server process
     */
    async stop() {
        this.log('🛑 Stopping MCP server...');
        this.isShuttingDown = true;
        // Clear health checks
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        // Clear restart timeout
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }
        // Kill process
        if (this.mcpProcess && !this.mcpProcess.killed) {
            this.log(`Killing MCP process (PID: ${this.mcpProcess.pid})...`);
            this.mcpProcess.kill('SIGTERM');
            // Force kill after 5 seconds if still running
            setTimeout(() => {
                if (this.mcpProcess && !this.mcpProcess.killed) {
                    this.log('Force killing MCP process...');
                    this.mcpProcess.kill('SIGKILL');
                }
            }, 5000);
        }
        this.mcpProcess = null;
        this.updateStatusBar('$(circle-slash) MCP: Stopped', 'gray');
        this.log('✅ MCP server stopped');
    }
    /**
     * Restart the MCP server
     */
    async restart() {
        this.log('♻️ Restarting MCP server...');
        await this.stop();
        this.isShuttingDown = false;
        this.restartAttempts = 0;
        // Wait a moment before restarting
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.start();
    }
    /**
     * Get current process status
     */
    getStatus() {
        return {
            running: this.mcpProcess !== null && !this.mcpProcess.killed,
            pid: this.mcpProcess?.pid,
            attempts: this.restartAttempts
        };
    }
    /**
     * Log message to output channel
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const levelIcon = level === 'error' ? '❌' : 'ℹ️';
        this.outputChannel.appendLine(`[${timestamp}] ${levelIcon} ${message}`);
    }
    /**
     * Update status bar with icon and color
     */
    updateStatusBar(text, color) {
        this.statusBar.text = text;
        this.statusBar.backgroundColor = undefined;
        switch (color) {
            case 'green':
                this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                break;
            case 'red':
                this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            case 'yellow':
                this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
        }
        this.statusBar.show();
    }
    /**
     * Show output channel
     */
    showLogs() {
        this.outputChannel.show();
    }
}
exports.MCPProcessManager = MCPProcessManager;
//# sourceMappingURL=mcp-process-manager.js.map