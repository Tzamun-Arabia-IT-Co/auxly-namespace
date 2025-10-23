"use strict";
/**
 * API Client
 * Singleton HTTP client for Auxly backend communication
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
exports.initializeApiClient = initializeApiClient;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const https = __importStar(require("https"));
const endpoints_1 = require("./endpoints");
const externalHttp = __importStar(require("./external-http-client"));
/**
 * Secure storage keys for VSCode secrets
 */
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'auxly.accessToken',
    REFRESH_TOKEN: 'auxly.refreshToken',
    TOKEN_EXPIRES_AT: 'auxly.tokenExpiresAt',
    API_KEY: 'auxly.apiKey',
};
/**
 * API Client Singleton
 * Handles all HTTP communication with the Auxly backend
 */
class ApiClient {
    constructor(config) {
        this.context = null;
        this.isRefreshing = false;
        this.refreshPromise = null;
        // Disable Node.js SSL verification globally for this extension
        // This is required for VS Code extensions to accept Let's Encrypt certificates
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        // Get user configuration for SSL handling
        const vsConfig = vscode.workspace.getConfiguration('auxly');
        // Default to true to allow Let's Encrypt certificate
        const allowInsecureSSL = vsConfig.get('allowInsecureSSL', true);
        // Create HTTPS agent with SSL/TLS configuration
        // This helps handle self-signed certificates and SSL errors
        const httpsAgent = new https.Agent({
            // Disable strict SSL verification to allow Let's Encrypt certificate
            // Users can override this in settings if needed
            rejectUnauthorized: false,
            // Keep connections alive for better performance
            keepAlive: true,
            // Set minimum TLS version
            minVersion: 'TLSv1.2',
            // Maximum TLS version
            maxVersion: 'TLSv1.3',
        });
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || endpoints_1.API_CONFIG.DEFAULT_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
            // Add HTTPS agent for SSL/TLS handling
            httpsAgent: httpsAgent,
            // Explicitly handle both HTTP and HTTPS
            httpAgent: undefined,
        });
        this.setupInterceptors();
    }
    /**
     * Initialize or get singleton instance
     */
    static getInstance(config) {
        if (!ApiClient.instance && config) {
            ApiClient.instance = new ApiClient(config);
        }
        if (!ApiClient.instance) {
            throw new Error('ApiClient must be initialized with config first');
        }
        return ApiClient.instance;
    }
    /**
     * Set ExtensionContext for secure token storage
     */
    setContext(context) {
        this.context = context;
    }
    /**
     * Generate device fingerprint for device tracking
     */
    getDeviceFingerprint() {
        // Try to get MAC address first (most stable identifier)
        try {
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();
            // Find first non-internal network interface with MAC address
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                if (interfaces) {
                    for (const iface of interfaces) {
                        // Skip internal/loopback interfaces and those without MAC
                        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                            console.log(`✅ Using MAC address as device fingerprint: ${iface.mac}`);
                            return `mac-${iface.mac}`;
                        }
                    }
                }
            }
        }
        catch (error) {
            console.warn('⚠️ Failed to get MAC address:', error);
        }
        // Fallback to machine ID (stable across sessions)
        if (this.context) {
            const machineId = vscode.env.machineId;
            console.log('⚠️ Using machineId as fallback device fingerprint');
            return `vscode-${machineId}`;
        }
        return 'vscode-unknown-device';
    }
    /**
     * Get device name (computer hostname)
     */
    getDeviceName() {
        try {
            const hostname = os.hostname();
            return `${hostname} - VS Code Extension`;
        }
        catch {
            return 'VS Code Extension';
        }
    }
    /**
     * Get OS information
     */
    getOsInfo() {
        try {
            const platform = os.platform(); // 'win32', 'darwin', 'linux'
            const release = os.release();
            let osName = 'Unknown OS';
            switch (platform) {
                case 'win32':
                    osName = 'Windows';
                    break;
                case 'darwin':
                    osName = 'macOS';
                    break;
                case 'linux':
                    osName = 'Linux';
                    break;
            }
            return `${osName} ${release}`;
        }
        catch {
            return 'Unknown OS';
        }
    }
    /**
     * Setup Axios interceptors for authentication and error handling
     */
    setupInterceptors() {
        // Request interceptor: Add auth (API key or JWT token) to requests
        this.axiosInstance.interceptors.request.use(async (config) => {
            try {
                // 🔧 CRITICAL FIX: Don't overwrite API key if already set by the caller
                // This allows verifyApiKey() to test a new key before storing it
                const hasExistingApiKey = config.headers && config.headers['X-API-Key'];
                if (!hasExistingApiKey) {
                    // Only get cached API key if caller didn't provide one
                    const apiKey = await this.getApiKey();
                    if (apiKey && config.headers) {
                        config.headers['X-API-Key'] = apiKey;
                        // Add device tracking headers
                        config.headers['x-device-fingerprint'] = this.getDeviceFingerprint();
                        config.headers['x-device-name'] = this.getDeviceName();
                        config.headers['x-os-info'] = this.getOsInfo();
                        // No browser info for VS Code extension (set to extension name)
                        config.headers['x-browser-info'] = 'VS Code Extension';
                    }
                    else {
                        // Fallback to JWT token
                        const token = await this.getAccessToken();
                        if (token && config.headers) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    }
                }
                else {
                    // API key already set by caller - still add device tracking headers
                    if (config.headers) {
                        config.headers['x-device-fingerprint'] = this.getDeviceFingerprint();
                        config.headers['x-device-name'] = this.getDeviceName();
                        config.headers['x-os-info'] = this.getOsInfo();
                        config.headers['x-browser-info'] = 'VS Code Extension';
                    }
                }
            }
            catch (error) {
                console.error('Failed to get auth credentials:', error);
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor: Handle errors and token refresh
        this.axiosInstance.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            // Handle 401 Unauthorized - token expired
            if (error.response?.status === endpoints_1.HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    // Try to refresh the token
                    const newToken = await this.refreshAccessToken();
                    if (newToken && originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return this.axiosInstance(originalRequest);
                    }
                }
                catch (refreshError) {
                    // Refresh failed - user needs to log in again
                    await this.clearTokens();
                    vscode.window.showWarningMessage('Session expired. Please log in again.');
                    return Promise.reject(refreshError);
                }
            }
            // Handle retryable errors (5xx, network errors)
            if (this.shouldRetry(error) && !originalRequest._retry) {
                return this.retryRequest(originalRequest, error);
            }
            return Promise.reject(this.handleError(error));
        });
    }
    /**
     * Determine if request should be retried
     */
    shouldRetry(error) {
        // Don't retry if no response (network error)
        if (!error.response) {
            return true;
        }
        const status = error.response.status;
        // Retry on 5xx server errors
        if (status >= 500 && status < 600) {
            return true;
        }
        // Retry on specific errors
        if (status === endpoints_1.HTTP_STATUS.TOO_MANY_REQUESTS) {
            return true;
        }
        return false;
    }
    /**
     * Retry request with exponential backoff
     */
    async retryRequest(config, error) {
        config._retry = true;
        config._retryCount = (config._retryCount || 0) + 1;
        // Max retry attempts
        if (config._retryCount > endpoints_1.API_CONFIG.DEFAULT_RETRY_ATTEMPTS) {
            return Promise.reject(error);
        }
        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = endpoints_1.API_CONFIG.DEFAULT_RETRY_DELAY * Math.pow(2, config._retryCount - 1);
        console.log(`Retrying request (attempt ${config._retryCount}/${endpoints_1.API_CONFIG.DEFAULT_RETRY_ATTEMPTS}) after ${delay}ms`);
        await this.sleep(delay);
        return this.axiosInstance(config);
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Handle and transform errors into user-friendly messages
     */
    handleError(error) {
        // Network error (includes SSL/TLS errors)
        if (!error.response) {
            // Check for SSL/TLS specific errors
            const errorMessage = error.message || '';
            const errorCode = error.code || '';
            // SSL Certificate errors
            if (errorCode === 'CERT_HAS_EXPIRED' || errorMessage.includes('certificate has expired')) {
                return {
                    message: 'SSL certificate has expired. Please contact support or update your certificates.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            if (errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || errorMessage.includes('unable to verify')) {
                return {
                    message: 'Unable to verify SSL certificate. The server may be using a self-signed certificate. Please check your connection settings.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // SSL Protocol errors (EPROTO)
            if (errorCode === 'EPROTO' || errorMessage.includes('EPROTO') || errorMessage.includes('wrong version number')) {
                return {
                    message: 'SSL/TLS connection error. The server may not be properly configured for HTTPS. Please contact support or check the server configuration.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Self-signed certificate
            if (errorCode === 'DEPTH_ZERO_SELF_SIGNED_CERT' || errorMessage.includes('self signed certificate')) {
                return {
                    message: 'The server is using a self-signed SSL certificate. For security reasons, this connection was blocked. Please use a valid SSL certificate.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Generic connection error
            if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
                return {
                    message: 'Unable to connect to Auxly server. The server may be offline or unreachable.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Timeout
            if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
                return {
                    message: 'Connection timed out. Please check your internet connection and try again.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Generic network error
            return {
                message: 'Unable to connect to Auxly server. Please check your internet connection and firewall settings.',
                statusCode: 0,
                details: `${errorCode || 'NETWORK_ERROR'}: ${error.message}`,
            };
        }
        const status = error.response.status;
        const data = error.response.data;
        // Use server-provided error message if available
        const serverMessage = data?.message || data?.error;
        // Map status codes to user-friendly messages
        const statusMessages = {
            [endpoints_1.HTTP_STATUS.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
            [endpoints_1.HTTP_STATUS.UNAUTHORIZED]: 'Session expired. Please log in again.',
            [endpoints_1.HTTP_STATUS.FORBIDDEN]: 'You don\'t have permission to perform this action.',
            [endpoints_1.HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found.',
            [endpoints_1.HTTP_STATUS.CONFLICT]: 'A conflict occurred. The resource may already exist.',
            [endpoints_1.HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',
            [endpoints_1.HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Auxly server encountered an error. Please try again later.',
            [endpoints_1.HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Auxly server is temporarily unavailable. Please try again later.',
            [endpoints_1.HTTP_STATUS.GATEWAY_TIMEOUT]: 'Request timed out. Please try again.',
        };
        return {
            message: serverMessage || statusMessages[status] || 'An unexpected error occurred.',
            statusCode: status,
            details: error.response.data,
        };
    }
    // ========================================
    // Token Management
    // ========================================
    /**
     * Get access token from secure storage
     */
    async getAccessToken() {
        if (!this.context) {
            return null;
        }
        return await this.context.secrets.get(STORAGE_KEYS.ACCESS_TOKEN) || null;
    }
    /**
     * Get refresh token from secure storage
     */
    async getRefreshToken() {
        if (!this.context) {
            return null;
        }
        return await this.context.secrets.get(STORAGE_KEYS.REFRESH_TOKEN) || null;
    }
    /**
     * Store authentication tokens securely
     */
    async storeTokens(tokenData) {
        if (!this.context) {
            throw new Error('ExtensionContext not set. Cannot store tokens.');
        }
        const expiresAt = Date.now() + (tokenData.expiresIn * 1000);
        await Promise.all([
            this.context.secrets.store(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken),
            this.context.secrets.store(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken),
            this.context.secrets.store(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString()),
        ]);
    }
    /**
     * Clear all stored tokens
     */
    async clearTokens() {
        if (!this.context) {
            return;
        }
        await Promise.all([
            this.context.secrets.delete(STORAGE_KEYS.ACCESS_TOKEN),
            this.context.secrets.delete(STORAGE_KEYS.REFRESH_TOKEN),
            this.context.secrets.delete(STORAGE_KEYS.TOKEN_EXPIRES_AT),
        ]);
    }
    /**
     * Check if user is authenticated (via API key or JWT token)
     */
    async isAuthenticated() {
        const apiKey = await this.getApiKey();
        if (apiKey) {
            return true;
        }
        const token = await this.getAccessToken();
        return !!token;
    }
    // ========================================
    // API Key Management
    // ========================================
    /**
     * Get API key from local config (.auxly/config.json)
     * Note: LocalConfigService should be initialized by extension first
     */
    async getApiKey() {
        try {
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(require('../config/local-config')));
            const configService = LocalConfigService.getInstance();
            return await configService.getApiKey();
        }
        catch (error) {
            console.error('Error getting API key from config:', error);
            return null;
        }
    }
    /**
     * Store API key in local config (.auxly/config.json)
     */
    async storeApiKey(apiKey) {
        try {
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(require('../config/local-config')));
            const configService = LocalConfigService.getInstance();
            await configService.setApiKey(apiKey);
        }
        catch (error) {
            console.error('Error storing API key:', error);
            throw error;
        }
    }
    /**
     * Clear stored API key from local config
     */
    async clearApiKey() {
        try {
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(require('../config/local-config')));
            const configService = LocalConfigService.getInstance();
            await configService.clearApiKey();
        }
        catch (error) {
            console.error('Error clearing API key:', error);
        }
    }
    /**
     * Verify API key with backend
     */
    async verifyApiKey(apiKey) {
        try {
            // If no API key provided, try to get from storage
            const keyToVerify = apiKey || await this.getApiKey();
            if (!keyToVerify) {
                return { valid: false, error: 'No API key provided' };
            }
            // Use external HTTP client (child process) to completely bypass Electron
            const config = vscode.workspace.getConfiguration('auxly');
            const apiUrl = config.get('apiUrl') || 'https://auxly.tzamun.com:8000';
            const fullUrl = `${apiUrl}${endpoints_1.API_ENDPOINTS.API_KEYS.VERIFY}`;
            console.log('🔒 Verifying API key with external HTTP client (child process):', fullUrl);
            // Include device tracking headers for 2-device limit enforcement
            const response = await externalHttp.externalHttpGet(fullUrl, {
                'X-API-Key': keyToVerify,
                'Content-Type': 'application/json',
                'x-device-fingerprint': this.getDeviceFingerprint(),
                'x-device-name': this.getDeviceName(),
                'x-os-info': this.getOsInfo(),
                'x-browser-info': 'VS Code Extension'
            });
            console.log('✅ External HTTP response:', response.status);
            if (response.success && response.data && response.data.user) {
                return { valid: true, user: response.data.user };
            }
            return { valid: false, error: response.data?.error || 'Invalid response from server' };
        }
        catch (error) {
            console.error('❌ API key verification failed:', error);
            return {
                valid: false,
                error: error.message || 'API key verification failed'
            };
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }
        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();
        try {
            const token = await this.refreshPromise;
            return token;
        }
        finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }
    /**
     * Perform the actual token refresh
     */
    async performTokenRefresh() {
        try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            const response = await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, {
                // Don't add auth header for refresh request
                headers: { Authorization: '' },
            });
            if (response.data.success && response.data.data) {
                await this.storeTokens(response.data.data);
                return response.data.data.accessToken;
            }
            return null;
        }
        catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }
    // ========================================
    // Authentication API
    // ========================================
    /**
     * Login with email and password
     */
    async login(credentials) {
        try {
            const response = await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.AUTH.LOGIN, credentials);
            if (response.data.success && response.data.data) {
                await this.storeTokens(response.data.data);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Login failed');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Logout and clear tokens
     */
    async logout() {
        try {
            await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.AUTH.LOGOUT);
        }
        catch (error) {
            // Continue even if logout API call fails
            console.error('Logout API call failed:', error);
        }
        finally {
            await this.clearTokens();
        }
    }
    /**
     * Get current user information
     */
    async getCurrentUser() {
        try {
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.AUTH.ME);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to get user information');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    // ========================================
    // Task API
    // ========================================
    /**
     * Get all tasks
     */
    async getTasks() {
        try {
            console.log('🌐 API Client: Fetching tasks from', endpoints_1.API_ENDPOINTS.TASKS.LIST);
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.TASKS.LIST);
            console.log('✅ API Client: Received response', response.data);
            // Backend returns direct array of tasks, not wrapped in ApiResponse
            if (Array.isArray(response.data)) {
                console.log(`📋 API Client: Got ${response.data.length} tasks`);
                return response.data;
            }
            // Fallback: handle old wrapped response format
            const wrappedData = response.data;
            if (wrappedData.success && wrappedData.data && wrappedData.data.tasks) {
                return wrappedData.data.tasks;
            }
            console.log('⚠️ API Client: Unexpected response format');
            return [];
        }
        catch (error) {
            console.error('❌ API Client: getTasks failed:', error);
            throw this.handleError(error);
        }
    }
    /**
     * Get single task by ID
     */
    async getTask(taskId) {
        try {
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.TASKS.GET(taskId));
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to get task');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Create new task
     */
    async createTask(taskData) {
        try {
            const response = await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.TASKS.CREATE, taskData);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create task');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Update existing task
     */
    async updateTask(taskId, updates) {
        try {
            const response = await this.axiosInstance.patch(endpoints_1.API_ENDPOINTS.TASKS.UPDATE(taskId), updates);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to update task');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Delete task
     */
    async deleteTask(taskId) {
        try {
            const response = await this.axiosInstance.delete(endpoints_1.API_ENDPOINTS.TASKS.DELETE(taskId));
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete task');
            }
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    // ========================================
    // Subscription API
    // ========================================
    /**
     * Get current user's subscription
     */
    async getSubscription() {
        try {
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.SUBSCRIPTION.GET);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to get subscription');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
}
exports.ApiClient = ApiClient;
/**
 * Initialize and get API client singleton
 */
function initializeApiClient(context) {
    const config = vscode.workspace.getConfiguration('auxly');
    const apiUrl = config.get('apiUrl') || 'https://auxly.tzamun.com:8000';
    // Default to true to handle self-signed certificates automatically
    // TODO: Set to false once production has valid SSL certificate from Let's Encrypt
    const allowInsecureSSL = config.get('allowInsecureSSL', true);
    // Log SSL configuration for debugging
    console.log('🔒 Auxly API Client: Initializing with URL:', apiUrl);
    console.log('🔒 SSL Verification:', allowInsecureSSL ? 'Disabled (Allow Insecure)' : (process.env.NODE_ENV === 'production' ? 'Enabled (Strict)' : 'Relaxed (Development)'));
    if (allowInsecureSSL) {
        console.warn('⚠️ WARNING: SSL certificate verification is disabled. This is insecure and should only be used for testing with self-signed certificates.');
    }
    const client = ApiClient.getInstance({
        baseURL: apiUrl,
        timeout: endpoints_1.API_CONFIG.DEFAULT_TIMEOUT,
    });
    client.setContext(context);
    return client;
}
//# sourceMappingURL=api-client.js.map