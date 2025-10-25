"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalApiKeyAuth = exports.authenticateApiKey = void 0;
const api_key_service_1 = require("../services/api-key.service");
const device_tracking_service_1 = require("../services/device-tracking.service");
/**
 * API Key authentication middleware
 * Validates API key from header and attaches user info to request
 */
const authenticateApiKey = async (req, res, next) => {
    try {
        // Try to get API key from different header formats
        let apiKey;
        // Option 1: Bearer token in Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.replace('Bearer ', '');
        }
        // Option 2: X-API-Key header
        if (!apiKey && req.headers['x-api-key']) {
            apiKey = req.headers['x-api-key'];
        }
        if (!apiKey) {
            res.status(401).json({ error: 'No API key provided' });
            return;
        }
        // Extract device information for tracking
        const deviceFingerprint = req.headers['x-device-fingerprint'];
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket.remoteAddress ||
            'unknown';
        // 🔧 NEW: Read custom device headers from extension
        const customDeviceName = req.headers['x-device-name'];
        const customOsInfo = req.headers['x-os-info'];
        const customBrowserInfo = req.headers['x-browser-info'];
        // 🐛 DEBUG: Log device tracking info
        console.log('🔍 Device Tracking Debug:', {
            hasFingerprint: !!deviceFingerprint,
            fingerprint: deviceFingerprint,
            userAgent,
            ipAddress,
            customDeviceName,
            customOsInfo,
            customBrowserInfo
        });
        // Parse user agent to get OS and browser info (fallback if custom headers not provided)
        const { osInfo, browserInfo, deviceName } = (0, device_tracking_service_1.parseUserAgent)(userAgent);
        // Prepare device info for validation
        // Prioritize custom headers from extension over parsed user agent
        const deviceInfo = deviceFingerprint ? {
            fingerprint: deviceFingerprint,
            name: customDeviceName || deviceName,
            osInfo: customOsInfo || osInfo,
            browserInfo: customBrowserInfo || browserInfo,
            ipAddress,
        } : undefined;
        // 🐛 DEBUG: Log prepared device info
        console.log('📱 Device Info:', deviceInfo ? 'PRESENT' : 'MISSING', deviceInfo);
        // Validate API key (includes device tracking if device info provided)
        const validation = await (0, api_key_service_1.validateApiKey)(apiKey, deviceInfo);
        if (!validation.success || !validation.user_id || !validation.api_key_id) {
            res.status(401).json({ error: validation.error || 'Invalid API key' });
            return;
        }
        // Check rate limits based on subscription tier
        const rateLimitCheck = await (0, api_key_service_1.checkRateLimit)(validation.user_id, validation.subscription?.plan_tier || 'free');
        if (!rateLimitCheck.allowed) {
            res.status(429).json({
                error: 'Rate limit exceeded',
                usage_count: rateLimitCheck.usage_count,
                limit: rateLimitCheck.limit,
                message: `You have used ${rateLimitCheck.usage_count}/${rateLimitCheck.limit} requests this month. Upgrade to Pro for unlimited access.`,
            });
            return;
        }
        // Attach API key user info to request
        req.apiKeyUser = {
            user_id: validation.user_id,
            api_key_id: validation.api_key_id,
            email: validation.email,
            subscription: validation.subscription,
        };
        next();
    }
    catch (error) {
        console.error('API key authentication error:', error);
        res.status(401).json({ error: 'API key authentication failed' });
    }
};
exports.authenticateApiKey = authenticateApiKey;
/**
 * Optional API key authentication
 * Does not fail if no key provided, but validates if present
 */
const optionalApiKeyAuth = async (req, _res, next) => {
    try {
        // Try to get API key
        let apiKey;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.replace('Bearer ', '');
        }
        if (!apiKey && req.headers['x-api-key']) {
            apiKey = req.headers['x-api-key'];
        }
        // If no key, continue without authentication
        if (!apiKey) {
            next();
            return;
        }
        // Extract device information for tracking
        const deviceFingerprint = req.headers['x-device-fingerprint'];
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.socket.remoteAddress ||
            'unknown';
        // 🔧 NEW: Read custom device headers from extension
        const customDeviceName = req.headers['x-device-name'];
        const customOsInfo = req.headers['x-os-info'];
        const customBrowserInfo = req.headers['x-browser-info'];
        const { osInfo, browserInfo, deviceName } = (0, device_tracking_service_1.parseUserAgent)(userAgent);
        // Prioritize custom headers from extension over parsed user agent
        const deviceInfo = deviceFingerprint ? {
            fingerprint: deviceFingerprint,
            name: customDeviceName || deviceName,
            osInfo: customOsInfo || osInfo,
            browserInfo: customBrowserInfo || browserInfo,
            ipAddress,
        } : undefined;
        // If key provided, validate it (with device tracking)
        const validation = await (0, api_key_service_1.validateApiKey)(apiKey, deviceInfo);
        if (validation.success && validation.user_id && validation.api_key_id) {
            req.apiKeyUser = {
                user_id: validation.user_id,
                api_key_id: validation.api_key_id,
                email: validation.email,
                subscription: validation.subscription,
            };
        }
        next();
    }
    catch (error) {
        console.error('Optional API key auth error:', error);
        next(); // Continue even on error
    }
};
exports.optionalApiKeyAuth = optionalApiKeyAuth;
//# sourceMappingURL=api-key.js.map