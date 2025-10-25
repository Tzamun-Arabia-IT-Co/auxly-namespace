"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = require("../db/connection");
const admin_auth_1 = require("../middleware/admin-auth");
const device_tracking_service_1 = require("../services/device-tracking.service");
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
// All admin routes require admin authentication
router.use(admin_auth_1.requireAdmin);
/**
 * GET /api/admin/users
 * Get all users with their device counts, limits, and API keys
 */
router.get('/users', async (_req, res) => {
    try {
        const result = await (0, connection_1.query)(`
      SELECT 
        u.id,
        u.email,
        u.is_admin,
        u.is_blocked,
        u.created_at,
        u.max_devices,
        s.plan_tier,
        s.status as subscription_status,
        COUNT(DISTINCT ak.id) as api_key_count,
        COUNT(DISTINCT akd.id) as device_count,
        MAX(ak.last_used) as last_active
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.revoked = false
      LEFT JOIN api_key_devices akd ON ak.id = akd.api_key_id
      GROUP BY u.id, u.email, u.is_admin, u.is_blocked, u.created_at, u.max_devices, s.plan_tier, s.status
      ORDER BY u.created_at DESC
    `);
        res.json({ users: result.rows });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
/**
 * GET /api/admin/users/:id
 * Get detailed user information including all API keys, devices, device limit, and analytics
 */
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Get user info
        const userResult = await (0, connection_1.query)(`
      SELECT 
        u.id,
        u.email,
        u.is_admin,
        u.is_blocked,
        u.created_at,
        u.max_devices,
        s.plan_tier,
        s.status as subscription_status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = $1
    `, [id]);
        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Get API keys
        const apiKeysResult = await (0, connection_1.query)(`
      SELECT 
        id,
        name,
        revoked,
        last_used,
        created_at,
        expires_at
      FROM api_keys
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [id]);
        // Get devices for each API key
        const devicesResult = await (0, connection_1.query)(`
      SELECT 
        akd.id,
        akd.api_key_id,
        akd.device_name,
        akd.os_info,
        akd.browser_info,
        akd.ip_address,
        akd.device_fingerprint,
        akd.first_used_at,
        akd.last_used_at
      FROM api_key_devices akd
      JOIN api_keys ak ON akd.api_key_id = ak.id
      WHERE ak.user_id = $1
      ORDER BY akd.last_used_at DESC
    `, [id]);
        // Get user analytics
        const analyticsResult = await (0, connection_1.query)(`
      SELECT 
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) as tasks_todo,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as tasks_in_progress,
        COUNT(DISTINCT CASE WHEN t.status = 'review' THEN t.id END) as tasks_review,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as tasks_done,
        COUNT(DISTINCT ul.id) as total_api_calls,
        COUNT(DISTINCT CASE WHEN ul.timestamp > NOW() - INTERVAL '30 days' THEN ul.id END) as api_calls_last_30_days,
        EXTRACT(DAY FROM NOW() - u.created_at) as account_age_days,
        MAX(ak.last_used) as last_login
      FROM users u
      LEFT JOIN tasks t ON u.id = t.user_id
      LEFT JOIN usage_logs ul ON u.id = ul.user_id
      LEFT JOIN api_keys ak ON u.id = ak.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.created_at
    `, [id]);
        const analytics = analyticsResult.rows[0] ? {
            total_tasks: parseInt(analyticsResult.rows[0].total_tasks) || 0,
            tasks_by_status: {
                todo: parseInt(analyticsResult.rows[0].tasks_todo) || 0,
                in_progress: parseInt(analyticsResult.rows[0].tasks_in_progress) || 0,
                review: parseInt(analyticsResult.rows[0].tasks_review) || 0,
                done: parseInt(analyticsResult.rows[0].tasks_done) || 0,
            },
            total_api_calls: parseInt(analyticsResult.rows[0].total_api_calls) || 0,
            api_calls_last_30_days: parseInt(analyticsResult.rows[0].api_calls_last_30_days) || 0,
            account_age_days: parseInt(analyticsResult.rows[0].account_age_days) || 0,
            last_login: analyticsResult.rows[0].last_login,
        } : null;
        res.json({
            user: userResult.rows[0],
            apiKeys: apiKeysResult.rows,
            devices: devicesResult.rows,
            analytics
        });
    }
    catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});
/**
 * POST /api/admin/users/:id/block
 * Block or unblock a user
 */
router.post('/users/:id/block', async (req, res) => {
    try {
        const { id } = req.params;
        const { blocked } = req.body;
        const adminUser = req.user;
        // Prevent admin from blocking themselves
        if (id === adminUser.id) {
            res.status(400).json({ error: 'Cannot block yourself' });
            return;
        }
        await (0, connection_1.query)('UPDATE users SET is_blocked = $1 WHERE id = $2', [blocked, id]);
        res.json({
            message: blocked ? 'User blocked successfully' : 'User unblocked successfully'
        });
    }
    catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ error: 'Failed to block user' });
    }
});
/**
 * POST /api/admin/users/:id/make-admin
 * Promote user to admin or demote from admin
 */
router.post('/users/:id/make-admin', async (req, res) => {
    try {
        const { id } = req.params;
        const { isAdmin } = req.body;
        await (0, connection_1.query)('UPDATE users SET is_admin = $1 WHERE id = $2', [isAdmin, id]);
        res.json({
            message: isAdmin ? 'User promoted to admin' : 'User demoted from admin'
        });
    }
    catch (error) {
        console.error('Error updating admin status:', error);
        res.status(500).json({ error: 'Failed to update admin status' });
    }
});
/**
 * POST /api/admin/api-keys/:id/revoke
 * Revoke an API key
 */
router.post('/api-keys/:id/revoke', async (req, res) => {
    try {
        const { id } = req.params;
        await (0, connection_1.query)('UPDATE api_keys SET revoked = true WHERE id = $1', [id]);
        // Delete associated devices
        await (0, connection_1.query)('DELETE FROM api_key_devices WHERE api_key_id = $1', [id]);
        res.json({ message: 'API key revoked successfully' });
    }
    catch (error) {
        console.error('Error revoking API key:', error);
        res.status(500).json({ error: 'Failed to revoke API key' });
    }
});
/**
 * DELETE /api/admin/devices/:id
 * Remove a specific device
 */
router.delete('/devices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await (0, connection_1.query)('DELETE FROM api_key_devices WHERE id = $1', [id]);
        res.json({ message: 'Device removed successfully' });
    }
    catch (error) {
        console.error('Error removing device:', error);
        res.status(500).json({ error: 'Failed to remove device' });
    }
});
/**
 * POST /api/admin/create-admin
 * Create a new admin user
 */
router.post('/create-admin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // Check if email already exists
        const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create admin user
        const result = await (0, connection_1.query)(`INSERT INTO users (email, password_hash, is_admin, is_blocked) 
       VALUES ($1, $2, true, false) 
       RETURNING id, email, is_admin`, [email.toLowerCase(), hashedPassword]);
        const newAdmin = result.rows[0];
        // Create PRO subscription for admin
        await (0, connection_1.query)('INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)', [newAdmin.id, 'pro', 'active']);
        res.status(201).json({
            message: 'Admin created successfully',
            admin: newAdmin
        });
    }
    catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});
/**
 * GET /api/admin/stats
 * Get system statistics
 */
router.get('/stats', async (_req, res) => {
    try {
        const stats = await (0, connection_1.query)(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_blocked = false) as active_users,
        (SELECT COUNT(*) FROM api_keys WHERE revoked = false) as active_api_keys,
        (SELECT COUNT(*) FROM api_key_devices akd 
         JOIN api_keys ak ON akd.api_key_id = ak.id 
         WHERE ak.revoked = false) as total_devices,
        (SELECT COUNT(*) FROM subscriptions WHERE plan_tier = 'pro') as pro_users
    `);
        res.json({ stats: stats.rows[0] });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
/**
 * POST /api/admin/users/:id/device-limit
 * Update user's device limit
 */
router.post('/users/:id/device-limit', async (req, res) => {
    try {
        const { id } = req.params;
        const { maxDevices, reason } = req.body;
        const adminUser = req.user;
        // Validate maxDevices
        if (!maxDevices || maxDevices < 1 || maxDevices > 100) {
            res.status(400).json({ error: 'Device limit must be between 1 and 100' });
            return;
        }
        // Get current limit
        const currentLimitResult = await (0, connection_1.query)('SELECT max_devices FROM users WHERE id = $1', [id]);
        if (currentLimitResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const oldLimit = currentLimitResult.rows[0].max_devices;
        // Update device limit
        await (0, connection_1.query)('UPDATE users SET max_devices = $1 WHERE id = $2', [maxDevices, id]);
        // Log the change in audit table
        await (0, connection_1.query)(`INSERT INTO device_limit_audit_log 
       (user_id, admin_id, old_limit, new_limit, reason)
       VALUES ($1, $2, $3, $4, $5)`, [id, adminUser.id, oldLimit, maxDevices, reason || null]);
        // If limit was lowered, enforce it by disconnecting excess devices
        let disconnectedCount = 0;
        if (maxDevices < oldLimit) {
            const enforceResult = await (0, device_tracking_service_1.enforceDeviceLimit)(parseInt(id), maxDevices);
            disconnectedCount = enforceResult.disconnectedCount;
        }
        res.json({
            message: 'Device limit updated successfully',
            oldLimit,
            newLimit: maxDevices,
            disconnectedDevices: disconnectedCount,
        });
    }
    catch (error) {
        console.error('Error updating device limit:', error);
        res.status(500).json({ error: 'Failed to update device limit' });
    }
});
/**
 * GET /api/admin/users/:id/device-limit-history
 * Get device limit change history for a user
 */
router.get('/users/:id/device-limit-history', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)(`SELECT 
        dl.id,
        dl.old_limit,
        dl.new_limit,
        dl.changed_at,
        dl.reason,
        u.email as admin_email
       FROM device_limit_audit_log dl
       JOIN users u ON dl.admin_id = u.id
       WHERE dl.user_id = $1
       ORDER BY dl.changed_at DESC
       LIMIT 50`, [id]);
        res.json({ history: result.rows });
    }
    catch (error) {
        console.error('Error fetching device limit history:', error);
        res.status(500).json({ error: 'Failed to fetch device limit history' });
    }
});
/**
 * POST /api/admin/users/:id/plan
 * Change user's subscription plan
 */
router.post('/users/:id/plan', async (req, res) => {
    try {
        const { id } = req.params;
        const { planTier } = req.body; // 'free' or 'pro'
        const adminUser = req.user;
        if (!planTier || !['free', 'pro'].includes(planTier)) {
            res.status(400).json({ error: 'Invalid plan tier. Must be "free" or "pro"' });
            return;
        }
        // Check if user exists
        const userResult = await (0, connection_1.query)('SELECT id, email FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const user = userResult.rows[0];
        // Check if subscription exists
        const subResult = await (0, connection_1.query)('SELECT id, plan_tier FROM subscriptions WHERE user_id = $1', [id]);
        let oldPlan = 'none';
        if (subResult.rows.length > 0) {
            // Update existing subscription
            oldPlan = subResult.rows[0].plan_tier;
            await (0, connection_1.query)('UPDATE subscriptions SET plan_tier = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3', [planTier, 'active', id]);
        }
        else {
            // Create new subscription
            await (0, connection_1.query)(`INSERT INTO subscriptions (user_id, plan_tier, status, current_period_end, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '6 months', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [id, planTier, 'active']);
        }
        console.log(`📋 Admin ${adminUser.email} changed ${user.email}'s plan from ${oldPlan} to ${planTier}`);
        res.json({
            message: 'Plan updated successfully',
            oldPlan,
            newPlan: planTier,
            user: user.email
        });
    }
    catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
});
/**
 * DELETE /api/admin/users/:id
 * Delete a user (soft delete or hard delete)
 * Query param: ?hard=true for permanent deletion
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { hard } = req.query;
        const adminUser = req.user;
        // Prevent admin from deleting themselves
        if (id === adminUser.id) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }
        // Check if user exists
        const userResult = await (0, connection_1.query)('SELECT id, email, is_admin FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const user = userResult.rows[0];
        if (hard === 'true') {
            // HARD DELETE - Permanently remove user and all associated data
            console.log(`🗑️ Hard deleting user ${user.email} (ID: ${id})`);
            // Delete in order to respect foreign key constraints
            // 1. Delete device limit audit logs
            await (0, connection_1.query)('DELETE FROM device_limit_audit_log WHERE user_id = $1 OR admin_id = $1', [id]);
            // 2. Delete usage logs
            await (0, connection_1.query)('DELETE FROM usage_logs WHERE user_id = $1', [id]);
            // 3. Delete tasks
            await (0, connection_1.query)('DELETE FROM tasks WHERE user_id = $1', [id]);
            // 4. Delete API key devices
            await (0, connection_1.query)('DELETE FROM api_key_devices WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)', [id]);
            // 5. Delete API keys
            await (0, connection_1.query)('DELETE FROM api_keys WHERE user_id = $1', [id]);
            // 6. Delete subscriptions
            await (0, connection_1.query)('DELETE FROM subscriptions WHERE user_id = $1', [id]);
            // 7. Finally, delete the user
            await (0, connection_1.query)('DELETE FROM users WHERE id = $1', [id]);
            res.json({
                message: 'User permanently deleted',
                deleted: true,
                hard: true
            });
        }
        else {
            // SOFT DELETE - Block the user
            console.log(`🚫 Soft deleting (blocking) user ${user.email} (ID: ${id})`);
            await (0, connection_1.query)('UPDATE users SET is_blocked = true WHERE id = $1', [id]);
            // Revoke all API keys
            await (0, connection_1.query)('UPDATE api_keys SET revoked = true WHERE user_id = $1', [id]);
            // Delete all devices
            await (0, connection_1.query)('DELETE FROM api_key_devices WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)', [id]);
            res.json({
                message: 'User disabled successfully',
                deleted: false,
                blocked: true
            });
        }
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map