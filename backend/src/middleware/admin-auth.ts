import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';

interface JWTPayload {
  id: string;
  email: string;
}

/**
 * Middleware to verify admin access
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;

    // 🐛 DEBUG: Log the userId from JWT
    console.log('🔍 Admin middleware - userId from JWT:', decoded.id);

    // Check if user is admin
    const result = await query(
      'SELECT id, email, is_admin, is_blocked FROM users WHERE id = $1',
      [decoded.id]
    );

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
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

