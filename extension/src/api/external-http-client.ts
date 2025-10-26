/**
 * External HTTP Client
 * Uses child process to completely bypass Electron's network stack
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export interface ExternalHttpResponse<T = any> {
    data: T;
    status: number;
    success: boolean;
}

/**
 * Make HTTP request using PowerShell/curl in child process
 * This completely bypasses Electron's SSL restrictions
 * 
 * CRITICAL FIX: Tries multiple curl methods with fallback:
 * 1. Try Windows (curl.exe + powershell) - if fails
 * 2. Try Linux (curl + /bin/sh) - if fails
 * 3. Try macOS (curl + /bin/bash) - if fails
 * 4. Show error to user
 * 
 * @param url - The URL to request
 * @param headers - Headers to send with the request
 * @param osOverride - Force specific OS method (windows/unix/darwin) - user-selected fallback
 */
export async function externalHttpGet<T = any>(
    url: string,
    headers?: Record<string, string>,
    osOverride?: string
): Promise<ExternalHttpResponse<T>> {
    
    // Define all available methods
    const allMethods = [
        { name: 'Windows', key: 'windows', curl: 'curl.exe', shell: 'powershell.exe' },
        { name: 'Linux/Unix', key: 'unix', curl: 'curl', shell: '/bin/sh' },
        { name: 'macOS', key: 'darwin', curl: 'curl', shell: '/bin/bash' }
    ];
    
    let methods = allMethods;
    
    // If OS override is provided, try that method first
    if (osOverride) {
        const overrideMethod = allMethods.find(m => m.key === osOverride);
        if (overrideMethod) {
            console.log(`🖥️ Using user-selected OS: ${overrideMethod.name}`);
            // Put the override method first, but still try others as fallback
            methods = [overrideMethod, ...allMethods.filter(m => m.key !== osOverride)];
        } else {
            console.warn(`⚠️ Invalid OS override: ${osOverride}, using auto-detect`);
        }
    }
    
    let lastError: Error | null = null;
    
    for (const method of methods) {
        try {
            console.log(`🔄 Trying ${method.name} curl method...`);
            return await attemptCurlRequest(url, headers, method.curl, method.shell, method.name);
        } catch (error) {
            console.warn(`⚠️ ${method.name} curl failed:`, error instanceof Error ? error.message : String(error));
            lastError = error instanceof Error ? error : new Error(String(error));
            // Continue to next method
        }
    }
    
    // All methods failed
    throw new Error(`All curl methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Attempt curl request with specific command and shell
 */
async function attemptCurlRequest<T = any>(
    url: string,
    headers: Record<string, string> | undefined,
    curlCommand: string,
    shell: string,
    methodName: string
): Promise<ExternalHttpResponse<T>> {
    try {
        
        // Build headers array for proper escaping
        const headerArgs: string[] = [];
        if (headers) {
            for (const [key, value] of Object.entries(headers)) {
                // Escape quotes in header values to prevent shell injection
                const escapedValue = value.replace(/"/g, '\\"');
                headerArgs.push(`-H`, `"${key}: ${escapedValue}"`);
            }
        }

        // Build command as array for safer execution
        const curlArgs = [
            curlCommand,
            '-s',              // Silent
            '-k',              // Insecure (skip SSL verification)
            '-w',              // Write out
            '"\\n---STATUS:%{http_code}---"',
            ...headerArgs,
            `"${url}"`
        ];

        const command = curlArgs.join(' ');

        console.log(`🌐 ${methodName} HTTP request:`, command.replace(/-H "[^"]*API-Key[^"]*"/, '-H "X-API-Key: ***"'));

        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000,
            windowsHide: true,
            shell: shell
        });

        if (stderr && stderr.trim()) {
            console.warn(`⚠️ ${methodName} stderr:`, stderr);
            // Don't throw on stderr alone - curl writes progress to stderr
        }

        // Parse response: body + status code
        const parts = stdout.split('---STATUS:');
        if (parts.length < 2) {
            throw new Error('Invalid response format from curl');
        }

        const body = parts[0].trim();
        const statusMatch = parts[1]?.match(/(\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

        console.log(`✅ ${methodName} HTTP response status:`, status);

        // Parse JSON body
        const data = body ? JSON.parse(body) : null;

        return {
            data,
            status,
            success: status >= 200 && status < 300,
        };
    } catch (error: any) {
        console.error(`❌ ${methodName} HTTP error:`, error);
        throw new Error(`${methodName} HTTP request failed: ${error.message}`);
    }
}

