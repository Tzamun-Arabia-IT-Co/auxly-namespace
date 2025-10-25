"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const auth_1 = require("../services/auth");
/**
 * Authentication middleware - Verifies JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        // Verify token
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        // Attach user info to request
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication middleware - Does not fail if no token provided
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = (0, auth_1.verifyToken)(token);
            if (decoded) {
                req.user = decoded;
            }
        }
        next();
    }
    catch (error) {
        console.error('Optional authentication error:', error);
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.js.map