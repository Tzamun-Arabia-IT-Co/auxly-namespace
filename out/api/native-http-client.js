"use strict";
/**
 * Native HTTP Client
 * Uses Node.js native https module instead of Axios to bypass Electron SSL issues
 */
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
exports.nativeHttpRequest = nativeHttpRequest;
exports.get = get;
exports.post = post;
exports.put = put;
exports.del = del;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
/**
 * Make HTTP request using Node.js native modules
 * This bypasses Electron/Chromium's SSL restrictions
 */
function nativeHttpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new url_1.URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        const requestOptions = {
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
            requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
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
                        headers: res.headers,
                    });
                }
                catch (error) {
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
function get(url, headers) {
    return nativeHttpRequest(url, { method: 'GET', headers });
}
/**
 * POST request
 */
function post(url, body, headers) {
    return nativeHttpRequest(url, { method: 'POST', body, headers });
}
/**
 * PUT request
 */
function put(url, body, headers) {
    return nativeHttpRequest(url, { method: 'PUT', body, headers });
}
/**
 * DELETE request
 */
function del(url, headers) {
    return nativeHttpRequest(url, { method: 'DELETE', headers });
}
//# sourceMappingURL=native-http-client.js.map