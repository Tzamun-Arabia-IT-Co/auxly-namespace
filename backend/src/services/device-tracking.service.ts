import crypto from 'crypto';
import { query } from '../db/connection';

const MAX_DEVICES_PER_KEY = 2;

export interface DeviceInfo {
  fingerprint: string;
  name?: string;
  osInfo?: string;
  browserInfo?: string;
  ipAddress?: string;
}

export interface RegisterDeviceResponse {
  success: boolean;
  deviceCount?: number;
  maxDevices?: number;
  error?: string;
  errorCode?: 'DEVICE_LIMIT_EXCEEDED' | 'INVALID_API_KEY' | 'DATABASE_ERROR';
}

export interface GetDevicesResponse {
  success: boolean;
  devices?: Array<{
    id: number;
    device_name: string;
    os_info: string;
    browser_info: string;
    first_used_at: Date;
    last_used_at: Date;
  }>;
  count?: number;
  error?: string;
}

/**
 * Generate device fingerprint from device information
 * This creates a stable identifier for the device
 */
export const generateDeviceFingerprint = (deviceInfo: {
  machineId?: string;
  userAgent?: string;
  platform?: string;
}): string => {
  const { machineId, userAgent, platform } = deviceInfo;
  
  // Combine available device info
  const rawFingerprint = [
    machineId || '',
    userAgent || '',
    platform || '',
  ].join('|');
  
  // Create SHA-256 hash for consistent, non-reversible fingerprint
  return crypto
    .createHash('sha256')
    .update(rawFingerprint)
    .digest('hex')
    .substring(0, 64); // 64 chars is enough for uniqueness
};

/**
 * Register or update a device for an API key
 * Enforces per-user device limit (1-100 devices)
 */
export const registerDevice = async (
  apiKeyId: number,
  deviceInfo: DeviceInfo
): Promise<RegisterDeviceResponse> => {
  try {
    const { fingerprint, name, osInfo, browserInfo, ipAddress } = deviceInfo;

    // Get user's max_devices limit from API key
    const userLimitResult = await query(
      `SELECT u.max_devices 
       FROM api_keys ak
       JOIN users u ON ak.user_id = u.id
       WHERE ak.id = $1`,
      [apiKeyId]
    );

    if (userLimitResult.rows.length === 0) {
      return {
        success: false,
        error: 'Invalid API key',
        errorCode: 'INVALID_API_KEY',
      };
    }

    const maxDevices = userLimitResult.rows[0].max_devices || MAX_DEVICES_PER_KEY;

    // Check if device already exists for this API key
    const existingDevice = await query(
      'SELECT id FROM api_key_devices WHERE api_key_id = $1 AND device_fingerprint = $2',
      [apiKeyId, fingerprint]
    );

    if (existingDevice.rows.length > 0) {
      // Device already registered - update last_used_at
      await query(
        `UPDATE api_key_devices 
         SET last_used_at = NOW(), ip_address = $3
         WHERE api_key_id = $1 AND device_fingerprint = $2`,
        [apiKeyId, fingerprint, ipAddress]
      );

      return {
        success: true,
        deviceCount: await getDeviceCount(apiKeyId),
        maxDevices,
      };
    }

    // New device - check if we've reached the limit
    const deviceCount = await getDeviceCount(apiKeyId);
    
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
    await query(
      `INSERT INTO api_key_devices 
       (api_key_id, device_fingerprint, device_name, os_info, browser_info, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [apiKeyId, fingerprint, name, osInfo, browserInfo, ipAddress]
    );

    return {
      success: true,
      deviceCount: deviceCount + 1,
      maxDevices,
    };
  } catch (error) {
    console.error('Register device error:', error);
    return {
      success: false,
      error: 'Failed to register device',
      errorCode: 'DATABASE_ERROR',
    };
  }
};

/**
 * Get count of devices for an API key
 */
export const getDeviceCount = async (apiKeyId: number): Promise<number> => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM api_key_devices WHERE api_key_id = $1',
      [apiKeyId]
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Get device count error:', error);
    return 0;
  }
};

/**
 * Get all devices for an API key
 */
export const getDevicesForApiKey = async (
  apiKeyId: number
): Promise<GetDevicesResponse> => {
  try {
    const result = await query(
      `SELECT 
        id, 
        device_name, 
        os_info, 
        browser_info, 
        first_used_at, 
        last_used_at
       FROM api_key_devices 
       WHERE api_key_id = $1
       ORDER BY last_used_at DESC`,
      [apiKeyId]
    );

    return {
      success: true,
      devices: result.rows,
      count: result.rows.length,
    };
  } catch (error) {
    console.error('Get devices for API key error:', error);
    return {
      success: false,
      error: 'Failed to retrieve devices',
    };
  }
};

/**
 * Remove all devices for an API key
 * Called when API key is regenerated/revoked
 */
export const clearDevicesForApiKey = async (
  apiKeyId: number
): Promise<boolean> => {
  try {
    await query(
      'DELETE FROM api_key_devices WHERE api_key_id = $1',
      [apiKeyId]
    );
    return true;
  } catch (error) {
    console.error('Clear devices error:', error);
    return false;
  }
};

/**
 * Force disconnect excess devices when user's device limit is lowered
 * Keeps the most recently used devices up to the new limit
 */
export const enforceDeviceLimit = async (
  userId: number,
  newLimit: number
): Promise<{ success: boolean; disconnectedCount: number; error?: string }> => {
  try {
    // Get all devices for this user's API keys
    const devicesResult = await query(
      `SELECT akd.id, akd.last_used_at
       FROM api_key_devices akd
       JOIN api_keys ak ON akd.api_key_id = ak.id
       WHERE ak.user_id = $1
       ORDER BY akd.last_used_at DESC`,
      [userId]
    );

    const totalDevices = devicesResult.rows.length;

    if (totalDevices <= newLimit) {
      // No need to disconnect devices
      return { success: true, disconnectedCount: 0 };
    }

    // Get devices to disconnect (oldest ones beyond the limit)
    const devicesToDisconnect = devicesResult.rows.slice(newLimit);
    const deviceIds = devicesToDisconnect.map((d: any) => d.id);

    if (deviceIds.length > 0) {
      await query(
        `DELETE FROM api_key_devices WHERE id = ANY($1::int[])`,
        [deviceIds]
      );
    }

    return {
      success: true,
      disconnectedCount: deviceIds.length,
    };
  } catch (error) {
    console.error('Enforce device limit error:', error);
    return {
      success: false,
      disconnectedCount: 0,
      error: 'Failed to enforce device limit',
    };
  }
};

/**
 * Parse User-Agent string to extract OS and Browser info
 */
export const parseUserAgent = (userAgent: string): {
  osInfo: string;
  browserInfo: string;
  deviceName: string;
} => {
  let osInfo = 'Unknown OS';
  let browserInfo = 'Unknown Browser';

  // Detect OS
  if (userAgent.includes('Windows NT 10.0')) osInfo = 'Windows 10';
  else if (userAgent.includes('Windows NT 11.0')) osInfo = 'Windows 11';
  else if (userAgent.includes('Windows')) osInfo = 'Windows';
  else if (userAgent.includes('Mac OS X')) osInfo = 'macOS';
  else if (userAgent.includes('Linux')) osInfo = 'Linux';

  // Detect Browser
  if (userAgent.includes('Cursor')) browserInfo = 'Cursor';
  else if (userAgent.includes('Edg')) browserInfo = 'Edge';
  else if (userAgent.includes('Chrome')) browserInfo = 'Chrome';
  else if (userAgent.includes('Firefox')) browserInfo = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserInfo = 'Safari';

  const deviceName = `${osInfo} - ${browserInfo}`;

  return { osInfo, browserInfo, deviceName };
};






