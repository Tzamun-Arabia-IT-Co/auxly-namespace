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
exports.registerMCP = registerMCP;
exports.unregisterMCP = unregisterMCP;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
function generateWorkspaceHash(workspacePath) {
    return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
}
async function registerMCP(context) {
    console.log('[Auxly MCP] Starting registration...');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        console.error('[Auxly MCP] No workspace folder found');
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const workspaceHash = generateWorkspaceHash(workspacePath);
    const cursorAPI = vscode.cursor;
    if (!cursorAPI?.registerMCPServer) {
        console.warn('[Auxly MCP] Cursor MCP API not available');
        return;
    }
    const serverPath = path.join(context.extensionPath, 'out', 'mcp-server.js');
    if (!fs.existsSync(serverPath)) {
        console.error('[Auxly MCP] Server file not found:', serverPath);
        return;
    }
    const config = {
        name: `auxly-${workspaceHash}`,
        command: 'node',
        args: [serverPath],
        env: {
            WORKSPACE_PATH: workspacePath,
            AUXLY_API_URL: vscode.workspace.getConfiguration('auxly').get('apiUrl') || 'https://auxly.tzamun.com:8000'
        }
    };
    try {
        await cursorAPI.registerMCPServer(config);
        console.log('[Auxly MCP] ✅ Registered successfully');
    }
    catch (error) {
        console.error('[Auxly MCP] Registration failed:', error);
    }
}
async function unregisterMCP() {
    console.log('[Auxly MCP] Unregistering...');
    const vscode = require('vscode');
    const cursorAPI = vscode.cursor;
    if (!cursorAPI?.unregisterMCPServer) {
        console.warn('[Auxly MCP] Cursor MCP API not available');
        return;
    }
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const workspaceHash = generateWorkspaceHash(workspacePath);
            await cursorAPI.unregisterMCPServer(`auxly-${workspaceHash}`);
            console.log('[Auxly MCP] ✅ Unregistered successfully');
        }
    }
    catch (error) {
        console.error('[Auxly MCP] Unregister failed:', error);
    }
}
//# sourceMappingURL=mcp-simple.js.map