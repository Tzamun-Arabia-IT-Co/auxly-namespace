/**
 * MCP Settings Configuration
 * Simple approach: Just write to settings.json and let Cursor manage everything!
 * No wrappers, no health monitoring, no complex restart logic - Cursor does it all!
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

/**
 * Configure MCP server in Cursor settings.json
 * Cursor will automatically spawn, monitor, and restart the process
 */
export async function configureMCPServerInSettings(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
): Promise<{ configured: boolean, needsReload: boolean }> {
    try {
        outputChannel.appendLine('🔧 Configuring MCP server in settings.json...');
        
        const settingsPath = getCursorSettingsPath();
        outputChannel.appendLine(`📁 Settings file: ${settingsPath}`);
        
        // Ensure directory exists
        const settingsDir = path.dirname(settingsPath);
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
            outputChannel.appendLine(`✅ Created settings directory: ${settingsDir}`);
        }
        
        // Read existing settings
        let settings: any = {};
        if (fs.existsSync(settingsPath)) {
            const content = await fs.promises.readFile(settingsPath, 'utf-8');
            try {
                settings = JSON.parse(content);
                outputChannel.appendLine('✅ Read existing settings');
            } catch (e) {
                outputChannel.appendLine('⚠️ Settings file exists but is not valid JSON - creating new');
                settings = {};
            }
        } else {
            outputChannel.appendLine('📝 Creating new settings file');
        }
        
        // Check if already configured
        if (settings.mcpServers && settings.mcpServers['extension-auxly']) {
            outputChannel.appendLine('✅ Auxly MCP server already configured');
            outputChannel.appendLine('   Cursor is managing the process automatically');
            return { configured: true, needsReload: false }; // Already configured - no reload needed
        }
        
        // Get paths
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspacePath = workspaceFolders && workspaceFolders.length > 0 
            ? workspaceFolders[0].uri.fsPath 
            : '';
        const workspaceHash = workspacePath ? generateWorkspaceHash(workspacePath) : 'default';
        
        // Get absolute path to MCP server
        const serverPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'index.js');
        
        if (!fs.existsSync(serverPath)) {
            throw new Error(`MCP server not found at: ${serverPath}`);
        }
        
        outputChannel.appendLine(`✅ Server path: ${serverPath}`);
        outputChannel.appendLine(`📁 Workspace: ${workspacePath || 'No workspace'}`);
        outputChannel.appendLine(`🔑 Workspace ID: ${workspaceHash}`);
        
        // Configure MCP server - Cursor will manage it!
        settings.mcpServers = settings.mcpServers || {};
        settings.mcpServers['extension-auxly'] = {
            command: 'node',
            args: [serverPath],
            env: {
                AUXLY_WORKSPACE_PATH: workspacePath || '',
                AUXLY_WORKSPACE_ID: workspaceHash,
                AUXLY_API_URL: vscode.workspace.getConfiguration('auxly').get<string>('apiUrl') || 'https://auxly.tzamun.com:8000'
            }
        };
        
        // Write settings
        await fs.promises.writeFile(
            settingsPath,
            JSON.stringify(settings, null, 2),
            'utf-8'
        );
        
        // Also create workspace marker to trigger Cursor's MCP detection
        if (workspacePath) {
            try {
                const markerPath = path.join(workspacePath, '.cursor', 'auxly-mcp.json');
                const markerDir = path.dirname(markerPath);
                if (!fs.existsSync(markerDir)) {
                    fs.mkdirSync(markerDir, { recursive: true });
                }
                await fs.promises.writeFile(
                    markerPath,
                    JSON.stringify({ 
                        configured: true, 
                        timestamp: new Date().toISOString(),
                        serverPath: serverPath 
                    }, null, 2),
                    'utf-8'
                );
                outputChannel.appendLine('✅ Created workspace MCP marker file');
            } catch (err) {
                outputChannel.appendLine(`⚠️ Could not create workspace marker: ${err}`);
            }
        }
        
        outputChannel.appendLine('');
        outputChannel.appendLine('═══════════════════════════════════════════════');
        outputChannel.appendLine('✅ MCP SERVER CONFIGURED SUCCESSFULLY!');
        outputChannel.appendLine('═══════════════════════════════════════════════');
        outputChannel.appendLine('');
        outputChannel.appendLine('🎯 What happens now:');
        outputChannel.appendLine('   1. Cursor will spawn the MCP server process');
        outputChannel.appendLine('   2. Cursor will monitor the process health');
        outputChannel.appendLine('   3. Cursor will automatically restart if it crashes');
        outputChannel.appendLine('   4. You do NOTHING - Cursor manages everything!');
        outputChannel.appendLine('');
        outputChannel.appendLine('🔄 RELOAD REQUIRED: Please reload Cursor window to activate');
        outputChannel.appendLine('');
        
        return { configured: true, needsReload: true }; // Newly configured - reload required
        
    } catch (error) {
        outputChannel.appendLine(`❌ Configuration error: ${error}`);
        throw error;
    }
}

/**
 * Check if MCP is already configured in settings.json
 */
export async function checkMCPConfigured(settingsPath: string): Promise<boolean> {
    try {
        if (!fs.existsSync(settingsPath)) {
            return false;
        }
        
        const content = await fs.promises.readFile(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        return !!(settings.mcpServers && settings.mcpServers['auxly']);
    } catch (error) {
        console.error('Error checking MCP configuration:', error);
        return false;
    }
}

/**
 * Get Cursor settings.json path based on platform
 */
export function getCursorSettingsPath(): string {
    const homeDir = os.homedir();
    let settingsPath: string;
    
    if (process.platform === 'win32') {
        settingsPath = path.join(
            process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
            'Cursor',
            'User',
            'settings.json'
        );
    } else if (process.platform === 'darwin') {
        settingsPath = path.join(
            homeDir,
            'Library',
            'Application Support',
            'Cursor',
            'User',
            'settings.json'
        );
    } else {
        settingsPath = path.join(
            homeDir,
            '.config',
            'Cursor',
            'User',
            'settings.json'
        );
    }
    
    return settingsPath;
}

/**
 * Generate workspace hash for MCP server identification
 */
function generateWorkspaceHash(workspacePath: string): string {
    return crypto
        .createHash('md5')
        .update(workspacePath)
        .digest('hex')
        .substring(0, 8);
}

/**
 * Remove Auxly MCP server configuration from settings.json
 */
export async function removeMCPServerFromSettings(
    outputChannel: vscode.OutputChannel
): Promise<boolean> {
    try {
        const settingsPath = getCursorSettingsPath();
        
        if (!fs.existsSync(settingsPath)) {
            outputChannel.appendLine('⚠️ Settings file does not exist');
            return true;
        }
        
        const content = await fs.promises.readFile(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        
        if (!settings.mcpServers || !settings.mcpServers['auxly']) {
            outputChannel.appendLine('⚠️ Auxly MCP server not configured');
            return true;
        }
        
        delete settings.mcpServers['auxly'];
        
        // Remove mcpServers if empty
        if (Object.keys(settings.mcpServers).length === 0) {
            delete settings.mcpServers;
        }
        
        await fs.promises.writeFile(
            settingsPath,
            JSON.stringify(settings, null, 2),
            'utf-8'
        );
        
        outputChannel.appendLine('✅ Removed Auxly MCP server configuration');
        return true;
        
    } catch (error) {
        outputChannel.appendLine(`❌ Error removing configuration: ${error}`);
        return false;
    }
}


