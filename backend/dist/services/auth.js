"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.loginUser = exports.registerUser = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = exports.validatePassword = exports.validateEmail = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../db/connection");
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password validation (min 8 characters)
const PASSWORD_MIN_LENGTH = 8;
/**
 * Validate email format
 */
const validateEmail = (email) => {
    return EMAIL_REGEX.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Validate password strength
 */
const validatePassword = (password) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
    }
    return { valid: true };
};
exports.validatePassword = validatePassword;
/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
    return await bcrypt_1.default.hash(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
    return await bcrypt_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
/**
 * Generate JWT token
 */
const generateToken = (userId, email) => {
    return jsonwebtoken_1.default.sign({ id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateToken = generateToken;
/**
 * Verify JWT token
 */
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Register new user
 */
const registerUser = async (input) => {
    try {
        const { email, password } = input;
        // Validate email
        if (!(0, exports.validateEmail)(email)) {
            return { success: false, error: 'Invalid email format' };
        }
        // Validate password
        const passwordValidation = (0, exports.validatePassword)(password);
        if (!passwordValidation.valid) {
            return { success: false, error: passwordValidation.error };
        }
        // Check if user already exists
        const existingUser = await (0, connection_1.query)('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return { success: false, error: 'User already exists' };
        }
        // Hash password
        const password_hash = await (0, exports.hashPassword)(password);
        // Create user
        const result = await (0, connection_1.query)('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at', [email.toLowerCase(), password_hash]);
        const user = result.rows[0];
        // Create PRO tier subscription for new user (free PRO plan for everyone!)
        await (0, connection_1.query)('INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)', [user.id, 'pro', 'active']);
        // Generate JWT token
        const token = (0, exports.generateToken)(user.id, user.email);
        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        };
    }
    catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Registration failed' };
    }
};
exports.registerUser = registerUser;
/**
 * Login user
 */
const loginUser = async (input) => {
    try {
        const { email, password } = input;
        // Validate email format
        if (!(0, exports.validateEmail)(email)) {
            return { success: false, error: 'Invalid credentials' };
        }
        // Find user by email
        const result = await (0, connection_1.query)('SELECT id, email, password_hash, created_at FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            // Use generic error message to avoid revealing user existence
            return { success: false, error: 'Invalid credentials' };
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await (0, exports.comparePassword)(password, user.password_hash);
        if (!isValidPassword) {
            return { success: false, error: 'Invalid credentials' };
        }
        // Generate JWT token
        const token = (0, exports.generateToken)(user.id, user.email);
        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        };
    }
    catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
    }
};
exports.loginUser = loginUser;
/**
 * Get user by ID
 */
const getUserById = async (userId) => {
    try {
        const result = await (0, connection_1.query)('SELECT id, email, password_hash, created_at FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Get user error:', error);
        return null;
    }
};
exports.getUserById = getUserById;
//# sourceMappingURL=auth.js.map