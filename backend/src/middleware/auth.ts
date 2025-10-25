import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';

// Extend Express Request type to include JWT user
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
    }
  }
}

/**
 * Authentication middleware - Verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware - Does not fail if no token provided
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = verifyToken(token);

      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};

