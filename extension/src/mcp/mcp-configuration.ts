import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as jsonc from 'jsonc-parser';

/**
 * Automatic MCP Configuration for Cursor
 * Detects and prevents duplicate configurations
 */
export class MCPConfiguration {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;
    }

    /**
     * Get path to Cursor's USER settings.json
     */
    private getCursorSettingsPath(): string {
        if (process.platform === 'win32') {
            return path.join(process.env.APPDATA || '', 'Cursor', 'User', 'settings.json');
        } else if (process.platform === 'darwin') {
            return path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json');
        } else {
            return path.join(os.homedir(), '.config', 'Cursor', 'User', 'settings.json');
        }
    }

    /**
     * Get path to WORKSPACE settings.json (if exists)
     */
    private getWorkspaceSettingsPath(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }
        
        return path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'settings.json');
    }

    /**
     * Get MCP server executable path
     */
    private getMCPServerPath(): string {
        const extensionPath = this.context.extensionPath;
        const serverPath = path.join(extensionPath, 'dist', 'mcp-server', 'index.js');
        
        this.outputChannel.appendLine(`[Config] MCP server path: ${serverPath}`);
        
        if (!fs.existsSync(serverPath)) {
            throw new Error(`MCP server not found at: ${serverPath}`);
        }
        
        return serverPath;
    }

    /**
     * Check if MCP is configured in a specific file
     */
    private async isConfiguredInFile(filePath: string): Promise<boolean> {
        if (!fs.existsSync(filePath)) {
            return false;
        }
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const settings = jsonc.parse(content);
            
            if (settings?.mcpServers?.auxly) {
                this.outputChannel.appendLine(`[Config] Found existing auxly config in: ${filePath}`);
                return true;
            }
        } catch (e) {
            this.outputChannel.appendLine(`[Config] Could not read ${filePath}: ${e}`);
        }
        
        return false;
    }

    /**
     * Remove MCP configuration from a specific file
     */
    private async removeFromFile(filePath: string): Promise<void> {
        if (!fs.existsSync(filePath)) {
            return;
        }
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const settings = jsonc.parse(content);
            
            if (settings?.mcpServers?.auxly) {
                this.outputChannel.appendLine(`[Config] Removing auxly config from: ${filePath}`);
                delete settings.mcpServers.auxly;
                
                // Remove mcpServers if empty
                if (Object.keys(settings.mcpServers).length === 0) {
                    delete settings.mcpServers;
                }
                
                const newContent = JSON.stringify(settings, null, 4);
                fs.writeFileSync(filePath, newContent, 'utf8');
                this.outputChannel.appendLine(`[Config] ✅ Removed configuration from: ${filePath}`);
            }
        } catch (e) {
            this.outputChannel.appendLine(`[Config] Error removing from ${filePath}: ${e}`);
        }
    }

    /**
     * Check for duplicate configurations across ALL settings files
     */
    async checkForDuplicates(): Promise<{hasDuplicates: boolean, locations: string[]}> {
        const userSettingsPath = this.getCursorSettingsPath();
        const workspaceSettingsPath = this.getWorkspaceSettingsPath();
        
        const locations: string[] = [];
        
        if (await this.isConfiguredInFile(userSettingsPath)) {
            locations.push('User Settings');
        }
        
        if (workspaceSettingsPath && await this.isConfiguredInFile(workspaceSettingsPath)) {
            locations.push('Workspace Settings');
        }
        
        return {
            hasDuplicates: locations.length > 1,
            locations
        };
    }

    /**
     * Remove ALL existing auxly configurations from ALL locations
     */
    async removeAllConfigurations(): Promise<void> {
        this.outputChannel.appendLine('[Config] Removing all existing auxly configurations...');
        
        const userSettingsPath = this.getCursorSettingsPath();
        const workspaceSettingsPath = this.getWorkspaceSettingsPath();
        
        await this.removeFromFile(userSettingsPath);
        
        if (workspaceSettingsPath) {
            await this.removeFromFile(workspaceSettingsPath);
        }
        
        this.outputChannel.appendLine('[Config] ✅ Cleanup complete');
    }

    /**
     * Configure MCP server automatically in Cursor's settings
     * ONLY configures in USER settings, removes any workspace duplicates
     */
    async configure(): Promise<boolean> {
        try {
            this.outputChannel.appendLine('[Config] ========================================');
            this.outputChannel.appendLine('[Config] Starting automatic MCP configuration...');
            this.outputChannel.appendLine('[Config] ========================================');
            
            // CRITICAL: Check for and remove ALL existing configurations first
            const duplicateCheck = await this.checkForDuplicates();
            if (duplicateCheck.locations.length > 0) {
                this.outputChannel.appendLine('[Config] ⚠️ Found existing configurations in:');
                duplicateCheck.locations.forEach(loc => {
                    this.outputChannel.appendLine(`[Config]    - ${loc}`);
                });
                
                if (duplicateCheck.hasDuplicates) {
                    this.outputChannel.appendLine('[Config] ⚠️ DUPLICATE DETECTED! This causes race conditions.');
                }
                
                this.outputChannel.appendLine('[Config] Removing all existing configurations...');
                await this.removeAllConfigurations();
            }
            
            const settingsPath = this.getCursorSettingsPath();
            const workspaceSettingsPath = this.getWorkspaceSettingsPath();
            const mcpServerPath = this.getMCPServerPath();
            
            // Get API credentials
            const apiKey = await this.context.globalState.get<string>('API_KEY') || 'your-api-key-here';
            
            // REMOTE SSH FIX: Safe config access
            let apiUrl = 'https://auxly.tzamun.com:8000'; // Default
            try {
                const config = vscode.workspace.getConfiguration('auxly');
                if (config) {
                    apiUrl = config.get<string>('apiUrl') || apiUrl;
                }
            } catch (configError) {
                this.outputChannel.appendLine(`[Config] Warning: Could not read configuration (remote SSH?), using default API URL`);
            }
            
            this.outputChannel.appendLine(`[Config] API URL: ${apiUrl}`);
            this.outputChannel.appendLine(`[Config] User settings: ${settingsPath}`);
            this.outputChannel.appendLine(`[Config] Workspace settings: ${workspaceSettingsPath || 'none'}`);
            
            // Read existing settings
            let settings: any = {};
            let originalContent = '{}';
            
            if (fs.existsSync(settingsPath)) {
                originalContent = fs.readFileSync(settingsPath, 'utf8');
                
                try {
                    settings = jsonc.parse(originalContent);
                    this.outputChannel.appendLine('[Config] Successfully parsed settings.json');
                } catch (parseError) {
                    this.outputChannel.appendLine(`[Config] Failed to parse settings.json: ${parseError}`);
                    throw new Error('Could not parse Cursor settings.json');
                }
            } else {
                this.outputChannel.appendLine('[Config] No existing settings.json, creating new one');
            }
            
            // Initialize mcpServers if needed
            if (!settings.mcpServers) {
                settings.mcpServers = {};
                this.outputChannel.appendLine('[Config] Created mcpServers section');
            }
            
            // ALWAYS update the configuration (even if it exists)
            // This ensures the path points to the latest extension version
            if (settings.mcpServers.auxly) {
                this.outputChannel.appendLine('[Config] Removing old auxly configuration...');
                delete settings.mcpServers.auxly;
            }
            
            // Add fresh Auxly MCP server configuration with latest path
            this.outputChannel.appendLine('[Config] Adding new auxly configuration...');
            settings.mcpServers.auxly = {
                command: 'node',
                args: [mcpServerPath]
                // No env needed for minimal server
            };
            
            // Ensure directory exists
            const settingsDir = path.dirname(settingsPath);
            if (!fs.existsSync(settingsDir)) {
                fs.mkdirSync(settingsDir, { recursive: true });
            }
            
            // Write back to USER settings.json ONLY
            const newContent = JSON.stringify(settings, null, 4);
            fs.writeFileSync(settingsPath, newContent, 'utf8');
            
            this.outputChannel.appendLine('[Config] ✅ Successfully wrote MCP configuration to USER settings');
            this.outputChannel.appendLine('[Config] ========================================');
            this.outputChannel.appendLine('[Config] IMPORTANT: Configuration is in USER settings ONLY');
            this.outputChannel.appendLine('[Config] If "already being initialized" errors occur,');
            this.outputChannel.appendLine('[Config] run "Auxly: Check MCP Configuration" to diagnose');
            this.outputChannel.appendLine('[Config] ========================================');
            return true;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`[Config] ❌ Configuration failed: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Check if MCP is already configured
     */
    async isConfigured(): Promise<boolean> {
        try {
            const settingsPath = this.getCursorSettingsPath();
            
            if (!fs.existsSync(settingsPath)) {
                return false;
            }
            
            const content = fs.readFileSync(settingsPath, 'utf8');
            const settings = jsonc.parse(content);
            
            return !!(settings?.mcpServers?.auxly);
        } catch (error) {
            return false;
        }
    }

    /**
     * Remove MCP configuration (for cleanup)
     */
    async remove(): Promise<void> {
        try {
            const settingsPath = this.getCursorSettingsPath();
            
            if (!fs.existsSync(settingsPath)) {
                return;
            }
            
            const content = fs.readFileSync(settingsPath, 'utf8');
            const settings = jsonc.parse(content);
            
            if (settings?.mcpServers?.auxly) {
                delete settings.mcpServers.auxly;
                
                // Remove mcpServers if empty
                if (Object.keys(settings.mcpServers).length === 0) {
                    delete settings.mcpServers;
                }
                
                const newContent = JSON.stringify(settings, null, 4);
                fs.writeFileSync(settingsPath, newContent, 'utf8');
                
                this.outputChannel.appendLine('[Config] Removed MCP configuration');
            }
        } catch (error) {
            this.outputChannel.appendLine(`[Config] Error removing configuration: ${error}`);
        }
    }
}

