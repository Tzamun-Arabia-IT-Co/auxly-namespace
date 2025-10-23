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
exports.registerMCPServerWithCursorAPI = registerMCPServerWithCursorAPI;
exports.unregisterMCPServer = unregisterMCPServer;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
/**
 * Auxly MCP Registration using Cursor's Extension API
 * This is the SAME approach as Todo2 extension
 */
/**
 * Generate workspace hash (same as Todo2)
 */
function generateWorkspaceHash(workspacePath) {
    return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
}
/**
 * Register MCP server using Cursor's extension API (same as Todo2!)
 */
async function registerMCPServerWithCursorAPI(context) {
    try {
        console.log('[Auxly MCP] Registering MCP server using Cursor API...');
        // Get workspace path
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspacePath = workspaceFolders && workspaceFolders.length > 0
            ? workspaceFolders[0].uri.fsPath
            : '';
        // Get extension path and MCP server path
        const extensionPath = context.extensionPath;
        const mcpServerPath = path.join(extensionPath, 'dist', 'mcp-server', 'index.js');
        // Verify MCP server exists
        if (!fs.existsSync(mcpServerPath)) {
            console.error('[Auxly MCP] MCP server not found at:', mcpServerPath);
            return false;
        }
        // Generate workspace ID
        const workspaceHash = workspacePath ? generateWorkspaceHash(workspacePath) : 'default';
        console.log(`[Auxly MCP] Workspace: ${workspacePath || 'No workspace'}`);
        console.log(`[Auxly MCP] Workspace ID: ${workspaceHash}`);
        console.log(`[Auxly MCP] MCP Server: ${mcpServerPath}`);
        // Check if Cursor MCP API is available
        const cursorAPI = vscode.cursor;
        if (!cursorAPI || !cursorAPI.mcp || !cursorAPI.mcp.registerServer) {
            console.error('[Auxly MCP] Cursor MCP API not available');
            console.log('[Auxly MCP] Falling back to .cursor/mcp.json approach');
            return false;
        }
        // Unregister if already registered (like Todo2 does)
        try {
            cursorAPI.mcp.unregisterServer('auxly');
            console.log('[Auxly MCP] Unregistered existing server');
        }
        catch (e) {
            // Ignore - server wasn't registered
        }
        // Register MCP server with Cursor API (EXACT same as Todo2!)
        // Note: Cursor adds "extension-" prefix automatically, so use "auxly"
        // CRITICAL FIX: Use process.execPath instead of 'node' for reliability
        const serverConfig = {
            name: 'auxly',
            server: {
                command: process.execPath, // Full path to node.exe (more reliable than 'node')
                args: [
                    mcpServerPath
                    // Note: Todo2 uses --workspace-id, but we use env vars
                ],
                env: {
                    AUXLY_WORKSPACE_PATH: workspacePath || '',
                    AUXLY_WORKSPACE_ID: workspaceHash,
                    AUXLY_API_URL: vscode.workspace.getConfiguration('auxly').get('apiUrl') || 'https://auxly.tzamun.com:8000'
                }
            }
        };
        console.log('[Auxly MCP] Registering with config:', JSON.stringify(serverConfig, null, 2));
        try {
            await cursorAPI.mcp.registerServer(serverConfig);
            console.log('[Auxly MCP] ✅ Successfully registered MCP server using Cursor API');
            // Wait a moment for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Verify registration
            try {
                const servers = await cursorAPI.mcp.getServers();
                console.log('[Auxly MCP] Registered servers:', Object.keys(servers));
                // Check both possible names (Cursor might add "extension-" prefix)
                if (servers['auxly'] || servers['extension-auxly']) {
                    console.log('[Auxly MCP] ✅ Auxly server found in registry');
                }
                else {
                    console.log('[Auxly MCP] ⚠️ Auxly server NOT in registry after registration!');
                }
            }
            catch (verifyError) {
                console.log('[Auxly MCP] Could not verify registration:', verifyError);
            }
            return true;
        }
        catch (registerError) {
            console.error('[Auxly MCP] Registration failed:', registerError);
            return false;
        }
    }
    catch (error) {
        console.error('[Auxly MCP] Failed to register with Cursor API:', error);
        return false;
    }
}
/**
 * Unregister MCP server (for cleanup)
 */
async function unregisterMCPServer() {
    try {
        const cursorAPI = vscode.cursor;
        if (cursorAPI?.mcp?.unregisterServer) {
            cursorAPI.mcp.unregisterServer('auxly');
            console.log('[Auxly MCP] MCP server unregistered');
        }
    }
    catch (error) {
        console.error('[Auxly MCP] Failed to unregister:', error);
    }
}
//# sourceMappingURL=mcp-cursor-api.js.map