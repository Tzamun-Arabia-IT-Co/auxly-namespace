"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = require("../db/connection");
const admin_auth_1 = require("../middleware/admin-auth");
const router = (0, express_1.Router)();
// All settings routes require admin authentication
router.use(admin_auth_1.requireAdmin);
/**
 * GET /api/settings
 * Get all system settings
 */
router.get('/', async (_req, res) => {
    try {
        const result = await (0, connection_1.query)('SELECT * FROM system_settings ORDER BY setting_key');
        // Convert to key-value object for easier frontend consumption
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = {
                value: row.setting_value,
                description: row.description,
                updated_at: row.updated_at
            };
        });
        res.json({ settings });
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
/**
 * GET /api/settings/:key
 * Get a specific setting by key
 */
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const result = await (0, connection_1.query)('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Setting not found' });
            return;
        }
        res.json({ setting: result.rows[0] });
    }
    catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ error: 'Failed to fetch setting' });
    }
});
/**
 * PUT /api/settings/:key
 * Update a specific setting
 */
router.put('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const adminUser = req.user;
        if (value === undefined || value === null) {
            res.status(400).json({ error: 'Value is required' });
            return;
        }
        // Check if setting exists
        const existingResult = await (0, connection_1.query)('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
        if (existingResult.rows.length === 0) {
            res.status(404).json({ error: 'Setting not found' });
            return;
        }
        // Update the setting
        const result = await (0, connection_1.query)('UPDATE system_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE setting_key = $3 RETURNING *', [value.toString(), adminUser.id, key]);
        console.log(`⚙️ Setting updated: ${key} = ${value} (by admin ${adminUser.id})`);
        res.json({
            message: 'Setting updated successfully',
            setting: result.rows[0]
        });
    }
    catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});
/**
 * POST /api/settings/bulk-update
 * Update multiple settings at once
 */
router.post('/bulk-update', async (req, res) => {
    try {
        const { settings } = req.body;
        const adminUser = req.user;
        if (!settings || typeof settings !== 'object') {
            res.status(400).json({ error: 'Settings object is required' });
            return;
        }
        const updates = [];
        for (const [key, value] of Object.entries(settings)) {
            const result = await (0, connection_1.query)('UPDATE system_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE setting_key = $3 RETURNING *', [String(value), adminUser.id, key]);
            if (result.rows.length > 0) {
                updates.push(result.rows[0]);
                console.log(`⚙️ Setting updated: ${key} = ${value} (by admin ${adminUser.id})`);
            }
        }
        res.json({
            message: `${updates.length} settings updated successfully`,
            settings: updates
        });
    }
    catch (error) {
        console.error('Error bulk updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map