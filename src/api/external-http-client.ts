/**
 * External HTTP Client
 * Uses child process to completely bypass Electron's network stack
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExternalHttpResponse<T = any> {
    data: T;
    status: number;
    success: boolean;
}

/**
 * Make HTTP request using PowerShell/curl in child process
 * This completely bypasses Electron's SSL restrictions
 */
export async function externalHttpGet<T = any>(
    url: string,
    headers?: Record<string, string>
): Promise<ExternalHttpResponse<T>> {
    try {
        // Build headers string for curl
        const headerArgs = headers 
            ? Object.entries(headers).map(([key, value]) => `-H "${key}: ${value}"`).join(' ')
            : '';

        // Use curl.exe (available on Windows 10+) with -k to bypass SSL verification
        const command = `curl.exe -s -k -w "\\n---STATUS:%{http_code}---" ${headerArgs} "${url}"`;

        console.log('🌐 External HTTP request:', command.replace(/-H "[^"]*API-Key[^"]*"/, '-H "X-API-Key: ***"'));

        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000,
            windowsHide: true,
        });

        if (stderr) {
            console.error('External HTTP stderr:', stderr);
        }

        // Parse response: body + status code
        const parts = stdout.split('---STATUS:');
        const body = parts[0].trim();
        const statusMatch = parts[1]?.match(/(\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

        console.log('✅ External HTTP response status:', status);

        // Parse JSON body
        const data = body ? JSON.parse(body) : null;

        return {
            data,
            status,
            success: status >= 200 && status < 300,
        };
    } catch (error: any) {
        console.error('❌ External HTTP error:', error);
        throw new Error(`External HTTP request failed: ${error.message}`);
    }
}

