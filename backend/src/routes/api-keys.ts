import { Router, Request, Response } from 'express';
import {
  generateNewApiKey,
  listUserApiKeys,
  revokeApiKey,
} from '../services/api-key.service';
import { getDevicesForApiKey } from '../services/device-tracking.service';
import { authenticate } from '../middleware/auth';
import { authenticateApiKey } from '../middleware/api-key';
import { query } from '../db/connection';

const router = Router();

/**
 * POST /api-keys/generate
 * Generate a new API key for the authenticated user
 * Protected by JWT authentication
 */
router.post('/generate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name } = req.body;

    // Generate new API key
    const result = await generateNewApiKey({
      user_id: req.user.id,
      name: name || undefined,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'API key generated successfully',
      api_key: result.api_key,
      key_info: result.key_info,
      warning: 'Save this key securely. You will not be able to see it again.',
    });
  } catch (error) {
    console.error('Generate API key route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api-keys/list
 * List all API keys for the authenticated user
 * Protected by JWT authentication
 */
router.get('/list', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // List user's API keys
    const result = await listUserApiKeys(req.user.id);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(200).json({
      keys: result.keys,
      count: result.keys?.length || 0,
    });
  } catch (error) {
    console.error('List API keys route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api-keys/:id
 * Revoke an API key
 * Protected by JWT authentication
 */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const key_id = parseInt(req.params.id);

    if (isNaN(key_id)) {
      res.status(400).json({ error: 'Invalid API key ID' });
      return;
    }

    // Revoke API key (ensures user owns the key)
    const result = await revokeApiKey(key_id, req.user.id);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.status(200).json({
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Revoke API key route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api-keys/verify
 * Verify an API key and return user information
 * Uses API key authentication (not JWT)
 */
router.get('/verify', authenticateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.apiKeyUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // If middleware passed, API key is valid
    res.status(200).json({
      message: 'API key is valid',
      user: {
        user_id: req.apiKeyUser.user_id,
        email: req.apiKeyUser.email,
        subscription: req.apiKeyUser.subscription,
      },
    });
  } catch (error) {
    console.error('Verify API key route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api-keys/usage
 * Get usage statistics for the authenticated user's API keys (last 14 days)
 * Protected by JWT authentication
 */
router.get('/usage', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get API usage for last 14 days, grouped by date
    const result = await query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as requests
      FROM usage_logs
      WHERE user_id = $1
        AND timestamp >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) ASC
    `, [req.user.id]);

    // Create array of last 14 days with zero counts for missing days
    const today = new Date();
    const usageData: number[] = [];
    const dates: string[] = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find matching data for this date
      const dayData = result.rows.find((row: any) => 
        row.date.toISOString().split('T')[0] === dateStr
      );
      
      usageData.push(dayData ? parseInt(dayData.requests) : 0);
      dates.push(dateStr);
    }

    // Calculate today's usage and daily limit
    const todayUsage = usageData[usageData.length - 1] || 0;
    
    // Get user's plan tier from subscriptions table
    const planResult = await query(
      'SELECT plan_tier FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );
    const planTier = planResult.rows[0]?.plan_tier || 'free';
    const dailyLimit = planTier === 'pro' ? 10000 : 5000;

    res.status(200).json({
      usageData,
      dates,
      api_requests_today: todayUsage,
      daily_limit: dailyLimit,
      percentage: Math.round((todayUsage / dailyLimit) * 100),
    });
  } catch (error) {
    console.error('API key usage route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api-keys/:id/devices
 * Get connected devices for a specific API key
 * Protected by JWT authentication
 */
/**
 * GET /api-keys/devices/all
 * Get ALL devices for the authenticated user (across all their API keys)
 * Protected by JWT authentication
 */
router.get('/devices/all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { query } = await import('../db/connection');
    
    // Get all devices for all NON-REVOKED API keys belonging to this user
    const result = await query(`
      SELECT 
        akd.id,
        akd.api_key_id,
        akd.device_fingerprint,
        akd.device_name,
        akd.os_info,
        akd.browser_info,
        akd.first_used_at,
        akd.last_used_at,
        ak.name as api_key_name,
        ak.revoked as api_key_revoked
      FROM api_key_devices akd
      JOIN api_keys ak ON akd.api_key_id = ak.id
      WHERE ak.user_id = $1 AND ak.revoked = false
      ORDER BY akd.last_used_at DESC
    `, [req.user.id]);

    res.status(200).json({
      devices: result.rows || [],
      count: result.rows.length || 0,
      max_devices: 2,
    });
  } catch (error) {
    console.error('Get all user devices route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/devices', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const keyId = parseInt(req.params.id);

    if (isNaN(keyId)) {
      res.status(400).json({ error: 'Invalid API key ID' });
      return;
    }

    // Get devices for this API key
    const result = await getDevicesForApiKey(keyId);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(200).json({
      devices: result.devices || [],
      count: result.count || 0,
      max_devices: 2,
    });
  } catch (error) {
    console.error('Get API key devices route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

