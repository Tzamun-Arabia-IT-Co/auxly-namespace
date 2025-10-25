import { DeviceInfo } from './device-tracking.service';
export interface GenerateApiKeyInput {
    user_id: number;
    name?: string;
}
export interface GenerateApiKeyResponse {
    success: boolean;
    api_key?: string;
    key_info?: {
        id: number;
        masked_key: string;
        name?: string;
        created_at: Date;
        expires_at: Date;
    };
    error?: string;
}
export interface ListApiKeysResponse {
    success: boolean;
    keys?: Array<{
        id: number;
        masked_key: string;
        name?: string;
        last_used?: Date;
        revoked: boolean;
        created_at: Date;
        expires_at: Date;
        is_expired: boolean;
    }>;
    error?: string;
}
export interface ValidateApiKeyResponse {
    success: boolean;
    user_id?: number;
    api_key_id?: number;
    email?: string;
    subscription?: {
        plan_tier: string;
        status: string;
    };
    error?: string;
}
export interface RevokeApiKeyResponse {
    success: boolean;
    error?: string;
}
/**
 * Generate a new API key for a user
 */
export declare const generateNewApiKey: (input: GenerateApiKeyInput) => Promise<GenerateApiKeyResponse>;
/**
 * List all API keys for a user (returns masked keys)
 */
export declare const listUserApiKeys: (user_id: number) => Promise<ListApiKeysResponse>;
/**
 * Validate an API key and return user information
 * Now includes device tracking to enforce 2-device limit
 */
export declare const validateApiKey: (apiKey: string, deviceInfo?: DeviceInfo) => Promise<ValidateApiKeyResponse>;
/**
 * Revoke an API key
 */
export declare const revokeApiKey: (key_id: number, user_id: number) => Promise<RevokeApiKeyResponse>;
/**
 * Check rate limit for user based on subscription tier
 * Returns true if within limits, false if exceeded
 */
export declare const checkRateLimit: (user_id: number, plan_tier: string) => Promise<{
    allowed: boolean;
    usage_count: number;
    limit: number;
}>;
//# sourceMappingURL=api-key.service.d.ts.map