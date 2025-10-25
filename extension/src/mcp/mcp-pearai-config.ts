import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Auxly MCP Configuration for PearAI Editor
 * PearAI uses a servers array in ~/.pearai/mcp.config.json (same structure as Trae)
 */

/**
 * Generate workspace hash for unique identification
 */
function generateWorkspaceHash(workspacePath: string): string {
    return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
}

/**
 * Configure MCP server for PearAI Editor
 * Writes configuration to ~/.pearai/mcp.config.json
 */
export async function configurePearAIMCP(
    context: vscode.ExtensionContext
): Promise<boolean> {
    try {
        console.log('[Auxly MCP] Configuring MCP for PearAI Editor...');
        
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
        
        // Get API URL from configuration
        const apiUrl = vscode.workspace.getConfiguration('auxly').get<string>('apiUrl') 
            || 'https://auxly.tzamun.com:8000';
        
        // Prepare MCP server configuration for PearAI
        const auxlyServerConfig = {
            id: "auxly",
            transport: "stdio",
            command: process.execPath, // Full path to Node.js
            args: [mcpServerPath],
            env: {
                AUXLY_WORKSPACE_PATH: workspacePath,
                AUXLY_WORKSPACE_ID: workspaceHash,
                AUXLY_API_URL: apiUrl
            }
        };
        
        // Determine PearAI config path
        const pearaiConfigDir = path.join(os.homedir(), '.pearai');
        const pearaiConfigPath = path.join(pearaiConfigDir, 'mcp.config.json');
        
        console.log(`[Auxly MCP] PearAI config path: ${pearaiConfigPath}`);
        
        // Ensure directory exists
        if (!fs.existsSync(pearaiConfigDir)) {
            console.log('[Auxly MCP] Creating .pearai directory...');
            fs.mkdirSync(pearaiConfigDir, { recursive: true });
        }
        
        // Read existing config if present
        let existingConfig: any = { servers: [] };
        if (fs.existsSync(pearaiConfigPath)) {
            try {
                const existingContent = fs.readFileSync(pearaiConfigPath, 'utf8');
                existingConfig = JSON.parse(existingContent);
                console.log('[Auxly MCP] Read existing PearAI config');
            } catch (error) {
                console.warn('[Auxly MCP] Failed to parse existing config, will create new:', error);
                existingConfig = { servers: [] };
            }
        }
        
        // Ensure servers array exists
        if (!existingConfig.servers || !Array.isArray(existingConfig.servers)) {
            existingConfig.servers = [];
        }
        
        // Remove old auxly server config if present
        existingConfig.servers = existingConfig.servers.filter((s: any) => s.id !== 'auxly');
        
        // Add new auxly server config
        existingConfig.servers.push(auxlyServerConfig);
        
        // Write config file
        fs.writeFileSync(pearaiConfigPath, JSON.stringify(existingConfig, null, 2));
        
        console.log('[Auxly MCP] ✅ Successfully wrote PearAI MCP config');
        console.log('[Auxly MCP] Config file:', pearaiConfigPath);
        
        return true;
        
    } catch (error) {
        console.error('[Auxly MCP] Failed to configure PearAI MCP:', error);
        return false;
    }
}

