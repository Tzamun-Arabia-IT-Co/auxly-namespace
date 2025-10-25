"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../db/connection");
/**
 * Middleware to verify admin access
 */
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // 🐛 DEBUG: Log the userId from JWT
        console.log('🔍 Admin middleware - userId from JWT:', decoded.id);
        // Check if user is admin
        const result = await (0, connection_1.query)('SELECT id, email, is_admin, is_blocked FROM users WHERE id = $1', [decoded.id]);
        // 🐛 DEBUG: Log query result
        console.log('🔍 Admin middleware - Query result rows:', result.rows.length);
        if (result.rows.length > 0) {
            console.log('🔍 Admin middleware - User found:', result.rows[0]);
        }
        if (result.rows.length === 0) {
            console.log('❌ Admin middleware - User not found in database! userId:', decoded.id);
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const user = result.rows[0];
        if (user.is_blocked) {
            res.status(403).json({ error: 'User is blocked' });
            return;
        }
        if (!user.is_admin) {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=admin-auth.js.map