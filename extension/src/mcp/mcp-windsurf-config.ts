import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Auxly MCP Configuration for Windsurf Editor
 * Windsurf uses mcpServers object in ~/.codeium/windsurf/mcp_config.json
 * 
 * Official Windsurf MCP Configuration Location:
 * - Windows: %USERPROFILE%\.codeium\windsurf\mcp_config.json
 * - macOS/Linux: ~/.codeium/windsurf/mcp_config.json
 */

/**
 * Generate workspace hash for unique identification
 */
function generateWorkspaceHash(workspacePath: string): string {
    return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
}

/**
 * Find Node.js executable for Windsurf
 * Windsurf bundles Node.js, typically in resources/app/node_modules/node/bin/node.exe
 */
function findNodeExecutable(): string {
    // Try to find bundled Node.js with Windsurf
    const windsurfPath = process.execPath; // e.g., C:\...\Windsurf\Windsurf.exe
    const windsurfDir = path.dirname(windsurfPath);
    
    // Common locations for bundled Node.js in Electron apps
    const possibleNodePaths = [
        path.join(windsurfDir, 'node.exe'),
        path.join(windsurfDir, 'resources', 'node.exe'),
        path.join(windsurfDir, 'resources', 'app', 'node.exe'),
        path.join(windsurfDir, 'resources', 'app', 'node_modules', '.bin', 'node.exe'),
        'node', // Fallback to system Node.js
    ];
    
    for (const nodePath of possibleNodePaths) {
        if (nodePath === 'node') {
            // Use system Node.js as fallback
            return 'node';
        }
        
        if (fs.existsSync(nodePath)) {
            console.log('[Auxly MCP] ✅ Found Node.js at:', nodePath);
            return nodePath;
        }
    }
    
    // Fallback: use system Node.js
    console.log('[Auxly MCP] ⚠️  Could not find bundled Node.js, using system node');
    return 'node';
}

/**
 * Configure MCP server for Windsurf Editor
 * Writes configuration to ~/.windsurf/settings.json
 */
export async function configureWindsurfMCP(
    context: vscode.ExtensionContext
): Promise<boolean> {
    try {
        console.log('========================================');
        console.log('[Auxly MCP] 🔍 WINDSURF CONFIGURATION START');
        console.log('========================================');
        
        // Get workspace path
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspacePath = workspaceFolders && workspaceFolders.length > 0 
            ? workspaceFolders[0].uri.fsPath 
            : '';
        
        console.log('[Auxly MCP] 📁 Workspace Path:', workspacePath || 'NO WORKSPACE');
        
        // Get extension path and MCP server path
        const extensionPath = context.extensionPath;
        const mcpServerPath = path.join(extensionPath, 'dist', 'mcp-server', 'index.js');
        
        console.log('[Auxly MCP] 📦 Extension Path:', extensionPath);
        console.log('[Auxly MCP] 🔌 MCP Server Path:', mcpServerPath);
        
        // Verify MCP server exists
        const serverExists = fs.existsSync(mcpServerPath);
        console.log('[Auxly MCP] ✅ MCP Server Exists:', serverExists);
        
        if (!serverExists) {
            console.error('[Auxly MCP] ❌ MCP server not found at:', mcpServerPath);
            console.log('[Auxly MCP] Checking dist directory contents...');
            const distPath = path.join(extensionPath, 'dist');
            if (fs.existsSync(distPath)) {
                const distContents = fs.readdirSync(distPath);
                console.log('[Auxly MCP] dist/ contents:', distContents);
            } else {
                console.error('[Auxly MCP] ❌ dist/ directory does not exist!');
            }
            return false;
        }
        
        // Generate workspace ID
        const workspaceHash = workspacePath ? generateWorkspaceHash(workspacePath) : 'default';
        
        console.log('[Auxly MCP] 🔑 Workspace ID (hash):', workspaceHash);
        
        // Get API URL from configuration
        const apiUrl = vscode.workspace.getConfiguration('auxly').get<string>('apiUrl') 
            || 'https://auxly.tzamun.com:8000';
        
        // Find Node.js executable (NOT Windsurf.exe!)
        const nodeExecutable = findNodeExecutable();
        
        console.log('[Auxly MCP] 🌐 API URL:', apiUrl);
        console.log('[Auxly MCP] 🖥️  Windsurf Path:', process.execPath);
        console.log('[Auxly MCP] 🟢 Node.js Path:', nodeExecutable);
        
        // Prepare MCP server configuration for Windsurf
        const auxlyServerConfig = {
            command: nodeExecutable, // Use Node.js, not Windsurf.exe!
            args: [mcpServerPath],
            env: {
                AUXLY_WORKSPACE_PATH: workspacePath,
                AUXLY_WORKSPACE_ID: workspaceHash,
                AUXLY_API_URL: apiUrl
            }
        };
        
        console.log('[Auxly MCP] ⚙️  Server Config:', JSON.stringify(auxlyServerConfig, null, 2));
        
        // ✅ CORRECT PATH: ~/.codeium/windsurf/mcp_config.json (Windsurf official location)
        // This is the documented location for Windsurf MCP configuration
        const configDir = path.join(os.homedir(), '.codeium', 'windsurf');
        const configPath = path.join(configDir, 'mcp_config.json');
        
        console.log('[Auxly MCP] 📝 Using official Windsurf MCP config path:', configPath);
        
        // Ensure directory exists
        if (!fs.existsSync(configDir)) {
            console.log('[Auxly MCP] 📁 Creating config directory:', configDir);
            fs.mkdirSync(configDir, { recursive: true });
            console.log('[Auxly MCP] ✅ Directory created successfully');
        } else {
            console.log('[Auxly MCP] ✅ Config directory already exists');
        }
        
        // Read existing config if present
        let existingConfig: any = {};
        if (fs.existsSync(configPath)) {
            try {
                const existingContent = fs.readFileSync(configPath, 'utf8');
                existingConfig = JSON.parse(existingContent);
                console.log('[Auxly MCP] ✅ Read existing Windsurf config');
                console.log('[Auxly MCP]   - Existing mcpServers:', Object.keys(existingConfig.mcpServers || {}));
            } catch (error) {
                console.warn('[Auxly MCP] ⚠️  Failed to parse existing config, will create new:', error);
                existingConfig = {};
            }
        } else {
            console.log('[Auxly MCP] ℹ️  No existing config file, will create new');
        }
        
        // Ensure mcpServers object exists
        if (!existingConfig.mcpServers || typeof existingConfig.mcpServers !== 'object') {
            console.log('[Auxly MCP] 📝 Creating mcpServers object');
            existingConfig.mcpServers = {};
        }
        
        // Add/update auxly server config
        existingConfig.mcpServers.auxly = auxlyServerConfig;
        console.log('[Auxly MCP] ✅ Added/updated auxly server config');
        
        // Write config file
        console.log('[Auxly MCP] 💾 Writing config file...');
        fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
        console.log('[Auxly MCP] ✅ Config file written successfully');
        
        // Verify file was written
        if (fs.existsSync(configPath)) {
            const fileSize = fs.statSync(configPath).size;
            console.log('[Auxly MCP] ✅ Verified: File exists, size:', fileSize, 'bytes');
        } else {
            console.error('[Auxly MCP] ❌ ERROR: File was not created!');
            return false;
        }
        
        console.log('========================================');
        console.log('[Auxly MCP] ✅ WINDSURF CONFIGURATION COMPLETE');
        console.log('[Auxly MCP] ✅ Using official Codeium/Windsurf config location');
        console.log('========================================');
        
        console.log('[Auxly MCP] ✅ Successfully wrote Windsurf MCP config');
        console.log('[Auxly MCP] Config file:', configPath);
        console.log('[Auxly MCP] 💡 Reload Windsurf to activate MCP tools');
        
        return true;
        
    } catch (error) {
        console.error('[Auxly MCP] Failed to configure Windsurf MCP:', error);
        return false;
    }
}

