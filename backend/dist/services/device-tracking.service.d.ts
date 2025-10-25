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
export declare const generateDeviceFingerprint: (deviceInfo: {
    machineId?: string;
    userAgent?: string;
    platform?: string;
}) => string;
/**
 * Register or update a device for an API key
 * Enforces per-user device limit (1-100 devices)
 */
export declare const registerDevice: (apiKeyId: number, deviceInfo: DeviceInfo) => Promise<RegisterDeviceResponse>;
/**
 * Get count of devices for an API key
 */
export declare const getDeviceCount: (apiKeyId: number) => Promise<number>;
/**
 * Get all devices for an API key
 */
export declare const getDevicesForApiKey: (apiKeyId: number) => Promise<GetDevicesResponse>;
/**
 * Remove all devices for an API key
 * Called when API key is regenerated/revoked
 */
export declare const clearDevicesForApiKey: (apiKeyId: number) => Promise<boolean>;
/**
 * Force disconnect excess devices when user's device limit is lowered
 * Keeps the most recently used devices up to the new limit
 */
export declare const enforceDeviceLimit: (userId: number, newLimit: number) => Promise<{
    success: boolean;
    disconnectedCount: number;
    error?: string;
}>;
/**
 * Parse User-Agent string to extract OS and Browser info
 */
export declare const parseUserAgent: (userAgent: string) => {
    osInfo: string;
    browserInfo: string;
    deviceName: string;
};
//# sourceMappingURL=device-tracking.service.d.ts.map