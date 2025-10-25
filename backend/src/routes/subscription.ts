import { Router, Request, Response } from 'express';
import { getUserSubscription, getUsageLimits } from '../services/subscription.service';
import { authenticate } from '../middleware/auth';
import { SUBSCRIPTION_TIERS } from '../config/subscription-tiers';

const router = Router();

/**
 * GET /subscription/status
 * Get current user's subscription status
 * Protected by JWT authentication
 */
router.get('/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const subscription = await getUserSubscription(req.user.id);

    res.status(200).json({
      subscription,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /subscription/limits
 * Get usage limits for current user
 * Protected by JWT authentication
 */
router.get('/limits', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limits = await getUsageLimits(req.user.id);

    res.status(200).json({
      limits,
    });
  } catch (error) {
    console.error('Get subscription limits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /subscription/tiers
 * Get available subscription tiers (public endpoint)
 */
router.get('/tiers', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Return tier information (without Stripe IDs for security)
    const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([key, config]) => ({
      id: key,
      name: config.name,
      price: config.price,
      features: config.features,
    }));

    res.status(200).json({
      tiers,
    });
  } catch (error) {
    console.error('Get subscription tiers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

