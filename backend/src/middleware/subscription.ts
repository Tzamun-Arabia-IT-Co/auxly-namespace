import { Request, Response, NextFunction } from 'express';
import { getUserSubscription } from '../services/subscription.service';

// Extend Express Request to include subscription info
declare global {
  namespace Express {
    interface Request {
      subscription?: {
        plan_tier: string;
        status: string;
        features: {
          tasks_per_month: number;
          workspaces: number;
          history_days: number;
          team_features?: boolean;
          priority_support?: boolean;
        };
      };
    }
  }
}

/**
 * Attach subscription info to request
 * Should be used after authentication middleware
 */
export const attachSubscription = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from JWT auth or API key auth
    const userId = req.user?.id || req.apiKeyUser?.user_id;

    if (!userId) {
      // No authentication, continue without subscription
      next();
      return;
    }

    // Get subscription
    const subscription = await getUserSubscription(userId);

    // Attach to request
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error('Attach subscription error:', error);
    // Continue even on error (fail gracefully)
    next();
  }
};

/**
 * Require specific subscription tier
 * @param allowedTiers Array of tier names that are allowed
 */
export const requireTier = (allowedTiers: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.subscription) {
        // Try to get subscription if not already attached
        const userId = req.user?.id || req.apiKeyUser?.user_id;
        if (userId) {
          req.subscription = await getUserSubscription(userId);
        }
      }

      if (!req.subscription) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user's tier is in allowed tiers
      if (!allowedTiers.includes(req.subscription.plan_tier)) {
        res.status(403).json({
          error: 'Upgrade required',
          message: `This feature requires ${allowedTiers.join(' or ')} plan`,
          current_tier: req.subscription.plan_tier,
          required_tiers: allowedTiers,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Require tier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Check if subscription is active
 * Returns 402 Payment Required if subscription is not active
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.subscription) {
      // Try to get subscription if not already attached
      const userId = req.user?.id || req.apiKeyUser?.user_id;
      if (userId) {
        req.subscription = await getUserSubscription(userId);
      }
    }

    if (!req.subscription) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if subscription is active
    if (req.subscription.status !== 'active' && req.subscription.status !== 'trialing') {
      res.status(402).json({
        error: 'Payment required',
        message: 'Your subscription is not active',
        status: req.subscription.status,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Require active subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

