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
exports.WmicShimManager = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
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
class WmicShimManager {
    constructor() {
        this.shimDirectory = null;
        this.shimActive = false;
    }
    static getInstance() {
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
    async ensureWmicAvailable(context) {
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
        }
        catch (error) {
            console.error('[WMIC Shim] ❌ Failed to create shim:', error);
            return undefined;
        }
    }
    /**
     * Check if a command exists in PATH
     * @param cmd Command name to check
     * @returns True if command exists, false otherwise
     */
    async commandExists(cmd) {
        return new Promise(resolve => {
            const whereExe = process.env.SystemRoot
                ? path.join(process.env.SystemRoot, 'System32', 'where.exe')
                : 'where';
            (0, child_process_1.exec)(`"${whereExe}" ${cmd}`, { windowsHide: true }, err => {
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
    async getProcessListCSV(shimDir) {
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
        }
        catch (error) {
            console.log('[WMIC Shim] WMIC command failed, falling back to PowerShell');
        }
        // Fallback: Direct PowerShell execution
        const ps = `[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;$n=$env:COMPUTERNAME;'Node,CommandLine,ParentProcessId,ProcessId';Get-CimInstance Win32_Process|%{ $cl=($_.CommandLine -replace '"','""'); "$n," + '"' + $cl + '",' + $_.ParentProcessId + ',' + $_.ProcessId }`;
        const powershellCmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command ' + JSON.stringify(ps);
        try {
            const csv = await this.execAsync(powershellCmd, { windowsHide: true });
            console.log('[WMIC Shim] ✅ Process list retrieved via PowerShell fallback');
            return csv;
        }
        catch (error) {
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
    execAsync(cmd, opts) {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(cmd, opts, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                else {
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
    getShimDirectory() {
        return this.shimDirectory;
    }
    /**
     * Check if shim is active
     * @returns True if shim was created and is active
     */
    isShimActive() {
        return this.shimActive;
    }
}
exports.WmicShimManager = WmicShimManager;
//# sourceMappingURL=wmic-shim-manager.js.map