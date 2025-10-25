import bcrypt from 'bcrypt';
import { query } from '../db/connection';
import { generateApiKey, validateApiKeyFormat, maskApiKey } from '../utils/key-generator';
import { registerDevice, DeviceInfo } from './device-tracking.service';

const SALT_ROUNDS = 12;

export interface GenerateApiKeyInput {
  user_id: number;
  name?: string;
}

export interface GenerateApiKeyResponse {
  success: boolean;
  api_key?: string; // Plain text key (returned only once)
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
export const generateNewApiKey = async (
  input: GenerateApiKeyInput
): Promise<GenerateApiKeyResponse> => {
  try {
    const { user_id, name } = input;

    // Generate secure random API key
    const apiKey = generateApiKey();

    // Hash the API key for storage
    const key_hash = await bcrypt.hash(apiKey, SALT_ROUNDS);

    // Insert into database with 6-month expiration (LIMITED TIME OFFER)
    const result = await query(
      `INSERT INTO api_keys (user_id, key_hash, name, expires_at) 
       VALUES ($1, $2, $3, NOW() + INTERVAL '6 months') 
       RETURNING id, name, created_at, expires_at`,
      [user_id, key_hash, name || null]
    );

    const keyRecord = result.rows[0];

    return {
      success: true,
      api_key: apiKey, // Return plain text key (ONLY TIME IT'S SHOWN)
      key_info: {
        id: keyRecord.id,
        masked_key: maskApiKey(apiKey),
        name: keyRecord.name,
        created_at: keyRecord.created_at,
        expires_at: keyRecord.expires_at,
      },
    };
  } catch (error) {
    console.error('Generate API key error:', error);
    return { success: false, error: 'Failed to generate API key' };
  }
};

/**
 * List all API keys for a user (returns masked keys)
 */
export const listUserApiKeys = async (user_id: number): Promise<ListApiKeysResponse> => {
  try {
    const result = await query(
      `SELECT 
        id, 
        name, 
        last_used, 
        revoked, 
        created_at,
        expires_at,
        (expires_at <= NOW()) as is_expired
       FROM api_keys 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id]
    );

    const keys = result.rows.map((row) => ({
      id: row.id,
      masked_key: `auxly_***...***`, // Generic mask since we don't store plain text
      name: row.name,
      last_used: row.last_used,
      revoked: row.revoked,
      created_at: row.created_at,
      expires_at: row.expires_at,
      is_expired: row.is_expired,
    }));

    return {
      success: true,
      keys,
    };
  } catch (error) {
    console.error('List API keys error:', error);
    return { success: false, error: 'Failed to list API keys' };
  }
};

/**
 * Validate an API key and return user information
 * Now includes device tracking to enforce 2-device limit
 */
export const validateApiKey = async (
  apiKey: string,
  deviceInfo?: DeviceInfo
): Promise<ValidateApiKeyResponse> => {
  try {
    // 🐛 DEBUG: Log API key being validated (first 20 chars for security)
    console.log('🔑 Validating API Key:', apiKey.substring(0, 20) + '...');
    
    // Validate key format
    if (!validateApiKeyFormat(apiKey)) {
      console.log('❌ API Key format invalid');
      return { success: false, error: 'Invalid API key format' };
    }

    // Get all non-revoked, non-expired API keys (we need to check each hash)
    const result = await query(
      `SELECT 
        ak.id, 
        ak.user_id, 
        ak.key_hash, 
        ak.revoked,
        ak.expires_at,
        u.email,
        s.plan_tier,
        s.status as subscription_status
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE ak.revoked = false 
      AND ak.expires_at > NOW()`,
      []
    );

    console.log(`🔍 Found ${result.rows.length} valid API keys to check`);

    // Check each key hash to find a match
    for (const row of result.rows) {
      console.log(`🔐 Comparing with API Key ID: ${row.id} (User: ${row.email})`);
      const isMatch = await bcrypt.compare(apiKey, row.key_hash);
      console.log(`  ${isMatch ? '✅ MATCH!' : '❌ No match'}`);
      
      if (isMatch) {
        // Update last_used timestamp
        await query(
          'UPDATE api_keys SET last_used = NOW() WHERE id = $1',
          [row.id]
        );

        // Log usage
        await query(
          'INSERT INTO usage_logs (api_key_id, user_id, action_type, metadata) VALUES ($1, $2, $3, $4)',
          [row.id, row.user_id, 'api_key_validation', { timestamp: new Date() }]
        );

        // Device tracking: Register/validate device if device info provided
        if (deviceInfo && deviceInfo.fingerprint) {
          const deviceResult = await registerDevice(row.id, deviceInfo);
          
          if (!deviceResult.success) {
            // Device limit exceeded or other error
            return {
              success: false,
              error: deviceResult.error || 'Device registration failed',
            };
          }
        }

        return {
          success: true,
          user_id: row.user_id,
          api_key_id: row.id,
          email: row.email,
          subscription: {
            plan_tier: row.plan_tier || 'free',
            status: row.subscription_status || 'active',
          },
        };
      }
    }

    // No match found - check if key exists but is expired
    const expiredCheck = await query(
      `SELECT ak.id, ak.key_hash, ak.expires_at 
       FROM api_keys ak
       WHERE ak.revoked = false 
       AND ak.expires_at <= NOW()`,
      []
    );

    // Try to match against expired keys
    for (const row of expiredCheck.rows) {
      const isMatch = await bcrypt.compare(apiKey, row.key_hash);
      if (isMatch) {
        return { success: false, error: 'API key has expired' };
      }
    }

    // Key not found or invalid
    return { success: false, error: 'Invalid API key' };
  } catch (error) {
    console.error('Validate API key error:', error);
    return { success: false, error: 'API key validation failed' };
  }
};

/**
 * Revoke an API key
 */
export const revokeApiKey = async (
  key_id: number,
  user_id: number
): Promise<RevokeApiKeyResponse> => {
  try {
    // Update revoked flag (verify ownership)
    const result = await query(
      'UPDATE api_keys SET revoked = true WHERE id = $1 AND user_id = $2 RETURNING id',
      [key_id, user_id]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'API key not found or unauthorized' };
    }

    // 🔧 CRITICAL FIX: Delete ALL devices for this USER (not just this API key)
    // Problem: Device might be connected to an OLD API key, not the one being revoked
    // Solution: Clear ALL devices across ALL user's API keys for a fresh 0/2 start
    const deleteResult = await query(
      `DELETE FROM api_key_devices 
       WHERE api_key_id IN (
         SELECT id FROM api_keys WHERE user_id = $1
       )`,
      [user_id]
    );

    console.log(`✅ API Key ${key_id} revoked and ALL ${deleteResult.rowCount} user devices removed (fresh 0/2 start)`);

    return { success: true };
  } catch (error) {
    console.error('Revoke API key error:', error);
    return { success: false, error: 'Failed to revoke API key' };
  }
};

/**
 * Check rate limit for user based on subscription tier
 * Returns true if within limits, false if exceeded
 */
export const checkRateLimit = async (
  user_id: number,
  plan_tier: string
): Promise<{ allowed: boolean; usage_count: number; limit: number }> => {
  try {
    // Define tier limits
    const TIER_LIMITS = {
      free: 50,
      pro: Infinity,
      team: Infinity,
    };

    const limit = TIER_LIMITS[plan_tier as keyof typeof TIER_LIMITS] || 50;

    // If unlimited, allow immediately
    if (limit === Infinity) {
      return { allowed: true, usage_count: 0, limit };
    }

    // Count usage in last 30 days
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM usage_logs 
       WHERE user_id = $1 
       AND timestamp > NOW() - INTERVAL '30 days'`,
      [user_id]
    );

    const usage_count = parseInt(result.rows[0].count);

    return {
      allowed: usage_count < limit,
      usage_count,
      limit,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow on error (fail open for better UX)
    return { allowed: true, usage_count: 0, limit: 0 };
  }
};

