import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * WMIC Shim Manager for Auxly
 * Automatically creates a PowerShell-based WMIC replacement on Windows 11
 * where the native wmic.exe is missing.
 * 
 * Based on: auxly-auto-wmic.md documentation
 * 
 * Key Features:
 * - Auto-detects if WMIC is available
 * - Creates lightweight shim in extension storage (no admin needed)
 * - Transparent fallback using PowerShell Get-CimInstance
 * - Works in Restricted Mode (only writes to globalStorageUri)
 */
export class WmicShimManager {
    private static instance: WmicShimManager;
    private shimDirectory: string | null = null;
    private shimActive: boolean = false;

    private constructor() {}

    public static getInstance(): WmicShimManager {
        if (!WmicShimManager.instance) {
            WmicShimManager.instance = new WmicShimManager();
        }
        return WmicShimManager.instance;
    }

    /**
     * Ensure WMIC is available (either native or via shim)
     * @param context VS Code extension context
     * @returns Path to shim directory if shim was created, undefined otherwise
     */
    public async ensureWmicAvailable(context: vscode.ExtensionContext): Promise<string | undefined> {
        // Only needed on Windows
        if (process.platform !== 'win32') {
            console.log('[WMIC Shim] Not on Windows - skipping');
            return undefined;
        }

        // Check if native WMIC exists
        const hasNativeWmic = await this.commandExists('wmic');
        if (hasNativeWmic) {
            console.log('[WMIC Shim] Native WMIC found - no shim needed');
            return undefined;
        }

        console.log('[WMIC Shim] Native WMIC not found - creating shim...');

        // Create shim in extension's global storage
        const shimDir = path.join(context.globalStorageUri.fsPath, 'wmic-shim');
        
        try {
            await fs.mkdir(shimDir, { recursive: true });
            
            // PowerShell script that mimics: wmic process get ProcessId,ParentProcessId,CommandLine /format:csv
            const ps1Script = `[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
$n=$env:COMPUTERNAME
'Node,CommandLine,ParentProcessId,ProcessId'
Get-CimInstance Win32_Process | ForEach-Object {
  $cl=($_.CommandLine -replace '"','""')
  "$n," + '"' + $cl + '",' + $_.ParentProcessId + ',' + $_.ProcessId
}`;

            // Wrapper batch files that call the PowerShell script
            const wrapperScript = '@echo off\npowershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0wmic.ps1" %*';

            // Write shim files
            await fs.writeFile(path.join(shimDir, 'wmic.ps1'), ps1Script, 'utf8');
            await fs.writeFile(path.join(shimDir, 'wmic.cmd'), wrapperScript, 'utf8');
            await fs.writeFile(path.join(shimDir, 'wmic.bat'), wrapperScript, 'utf8');

            this.shimDirectory = shimDir;
            this.shimActive = true;

            console.log(`[WMIC Shim] ✅ Shim created successfully at: ${shimDir}`);
            console.log('[WMIC Shim] Files created: wmic.ps1, wmic.cmd, wmic.bat');

            return shimDir;
        } catch (error) {
            console.error('[WMIC Shim] ❌ Failed to create shim:', error);
            return undefined;
        }
    }

    /**
     * Check if a command exists in PATH
     * @param cmd Command name to check
     * @returns True if command exists, false otherwise
     */
    private async commandExists(cmd: string): Promise<boolean> {
        return new Promise(resolve => {
            const whereExe = process.env.SystemRoot
                ? path.join(process.env.SystemRoot, 'System32', 'where.exe')
                : 'where';
            
            exec(`"${whereExe}" ${cmd}`, { windowsHide: true }, err => {
                resolve(!err);
            });
        });
    }

    /**
     * Get process list in CSV format
     * Uses shim if available, falls back to PowerShell
     * @param shimDir Optional shim directory to prepend to PATH
     * @returns CSV formatted process list
     */
    public async getProcessListCSV(shimDir?: string): Promise<string> {
        // Build environment with shim directory in PATH if provided
        const env = { ...process.env };
        if (shimDir) {
            env.PATH = `${shimDir};${env.PATH ?? ''}`;
        }

        // Try using wmic command (either native or shim)
        const wmicCmd = 'wmic process get ProcessId,ParentProcessId,CommandLine /format:csv';
        try {
            const csv = await this.execAsync(wmicCmd, { env, windowsHide: true });
            if (csv.trim()) {
                console.log('[WMIC Shim] ✅ Process list retrieved via WMIC');
                return csv;
            }
        } catch (error) {
            console.log('[WMIC Shim] WMIC command failed, falling back to PowerShell');
        }

        // Fallback: Direct PowerShell execution
        const ps = `[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;$n=$env:COMPUTERNAME;'Node,CommandLine,ParentProcessId,ProcessId';Get-CimInstance Win32_Process|%{ $cl=($_.CommandLine -replace '"','""'); "$n," + '"' + $cl + '",' + $_.ParentProcessId + ',' + $_.ProcessId }`;
        const powershellCmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command ' + JSON.stringify(ps);
        
        try {
            const csv = await this.execAsync(powershellCmd, { windowsHide: true });
            console.log('[WMIC Shim] ✅ Process list retrieved via PowerShell fallback');
            return csv;
        } catch (error) {
            console.error('[WMIC Shim] ❌ Both WMIC and PowerShell fallback failed:', error);
            throw new Error('Failed to retrieve process list');
        }
    }

    /**
     * Execute command and return stdout as string
     * @param cmd Command to execute
     * @param opts Execution options
     * @returns Command stdout
     */
    private execAsync(cmd: string, opts: any): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(cmd, opts, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    // Convert Buffer to string if needed
                    const output = typeof stdout === 'string' ? stdout : stdout.toString();
                    resolve(output);
                }
            });
        });
    }

    /**
     * Get the shim directory path (if shim was created)
     * @returns Shim directory path or null
     */
    public getShimDirectory(): string | null {
        return this.shimDirectory;
    }

    /**
     * Check if shim is active
     * @returns True if shim was created and is active
     */
    public isShimActive(): boolean {
        return this.shimActive;
    }
}
