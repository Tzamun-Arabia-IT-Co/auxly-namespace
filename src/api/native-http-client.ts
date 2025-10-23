/**
 * Native HTTP Client
 * Uses Node.js native https module instead of Axios to bypass Electron SSL issues
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export interface NativeHttpOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

export interface NativeHttpResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
}

/**
 * Make HTTP request using Node.js native modules
 * This bypasses Electron/Chromium's SSL restrictions
 */
export function nativeHttpRequest<T = any>(
    url: string,
    options: NativeHttpOptions = {}
): Promise<NativeHttpResponse<T>> {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const requestOptions: https.RequestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            // Critical: Disable SSL verification to accept Let's Encrypt certificate
            rejectUnauthorized: false,
            // TLS options
            minVersion: 'TLSv1.2',
            maxVersion: 'TLSv1.3',
        };

        // Add Content-Length if body exists
        if (options.body) {
            const bodyString = typeof options.body === 'string' 
                ? options.body 
                : JSON.stringify(options.body);
            (requestOptions.headers as any)['Content-Length'] = Buffer.byteLength(bodyString);
        }

        const req = httpModule.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = data ? JSON.parse(data) : null;
                    resolve({
                        data: parsedData,
                        status: res.statusCode || 0,
                        statusText: res.statusMessage || '',
                        headers: res.headers as Record<string, string | string[]>,
                    });
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error}`));
                }
            });
        });

        // Set timeout
        if (options.timeout) {
            req.setTimeout(options.timeout, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        }

        // Handle errors
        req.on('error', (error) => {
            reject(error);
        });

        // Write body if exists
        if (options.body) {
            const bodyString = typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body);
            req.write(bodyString);
        }

        req.end();
    });
}

/**
 * GET request
 */
export function get<T = any>(url: string, headers?: Record<string, string>): Promise<NativeHttpResponse<T>> {
    return nativeHttpRequest<T>(url, { method: 'GET', headers });
}

/**
 * POST request
 */
export function post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<NativeHttpResponse<T>> {
    return nativeHttpRequest<T>(url, { method: 'POST', body, headers });
}

/**
 * PUT request
 */
export function put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<NativeHttpResponse<T>> {
    return nativeHttpRequest<T>(url, { method: 'PUT', body, headers });
}

/**
 * DELETE request
 */
export function del<T = any>(url: string, headers?: Record<string, string>): Promise<NativeHttpResponse<T>> {
    return nativeHttpRequest<T>(url, { method: 'DELETE', headers });
}

