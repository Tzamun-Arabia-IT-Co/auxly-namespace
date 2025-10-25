"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = require("../db/connection");
const router = express_1.default.Router();
/**
 * Quick fix endpoint to create PRO subscription for user ID 3
 */
router.post('/fix-user-3-subscription', async (_req, res) => {
    try {
        // Check existing subscription
        const existing = await (0, connection_1.query)('SELECT * FROM subscriptions WHERE user_id = $1', [3]);
        let result;
        if (existing.rows.length === 0) {
            // Create new
            result = await (0, connection_1.query)(`INSERT INTO subscriptions (user_id, plan_tier, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`, [3, 'pro', 'active']);
        }
        else {
            // Update existing
            result = await (0, connection_1.query)(`UPDATE subscriptions 
         SET plan_tier = $1, status = $2, updated_at = NOW()
         WHERE user_id = $3
         RETURNING *`, ['pro', 'active', 3]);
        }
        // Verify
        const verify = await (0, connection_1.query)(`
      SELECT u.id, u.email, s.plan_tier, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = 3
    `);
        res.json({
            success: true,
            message: 'Subscription fixed!',
            subscription: result.rows[0],
            verification: verify.rows[0]
        });
    }
    catch (error) {
        console.error('Fix subscription error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Fix device info for API key 15
 */
router.post('/fix-device-info', async (_req, res) => {
    try {
        // Get current devices
        const devices = await (0, connection_1.query)('SELECT * FROM api_key_devices WHERE api_key_id = $1', [15]);
        if (devices.rows.length === 0) {
            res.json({
                success: false,
                message: 'No devices found for API key 15'
            });
            return;
        }
        // Update device with proper info
        const updated = await (0, connection_1.query)(`
      UPDATE api_key_devices 
      SET 
        device_name = $1,
        os_info = $2,
        browser_info = $3,
        last_used_at = NOW()
      WHERE api_key_id = $4
      RETURNING *
    `, ['VS Code Extension - Cursor', 'Windows (awaiting extension update)', 'VS Code Extension', 15]);
        res.json({
            success: true,
            message: 'Device info updated!',
            device: updated.rows[0]
        });
    }
    catch (error) {
        console.error('Fix device error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Check admin status for a user by email
 */
router.post('/check-admin-status', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({
                success: false,
                error: 'Email is required'
            });
            return;
        }
        const result = await (0, connection_1.query)('SELECT id, email, is_admin, is_blocked FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            res.json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            user: result.rows[0]
        });
    }
    catch (error) {
        console.error('Check admin status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Set admin status for a user by email
 */
router.post('/set-admin', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({
                success: false,
                error: 'Email is required'
            });
            return;
        }
        const result = await (0, connection_1.query)('UPDATE users SET is_admin = true WHERE email = $1 RETURNING id, email, is_admin, is_blocked', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            res.json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'User is now an admin',
            user: result.rows[0]
        });
    }
    catch (error) {
        console.error('Set admin error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=fix-subscription.js.map