"use strict";
/**
 * API Endpoint Definitions
 * Centralized endpoint configuration for the Auxly API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.API_CONFIG = exports.API_ENDPOINTS = void 0;
exports.API_ENDPOINTS = {
    // ========================================
    // Authentication Endpoints
    // ========================================
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/verify',
    },
    // ========================================
    // Task Endpoints (TODO: Backend needs these routes)
    // ========================================
    TASKS: {
        LIST: '/tasks',
        CREATE: '/tasks',
        GET: (taskId) => `/tasks/${taskId}`,
        UPDATE: (taskId) => `/tasks/${taskId}`,
        DELETE: (taskId) => `/tasks/${taskId}`,
    },
    // ========================================
    // Subscription Endpoints
    // ========================================
    SUBSCRIPTION: {
        GET: '/subscription/status',
        CREATE: '/subscription',
        UPDATE: '/subscription',
        CANCEL: '/subscription/cancel',
    },
    // ========================================
    // API Key Endpoints
    // ========================================
    API_KEYS: {
        VERIFY: '/api-keys/verify',
        LIST: '/api-keys/list',
        CREATE: '/api-keys/generate',
        DELETE: (keyId) => `/api-keys/revoke/${keyId}`,
    },
};
/**
 * Default API configuration values
 */
exports.API_CONFIG = {
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    DEFAULT_RETRY_ATTEMPTS: 4,
    DEFAULT_RETRY_DELAY: 1000, // 1 second (will use exponential backoff)
    TOKEN_REFRESH_THRESHOLD: 300, // 5 minutes before expiration
};
/**
 * HTTP status codes we care about
 */
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
//# sourceMappingURL=endpoints.js.map