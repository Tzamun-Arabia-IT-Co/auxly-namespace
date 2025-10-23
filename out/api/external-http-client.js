"use strict";
/**
 * External HTTP Client
 * Uses child process to completely bypass Electron's network stack
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalHttpGet = externalHttpGet;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Make HTTP request using PowerShell/curl in child process
 * This completely bypasses Electron's SSL restrictions
 */
async function externalHttpGet(url, headers) {
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
    }
    catch (error) {
        console.error('❌ External HTTP error:', error);
        throw new Error(`External HTTP request failed: ${error.message}`);
    }
}
//# sourceMappingURL=external-http-client.js.map