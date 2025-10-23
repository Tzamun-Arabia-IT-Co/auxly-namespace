import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Auxly MCP Registration using Cursor's Extension API
 * This is the SAME approach as Todo2 extension
 */

/**
 * Generate workspace hash (same as Todo2)
 */
function generateWorkspaceHash(workspacePath: string): string {
    return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
}

/**
 * Register MCP server using Cursor's extension API (same as Todo2!)
 */
export async function registerMCPServerWithCursorAPI(
    context: vscode.ExtensionContext
): Promise<boolean> {
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
        const cursorAPI = (vscode as any).cursor;
        if (!cursorAPI || !cursorAPI.mcp || !cursorAPI.mcp.registerServer) {
            console.error('[Auxly MCP] Cursor MCP API not available');
            console.log('[Auxly MCP] Falling back to .cursor/mcp.json approach');
            return false;
        }
        
        // Unregister if already registered (like Todo2 does)
        try {
            cursorAPI.mcp.unregisterServer('auxly');
            console.log('[Auxly MCP] Unregistered existing server');
        } catch (e) {
            // Ignore - server wasn't registered
        }
        
        // Register MCP server with Cursor API (EXACT same as Todo2!)
        // Note: Cursor adds "extension-" prefix automatically, so use "auxly"
        // CRITICAL FIX: Use process.execPath instead of 'node' for reliability
        const serverConfig = {
            name: 'auxly',
            server: {
                command: process.execPath,  // Full path to node.exe (more reliable than 'node')
                args: [
                    mcpServerPath
                    // Note: Todo2 uses --workspace-id, but we use env vars
                ],
                env: {
                    AUXLY_WORKSPACE_PATH: workspacePath || '',
                    AUXLY_WORKSPACE_ID: workspaceHash,
                    AUXLY_API_URL: vscode.workspace.getConfiguration('auxly').get<string>('apiUrl') || 'https://auxly.tzamun.com:8000'
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
                } else {
                    console.log('[Auxly MCP] ⚠️ Auxly server NOT in registry after registration!');
                }
            } catch (verifyError) {
                console.log('[Auxly MCP] Could not verify registration:', verifyError);
            }
            
            return true;
        } catch (registerError) {
            console.error('[Auxly MCP] Registration failed:', registerError);
            return false;
        }
        
    } catch (error) {
        console.error('[Auxly MCP] Failed to register with Cursor API:', error);
        return false;
    }
}

/**
 * Unregister MCP server (for cleanup)
 */
export async function unregisterMCPServer(): Promise<void> {
    try {
        const cursorAPI = (vscode as any).cursor;
        if (cursorAPI?.mcp?.unregisterServer) {
            cursorAPI.mcp.unregisterServer('auxly');
            console.log('[Auxly MCP] MCP server unregistered');
        }
    } catch (error) {
        console.error('[Auxly MCP] Failed to unregister:', error);
    }
}

