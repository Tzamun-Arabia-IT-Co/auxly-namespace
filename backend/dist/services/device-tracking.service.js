"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserAgent = exports.enforceDeviceLimit = exports.clearDevicesForApiKey = exports.getDevicesForApiKey = exports.getDeviceCount = exports.registerDevice = exports.generateDeviceFingerprint = void 0;
const crypto_1 = __importDefault(require("crypto"));
const connection_1 = require("../db/connection");
const MAX_DEVICES_PER_KEY = 2;
/**
 * Generate device fingerprint from device information
 * This creates a stable identifier for the device
 */
const generateDeviceFingerprint = (deviceInfo) => {
    const { machineId, userAgent, platform } = deviceInfo;
    // Combine available device info
    const rawFingerprint = [
        machineId || '',
        userAgent || '',
        platform || '',
    ].join('|');
    // Create SHA-256 hash for consistent, non-reversible fingerprint
    return crypto_1.default
        .createHash('sha256')
        .update(rawFingerprint)
        .digest('hex')
        .substring(0, 64); // 64 chars is enough for uniqueness
};
exports.generateDeviceFingerprint = generateDeviceFingerprint;
/**
 * Register or update a device for an API key
 * Enforces per-user device limit (1-100 devices)
 */
const registerDevice = async (apiKeyId, deviceInfo) => {
    try {
        const { fingerprint, name, osInfo, browserInfo, ipAddress } = deviceInfo;
        // Get user's max_devices limit from API key
        const userLimitResult = await (0, connection_1.query)(`SELECT u.max_devices 
       FROM api_keys ak
       JOIN users u ON ak.user_id = u.id
       WHERE ak.id = $1`, [apiKeyId]);
        if (userLimitResult.rows.length === 0) {
            return {
                success: false,
                error: 'Invalid API key',
                errorCode: 'INVALID_API_KEY',
            };
        }
        const maxDevices = userLimitResult.rows[0].max_devices || MAX_DEVICES_PER_KEY;
        // Check if device already exists for this API key
        const existingDevice = await (0, connection_1.query)('SELECT id FROM api_key_devices WHERE api_key_id = $1 AND device_fingerprint = $2', [apiKeyId, fingerprint]);
        if (existingDevice.rows.length > 0) {
            // Device already registered - update last_used_at
            await (0, connection_1.query)(`UPDATE api_key_devices 
         SET last_used_at = NOW(), ip_address = $3
         WHERE api_key_id = $1 AND device_fingerprint = $2`, [apiKeyId, fingerprint, ipAddress]);
            return {
                success: true,
                deviceCount: await (0, exports.getDeviceCount)(apiKeyId),
                maxDevices,
            };
        }
        // New device - check if we've reached the limit
        const deviceCount = await (0, exports.getDeviceCount)(apiKeyId);
        if (deviceCount >= maxDevices) {
            return {
                success: false,
                error: `API key already in use on ${maxDevices} devices. Please contact support to increase your device limit or regenerate a new API key.`,
                errorCode: 'DEVICE_LIMIT_EXCEEDED',
                deviceCount,
                maxDevices,
            };
        }
        // Register new device
        await (0, connection_1.query)(`INSERT INTO api_key_devices 
       (api_key_id, device_fingerprint, device_name, os_info, browser_info, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`, [apiKeyId, fingerprint, name, osInfo, browserInfo, ipAddress]);
        return {
            success: true,
            deviceCount: deviceCount + 1,
            maxDevices,
        };
    }
    catch (error) {
        console.error('Register device error:', error);
        return {
            success: false,
            error: 'Failed to register device',
            errorCode: 'DATABASE_ERROR',
        };
    }
};
exports.registerDevice = registerDevice;
/**
 * Get count of devices for an API key
 */
const getDeviceCount = async (apiKeyId) => {
    try {
        const result = await (0, connection_1.query)('SELECT COUNT(*) as count FROM api_key_devices WHERE api_key_id = $1', [apiKeyId]);
        return parseInt(result.rows[0].count, 10);
    }
    catch (error) {
        console.error('Get device count error:', error);
        return 0;
    }
};
exports.getDeviceCount = getDeviceCount;
/**
 * Get all devices for an API key
 */
const getDevicesForApiKey = async (apiKeyId) => {
    try {
        const result = await (0, connection_1.query)(`SELECT 
        id, 
        device_name, 
        os_info, 
        browser_info, 
        first_used_at, 
        last_used_at
       FROM api_key_devices 
       WHERE api_key_id = $1
       ORDER BY last_used_at DESC`, [apiKeyId]);
        return {
            success: true,
            devices: result.rows,
            count: result.rows.length,
        };
    }
    catch (error) {
        console.error('Get devices for API key error:', error);
        return {
            success: false,
            error: 'Failed to retrieve devices',
        };
    }
};
exports.getDevicesForApiKey = getDevicesForApiKey;
/**
 * Remove all devices for an API key
 * Called when API key is regenerated/revoked
 */
const clearDevicesForApiKey = async (apiKeyId) => {
    try {
        await (0, connection_1.query)('DELETE FROM api_key_devices WHERE api_key_id = $1', [apiKeyId]);
        return true;
    }
    catch (error) {
        console.error('Clear devices error:', error);
        return false;
    }
};
exports.clearDevicesForApiKey = clearDevicesForApiKey;
/**
 * Force disconnect excess devices when user's device limit is lowered
 * Keeps the most recently used devices up to the new limit
 */
const enforceDeviceLimit = async (userId, newLimit) => {
    try {
        // Get all devices for this user's API keys
        const devicesResult = await (0, connection_1.query)(`SELECT akd.id, akd.last_used_at
       FROM api_key_devices akd
       JOIN api_keys ak ON akd.api_key_id = ak.id
       WHERE ak.user_id = $1
       ORDER BY akd.last_used_at DESC`, [userId]);
        const totalDevices = devicesResult.rows.length;
        if (totalDevices <= newLimit) {
            // No need to disconnect devices
            return { success: true, disconnectedCount: 0 };
        }
        // Get devices to disconnect (oldest ones beyond the limit)
        const devicesToDisconnect = devicesResult.rows.slice(newLimit);
        const deviceIds = devicesToDisconnect.map((d) => d.id);
        if (deviceIds.length > 0) {
            await (0, connection_1.query)(`DELETE FROM api_key_devices WHERE id = ANY($1::int[])`, [deviceIds]);
        }
        return {
            success: true,
            disconnectedCount: deviceIds.length,
        };
    }
    catch (error) {
        console.error('Enforce device limit error:', error);
        return {
            success: false,
            disconnectedCount: 0,
            error: 'Failed to enforce device limit',
        };
    }
};
exports.enforceDeviceLimit = enforceDeviceLimit;
/**
 * Parse User-Agent string to extract OS and Browser info
 */
const parseUserAgent = (userAgent) => {
    let osInfo = 'Unknown OS';
    let browserInfo = 'Unknown Browser';
    // Detect OS
    if (userAgent.includes('Windows NT 10.0'))
        osInfo = 'Windows 10';
    else if (userAgent.includes('Windows NT 11.0'))
        osInfo = 'Windows 11';
    else if (userAgent.includes('Windows'))
        osInfo = 'Windows';
    else if (userAgent.includes('Mac OS X'))
        osInfo = 'macOS';
    else if (userAgent.includes('Linux'))
        osInfo = 'Linux';
    // Detect Browser
    if (userAgent.includes('Cursor'))
        browserInfo = 'Cursor';
    else if (userAgent.includes('Edg'))
        browserInfo = 'Edge';
    else if (userAgent.includes('Chrome'))
        browserInfo = 'Chrome';
    else if (userAgent.includes('Firefox'))
        browserInfo = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
        browserInfo = 'Safari';
    const deviceName = `${osInfo} - ${browserInfo}`;
    return { osInfo, browserInfo, deviceName };
};
exports.parseUserAgent = parseUserAgent;
//# sourceMappingURL=device-tracking.service.js.map