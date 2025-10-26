import * as vscode from 'vscode';
import { detectEditor, getEditorDisplayName } from '../utils/editor-detector';
import { registerMCPServerWithCursorAPI, unregisterMCPServer } from './mcp-cursor-api';
import { configureWindsurfMCP } from './mcp-windsurf-config';
import { WindsurfMCPHealthMonitor } from './windsurf-mcp-health-monitor';
import { configurePearAIMCP } from './mcp-pearai-config';
import { configureTraeMCP } from './mcp-trae-config';

/**
 * Main entry point for multi-editor MCP setup
 * Automatically detects the editor and configures MCP appropriately
 * 
 * @param context VS Code extension context
 */
export async function setupMCP(context: vscode.ExtensionContext): Promise<void> {
    try {
        const editor = detectEditor();
        const editorName = getEditorDisplayName(editor);
        
        console.log(`[Auxly MCP] Setting up MCP for ${editorName}...`);
        
        // Check if MCP is already configured for this editor to prevent reload loops
        // Use same key as extension.ts for consistency
        const mcpConfiguredKey = `mcp.configured.${editor}`;
        const alreadyConfigured = context.globalState.get<boolean>(mcpConfiguredKey, false);
        
        // For Cursor, always try to register (it's idempotent and doesn't need reload)
        // For other editors, skip if already configured to prevent reload loops
        if (alreadyConfigured && editor !== 'cursor') {
            console.log(`[Auxly MCP] MCP already configured for ${editorName}, skipping...`);
            return;
        }
        
        let success = false;
        let needsReload = false;
        
        switch (editor) {
            case 'cursor':
                // Cursor uses programmatic API (no reload needed, always safe to call)
                success = await registerMCPServerWithCursorAPI(context);
                needsReload = false;
                // Mark as configured for Cursor too
                if (success) {
                    await context.globalState.update(mcpConfiguredKey, true);
                }
                break;
                
            case 'windsurf':
                // Windsurf uses config file (reload needed)
                success = await configureWindsurfMCP(context);
                needsReload = true;
                break;
                
            case 'pearai':
                // PearAI uses config file (reload needed)
                success = await configurePearAIMCP(context);
                needsReload = true;
                break;
                
            case 'trae':
                // Trae uses config file (reload needed)
                success = await configureTraeMCP(context);
                needsReload = true;
                break;
                
            case 'unknown':
                // Unknown editor - inform user
                console.warn('[Auxly MCP] Unknown editor detected, MCP not configured');
                vscode.window.showInformationMessage(
                    '⚠️ Auxly: Editor not recognized. MCP features may not be available. ' +
                    'Supported editors: Cursor, Windsurf, PearAI, Trae',
                    'OK'
                );
                return;
                
            default:
                console.error('[Auxly MCP] Unexpected editor type:', editor);
                return;
        }
        
        if (success) {
            console.log(`[Auxly MCP] ✅ MCP configured successfully for ${editorName}`);
            
            // Mark as configured to prevent reload loops
            await context.globalState.update(mcpConfiguredKey, true);
            
            if (needsReload) {
                // Show reload prompt for config-file based editors
                const action = await vscode.window.showInformationMessage(
                    `✅ Auxly MCP configured for ${editorName}! Reload window to activate AI agent tools.`,
                    'Reload Now',
                    'Later'
                );
                
                if (action === 'Reload Now') {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            } else {
                // For Cursor, just show success message (no reload needed)
                vscode.window.showInformationMessage(
                    `✅ Auxly MCP configured successfully for ${editorName}!`
                );
            }
        } else {
            // Configuration failed
            console.error(`[Auxly MCP] ❌ Failed to configure MCP for ${editorName}`);
            vscode.window.showErrorMessage(
                `❌ Auxly: Failed to configure MCP for ${editorName}. ` +
                'Please check the Output panel (Auxly) for details.',
                'Open Output'
            ).then(action => {
                if (action === 'Open Output') {
                    vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                }
            });
        }
        
    } catch (error) {
        console.error('[Auxly MCP] Unexpected error during MCP setup:', error);
        vscode.window.showErrorMessage(
            '❌ Auxly: Unexpected error during MCP setup. Please check the Output panel for details.'
        );
    }
}

/**
 * Manually restart Windsurf MCP server (for command/testing)
 */
export async function restartWindsurfMCP(): Promise<boolean> {
    const editor = detectEditor();
    if (editor !== 'windsurf') {
        console.log('[Auxly MCP] Not running in Windsurf, restart not applicable');
        return false;
    }
    
    console.log('[Auxly MCP] 🔄 Manual Windsurf MCP restart requested');
    const monitor = WindsurfMCPHealthMonitor.getInstance();
    return await monitor.manualRestart();
}

// Export for backward compatibility and direct use
export { registerMCPServerWithCursorAPI, unregisterMCPServer } from './mcp-cursor-api';
export { WindsurfMCPHealthMonitor } from './windsurf-mcp-health-monitor';

