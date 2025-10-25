import * as vscode from 'vscode';

/**
 * Supported AI code editors with MCP integration
 */
export type SupportedEditor = 'cursor' | 'windsurf' | 'pearai' | 'trae' | 'unknown';

/**
 * Detect which AI code editor is currently running
 * 
 * @returns The detected editor type
 * 
 * Detection Methods:
 * - Cursor: Check for vscode.cursor API
 * - Windsurf: Check version string or env var
 * - PearAI: Check version string or env var
 * - Trae: Check version string or env var
 * - Unknown: Fallback for unrecognized editors
 */
export function detectEditor(): SupportedEditor {
    try {
        console.log('[Auxly Editor Detection] Starting editor detection...');
        console.log('[Auxly Editor Detection] VSCode version:', vscode.version);
        console.log('[Auxly Editor Detection] Process argv0:', process.argv0);
        console.log('[Auxly Editor Detection] Process execPath:', process.execPath);
        
        // Method 1: Check process executable name (most reliable for Windsurf)
        const execPath = process.execPath.toLowerCase();
        
        if (execPath.includes('windsurf')) {
            console.log('[Auxly Editor Detection] ✅ Detected: Windsurf (via execPath)');
            return 'windsurf';
        }
        
        if (execPath.includes('pearai')) {
            console.log('[Auxly Editor Detection] ✅ Detected: PearAI (via execPath)');
            return 'pearai';
        }
        
        if (execPath.includes('trae')) {
            console.log('[Auxly Editor Detection] ✅ Detected: Trae (via execPath)');
            return 'trae';
        }
        
        if (execPath.includes('cursor')) {
            console.log('[Auxly Editor Detection] ✅ Detected: Cursor (via execPath)');
            return 'cursor';
        }
        
        // Method 2: Check for Cursor-specific API (most reliable for Cursor)
        if ((vscode as any).cursor) {
            console.log('[Auxly Editor Detection] ✅ Detected: Cursor (via cursor API)');
            return 'cursor';
        }
        
        // Method 3: Check version string for editor identifiers
        const vscodeVersion = vscode.version.toLowerCase();
        
        // Check for Windsurf/Codeium
        if (vscodeVersion.includes('codeium') || vscodeVersion.includes('windsurf')) {
            console.log('[Auxly Editor Detection] ✅ Detected: Windsurf (via version string)');
            return 'windsurf';
        }
        
        // Check for PearAI
        if (vscodeVersion.includes('pearai')) {
            console.log('[Auxly Editor Detection] ✅ Detected: PearAI (via version string)');
            return 'pearai';
        }
        
        // Check for Trae
        if (vscodeVersion.includes('trae')) {
            console.log('[Auxly Editor Detection] ✅ Detected: Trae (via version string)');
            return 'trae';
        }
        
        // Method 4: Check environment variables (fallback)
        if (process.env.WINDSURF_IDE || process.env.CODEIUM_IDE) {
            console.log('[Auxly Editor Detection] ✅ Detected: Windsurf (via env var)');
            return 'windsurf';
        }
        
        if (process.env.PEARAI_IDE) {
            console.log('[Auxly Editor Detection] ✅ Detected: PearAI (via env var)');
            return 'pearai';
        }
        
        if (process.env.TRAE_IDE) {
            console.log('[Auxly Editor Detection] ✅ Detected: Trae (via env var)');
            return 'trae';
        }
        
        // No match found
        console.log('[Auxly Editor Detection] ⚠️ Unknown editor detected');
        console.log('[Auxly Editor Detection] Version string:', vscode.version);
        console.log('[Auxly Editor Detection] Relevant env vars:', {
            WINDSURF_IDE: process.env.WINDSURF_IDE,
            CODEIUM_IDE: process.env.CODEIUM_IDE,
            PEARAI_IDE: process.env.PEARAI_IDE,
            TRAE_IDE: process.env.TRAE_IDE
        });
        
        return 'unknown';
        
    } catch (error) {
        console.error('[Auxly Editor Detection] Error during detection:', error);
        return 'unknown';
    }
}

/**
 * Get human-readable name for detected editor
 * 
 * @param editor The editor type
 * @returns Human-readable editor name
 */
export function getEditorDisplayName(editor: SupportedEditor): string {
    switch (editor) {
        case 'cursor':
            return 'Cursor';
        case 'windsurf':
            return 'Windsurf (Codeium)';
        case 'pearai':
            return 'PearAI';
        case 'trae':
            return 'Trae';
        case 'unknown':
            return 'Unknown Editor';
        default:
            return 'Unknown Editor';
    }
}

/**
 * Check if editor supports MCP
 * 
 * @param editor The editor type
 * @returns True if editor supports MCP
 */
export function editorSupportsMCP(editor: SupportedEditor): boolean {
    // All known editors support MCP
    return editor !== 'unknown';
}

