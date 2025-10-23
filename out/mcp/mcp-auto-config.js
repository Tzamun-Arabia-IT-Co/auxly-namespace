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
exports.autoConfigureMCP = autoConfigureMCP;
exports.resetMCPConfig = resetMCPConfig;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const jsonc = __importStar(require("jsonc-parser"));
/**
 * Automatic MCP Server Configuration
 * This module automatically configures the MCP server in Cursor's settings.json
 * Similar to how Todo2 extension handles MCP configuration
 */
/**
 * Get the path to Cursor's user settings.json
 */
function getCursorSettingsPath() {
    if (process.platform === 'win32') {
        return path.join(process.env.APPDATA || '', 'Cursor', 'User', 'settings.json');
    }
    else if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json');
    }
    else {
        return path.join(os.homedir(), '.config', 'Cursor', 'User', 'settings.json');
    }
}
/**
 * Check if MCP server is already configured
 */
function isMCPConfigured(settingsPath) {
    if (!fs.existsSync(settingsPath)) {
        return false;
    }
    try {
        const content = fs.readFileSync(settingsPath, 'utf8');
        const settings = jsonc.parse(content);
        return !!(settings?.mcpServers?.auxly);
    }
    catch {
        return false;
    }
}
/**
 * Configure MCP server in settings.json
 */
function configureMCP(context) {
    try {
        const settingsPath = getCursorSettingsPath();
        // Use the wrapper script with auto-restart (preferred)
        const wrapperPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'start-with-restart.js');
        // Fallback to direct server if wrapper doesn't exist
        const serverPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'index.js');
        const pathToUse = fs.existsSync(wrapperPath) ? wrapperPath : serverPath;
        // Verify MCP server exists
        if (!fs.existsSync(pathToUse)) {
            console.error('[Auxly MCP] Server not found at:', pathToUse);
            return false;
        }
        console.log('[Auxly MCP] Using:', fs.existsSync(wrapperPath) ? 'wrapper with auto-restart ✅' : 'direct server (no auto-restart)');
        // Read or create settings
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            const content = fs.readFileSync(settingsPath, 'utf8');
            settings = jsonc.parse(content) || {};
        }
        // Initialize mcpServers if needed
        if (!settings.mcpServers) {
            settings.mcpServers = {};
        }
        // Add or update Auxly MCP server configuration with wrapper script
        settings.mcpServers.auxly = {
            command: 'node',
            args: [pathToUse]
        };
        // Ensure directory exists
        const settingsDir = path.dirname(settingsPath);
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        // Write back to settings.json
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
        console.log('[Auxly MCP] ✅ Configuration written to:', settingsPath);
        return true;
    }
    catch (error) {
        console.error('[Auxly MCP] Configuration failed:', error);
        return false;
    }
}
/**
 * Auto-configure MCP server on first install or version update
 * This is the main function called from extension activation
 */
async function autoConfigureMCP(context) {
    try {
        // Check if configuration exists in settings.json
        const settingsPath = getCursorSettingsPath();
        const configExists = isMCPConfigured(settingsPath);
        // Check state flags
        const isFirstInstall = !context.globalState.get('auxly.mcpConfigured');
        const lastVersion = context.globalState.get('auxly.lastVersion');
        const currentVersion = context.extension?.packageJSON?.version || 'unknown';
        const isVersionUpdate = lastVersion !== currentVersion;
        // ALWAYS configure if:
        // 1. Configuration doesn't exist in settings.json (user removed it or reset happened)
        // 2. First install
        // 3. Version update
        const shouldConfigure = !configExists || isFirstInstall || isVersionUpdate;
        if (!shouldConfigure) {
            console.log('[Auxly MCP] Configuration exists and version unchanged, skipping');
            return;
        }
        const reason = !configExists ? '(config missing)' :
            isFirstInstall ? '(first install)' :
                '(version update)';
        console.log('[Auxly MCP] Configuring...', reason);
        // Configure MCP
        const success = configureMCP(context);
        if (success) {
            // Mark as configured
            await context.globalState.update('auxly.mcpConfigured', true);
            await context.globalState.update('auxly.lastVersion', currentVersion);
            // Show reload prompt (like Todo2!)
            const selection = await vscode.window.showInformationMessage('✅ Auxly MCP Server configured! Please reload Cursor to activate MCP tools.', 'Reload Now', 'Later');
            if (selection === 'Reload Now') {
                await vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        }
        else {
            // Configuration failed - show error but don't block extension
            vscode.window.showWarningMessage('⚠️ Auxly MCP configuration failed. Extension will still work, but MCP tools may not be available.', 'OK');
        }
    }
    catch (error) {
        console.error('[Auxly MCP] Auto-configuration error:', error);
        // Don't throw - let extension continue
    }
}
/**
 * Reset MCP configuration (for troubleshooting)
 */
async function resetMCPConfig(context) {
    await context.globalState.update('auxly.mcpConfigured', undefined);
    await context.globalState.update('auxly.lastVersion', undefined);
    vscode.window.showInformationMessage('✅ MCP configuration reset. Reload Cursor to reconfigure.', 'Reload Now').then(selection => {
        if (selection === 'Reload Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    });
}
//# sourceMappingURL=mcp-auto-config.js.map