import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Auxly MCP Configuration for Trae Editor
 * Trae uses a servers array in ~/.trae/mcp.config.json
 */

/**
 * Generate workspace hash for unique identification
 */
function generateWorkspaceHash(workspacePath: string): string {
    return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
}

/**
 * Configure MCP server for Trae Editor
 * Writes configuration to ~/.trae/mcp.config.json
 */
export async function configureTraeMCP(
    context: vscode.ExtensionContext
): Promise<boolean> {
    try {
        console.log('[Auxly MCP] Configuring MCP for Trae Editor...');
        
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
        
        // Get API URL from configuration - REMOTE SSH FIX
        const apiUrl = vscode.workspace.getConfiguration('auxly')?.get<string>('apiUrl') 
            || 'https://auxly.tzamun.com:8000';
        
        // Prepare MCP server configuration for Trae
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
        
        // Determine Trae config path
        const traeConfigDir = path.join(os.homedir(), '.trae');
        const traeConfigPath = path.join(traeConfigDir, 'mcp.config.json');
        
        console.log(`[Auxly MCP] Trae config path: ${traeConfigPath}`);
        
        // Ensure directory exists
        if (!fs.existsSync(traeConfigDir)) {
            console.log('[Auxly MCP] Creating .trae directory...');
            fs.mkdirSync(traeConfigDir, { recursive: true });
        }
        
        // Read existing config if present
        let existingConfig: any = { servers: [] };
        if (fs.existsSync(traeConfigPath)) {
            try {
                const existingContent = fs.readFileSync(traeConfigPath, 'utf8');
                existingConfig = JSON.parse(existingContent);
                console.log('[Auxly MCP] Read existing Trae config');
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
        fs.writeFileSync(traeConfigPath, JSON.stringify(existingConfig, null, 2));
        
        console.log('[Auxly MCP] ✅ Successfully wrote Trae MCP config');
        console.log('[Auxly MCP] Config file:', traeConfigPath);
        
        return true;
        
    } catch (error) {
        console.error('[Auxly MCP] Failed to configure Trae MCP:', error);
        return false;
    }
}

