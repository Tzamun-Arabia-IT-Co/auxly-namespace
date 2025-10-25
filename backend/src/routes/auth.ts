import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth';
import { authenticate } from '../middleware/auth';
import { query } from '../db/connection';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for auth routes (prevent brute force attacks)
const authLimiter = rateLimit({
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
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Register user
    const result = await registerUser({ email, password });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'User registered successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Register route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/login
 * Login user and return JWT token
 */
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Login user
    const result = await loginUser({ email, password });

    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /auth/verify
 * Verify JWT token (protected route)
 */
router.get('/verify', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // If we reach here, token is valid (middleware verified it)
    res.status(200).json({
      message: 'Token is valid',
      user: req.user,
    });
  } catch (error) {
    console.error('Verify route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /auth/me
 * Get current user info (protected route)
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch user from database with subscription info
    const result = await query(
      `SELECT u.id, u.email, u.created_at, u.is_admin, u.is_blocked, u.max_devices,
              s.plan_tier, s.status as subscription_status
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.id = $1`,
      [req.user!.id]
    );

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
  } catch (error) {
    console.error('Me route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


