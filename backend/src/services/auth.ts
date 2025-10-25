import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import { User } from '../types/database';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation (min 8 characters)
const PASSWORD_MIN_LENGTH = 8;

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    email: string;
    created_at: Date;
  };
  error?: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  return { valid: true };
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: number, email: string): string => {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): { id: number; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Register new user
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  try {
    const { email, password } = input;

    // Validate email
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return { success: false, error: 'User already exists' };
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];

    // Create PRO tier subscription for new user (free PRO plan for everyone!)
    await query(
      'INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)',
      [user.id, 'pro', 'active']
    );

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
};

/**
 * Login user
 */
export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    const { email, password } = input;

    // Validate email format
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Find user by email
    const result = await query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Use generic error message to avoid revealing user existence
      return { success: false, error: 'Invalid credentials' };
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: number): Promise<User | null> => {
  try {
    const result = await query(
      'SELECT id, email, password_hash, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

