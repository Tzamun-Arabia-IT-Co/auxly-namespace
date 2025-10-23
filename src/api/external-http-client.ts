/**
 * External HTTP Client
 * Uses child process to completely bypass Electron's network stack
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as https from 'https';
import * as http from 'http';

const execAsync = promisify(exec);

export interface ExternalHttpResponse<T = any> {
    data: T;
    status: number;
    success: boolean;
}

/**
 * Make HTTP request using PowerShell/curl in child process
 * This completely bypasses Electron's SSL restrictions
 * Falls back to native Node.js HTTPS if curl is not available
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
        console.error('❌ External HTTP error (curl failed), falling back to native HTTPS:', error);
        
        // FALLBACK: Use Node.js native HTTPS module if curl is not available
        return fallbackToNativeHttp<T>(url, headers);
    }
}

/**
 * Fallback to Node.js native HTTPS when curl is not available
 */
async function fallbackToNativeHttp<T = any>(
    url: string,
    headers?: Record<string, string>
): Promise<ExternalHttpResponse<T>> {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const options: https.RequestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            rejectUnauthorized: false, // Accept self-signed certificates
            timeout: 30000,
        };

        console.log('🔄 Using native HTTPS fallback:', url);

        const req = httpModule.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = data ? JSON.parse(data) : null;
                    const status = res.statusCode || 0;
                    
                    console.log('✅ Native HTTPS response status:', status);
                    
                    resolve({
                        data: parsedData,
                        status,
                        success: status >= 200 && status < 300,
                    });
                } catch (parseError: any) {
                    reject(new Error(`Failed to parse response: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Native HTTPS error:', error);
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

