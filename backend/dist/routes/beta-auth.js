"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const connection_1 = require("../db/connection");
const router = express_1.default.Router();
/**
 * POST /api/beta/login
 * Beta user login endpoint
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        // Find user
        const result = await connection_1.pool.query('SELECT id, username, password_hash, email, api_key, is_active, created_at FROM beta_users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const user = result.rows[0];
        // Check if user is active
        if (!user.is_active) {
            res.status(403).json({ error: 'Account is deactivated' });
            return;
        }
        // Verify password
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Update last login
        await connection_1.pool.query('UPDATE beta_users SET last_login = NOW() WHERE id = $1', [user.id]);
        // Return user data and API key
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            },
            api_key: user.api_key
        });
    }
    catch (error) {
        console.error('Beta login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/beta/verify
 * Verify API key validity
 */
router.post('/verify', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({ error: 'API key required' });
            return;
        }
        const result = await connection_1.pool.query('SELECT id, username, email, is_active FROM beta_users WHERE api_key = $1', [apiKey]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }
        const user = result.rows[0];
        if (!user.is_active) {
            res.status(403).json({ error: 'Account is deactivated' });
            return;
        }
        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error('API key verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=beta-auth.js.map