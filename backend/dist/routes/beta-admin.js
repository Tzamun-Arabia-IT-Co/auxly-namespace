"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const connection_1 = require("../db/connection");
const key_generator_1 = require("../utils/key-generator");
const router = express_1.default.Router();
/**
 * Middleware: Basic Auth for Admin
 */
const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return res.status(401).json({ error: 'Admin authentication required' });
        }
        const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
        const [username, password] = credentials.split(':');
        if (!username || !password) {
            return res.status(401).json({ error: 'Invalid credentials format' });
        }
        // Find admin
        const result = await connection_1.pool.query('SELECT id, username, password_hash FROM beta_admins WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        const admin = result.rows[0];
        // Verify password
        const validPassword = await bcrypt_1.default.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        // Update last login
        await connection_1.pool.query('UPDATE beta_admins SET last_login = NOW() WHERE id = $1', [admin.id]);
        // Attach admin to request
        req.admin = { id: admin.id, username: admin.username };
        return next();
    }
    catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
/**
 * GET /api/beta/admin/users
 * List all beta users
 */
router.get('/users', adminAuth, async (_req, res) => {
    try {
        const result = await connection_1.pool.query(`SELECT id, username, email, api_key, is_active, created_at, last_login, created_by, notes
       FROM beta_users
       ORDER BY created_at DESC`);
        res.json(result.rows);
    }
    catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/beta/admin/create-user
 * Create a new beta user
 */
router.post('/create-user', adminAuth, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const admin = req.admin;
        // Validation
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        if (username.length < 3) {
            res.status(400).json({ error: 'Username must be at least 3 characters' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }
        // Check if username already exists
        const existing = await connection_1.pool.query('SELECT id FROM beta_users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'Username already exists' });
            return;
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Generate API key
        const apiKey = (0, key_generator_1.generateApiKey)();
        // Insert user
        const result = await connection_1.pool.query(`INSERT INTO beta_users (username, password_hash, email, api_key, is_active, created_by)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id, username, email, api_key, is_active, created_at`, [username, passwordHash, email || null, apiKey, admin.username]);
        const user = result.rows[0];
        res.status(201).json({
            message: 'Beta user created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                api_key: user.api_key,
                is_active: user.is_active,
                created_at: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * PATCH /api/beta/admin/users/:id/toggle
 * Toggle user active status
 */
router.patch('/users/:id/toggle', adminAuth, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            res.status(400).json({ error: 'Invalid user ID' });
            return;
        }
        // Toggle status
        const result = await connection_1.pool.query(`UPDATE beta_users
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, username, is_active`, [userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            message: 'User status updated',
            user: result.rows[0]
        });
    }
    catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * DELETE /api/beta/admin/users/:id
 * Delete a beta user
 */
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            res.status(400).json({ error: 'Invalid user ID' });
            return;
        }
        const result = await connection_1.pool.query('DELETE FROM beta_users WHERE id = $1 RETURNING username', [userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            message: 'User deleted successfully',
            username: result.rows[0].username
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/beta/admin/stats
 * Get beta program statistics
 */
router.get('/stats', adminAuth, async (_req, res) => {
    try {
        const result = await connection_1.pool.query('SELECT * FROM beta_user_stats');
        res.json(result.rows[0] || {});
    }
    catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=beta-admin.js.map