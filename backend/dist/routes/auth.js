"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../services/auth");
const auth_2 = require("../middleware/auth");
const connection_1 = require("../db/connection");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiter for auth routes (prevent brute force attacks)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // Register user
        const result = await (0, auth_1.registerUser)({ email, password });
        if (!result.success) {
            res.status(400).json({ error: result.error });
            return;
        }
        res.status(201).json({
            message: 'User registered successfully',
            token: result.token,
            user: result.user,
        });
    }
    catch (error) {
        console.error('Register route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /auth/login
 * Login user and return JWT token
 */
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // Login user
        const result = await (0, auth_1.loginUser)({ email, password });
        if (!result.success) {
            res.status(401).json({ error: result.error });
            return;
        }
        res.status(200).json({
            message: 'Login successful',
            token: result.token,
            user: result.user,
        });
    }
    catch (error) {
        console.error('Login route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /auth/verify
 * Verify JWT token (protected route)
 */
router.get('/verify', auth_2.authenticate, async (req, res) => {
    try {
        // If we reach here, token is valid (middleware verified it)
        res.status(200).json({
            message: 'Token is valid',
            user: req.user,
        });
    }
    catch (error) {
        console.error('Verify route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /auth/me
 * Get current user info (protected route)
 */
router.get('/me', auth_2.authenticate, async (req, res) => {
    try {
        // Fetch user from database with subscription info
        const result = await (0, connection_1.query)(`SELECT u.id, u.email, u.created_at, u.is_admin, u.is_blocked, u.max_devices,
              s.plan_tier, s.status as subscription_status
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.id = $1`, [req.user.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const user = result.rows[0];
        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                is_admin: user.is_admin || false,
                max_devices: user.max_devices || 2,
                is_blocked: user.is_blocked || false,
                plan_tier: user.plan_tier || 'free',
                subscription_status: user.subscription_status || 'inactive'
            },
        });
    }
    catch (error) {
        console.error('Me route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map