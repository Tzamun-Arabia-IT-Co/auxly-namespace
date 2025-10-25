import { Router, Request, Response } from 'express';
import { getTrialInfo, initializeTrial, upgradeTrial } from '../services/trial.service';
import { authenticateApiKey } from '../middleware/api-key';

const router = Router();

/**
 * POST /trial/verify
 * Verify trial status for a user (requires API key)
 */
router.post('/verify', authenticateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const trialInfo = await getTrialInfo(req.user.id);

    if (!trialInfo) {
      res.status(404).json({ error: 'Trial not found' });
      return;
    }

    res.status(200).json({
      trial_start: trialInfo.trial_start ? trialInfo.trial_start.toISOString() : null,
      trial_end: trialInfo.trial_end ? trialInfo.trial_end.toISOString() : null,
      status: trialInfo.trial_status,
      days_remaining: trialInfo.days_remaining,
    });
  } catch (error) {
    console.error('Trial verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /trial/start
 * Initialize trial for a new user (requires API key)
 */
router.post('/start', authenticateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if trial already exists
    const existing = await getTrialInfo(req.user.id);
    if (existing) {
      res.status(200).json({
        message: 'Trial already exists',
        trial_start: existing.trial_start ? existing.trial_start.toISOString() : null,
        trial_end: existing.trial_end ? existing.trial_end.toISOString() : null,
        status: existing.trial_status,
        days_remaining: existing.days_remaining,
      });
      return;
    }

    const trialInfo = await initializeTrial(req.user.id);

    res.status(201).json({
      message: 'Trial initialized successfully',
      trial_start: trialInfo.trial_start ? trialInfo.trial_start.toISOString() : null,
      trial_end: trialInfo.trial_end ? trialInfo.trial_end.toISOString() : null,
      status: trialInfo.trial_status,
      days_remaining: trialInfo.days_remaining,
    });
  } catch (error) {
    console.error('Trial start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /trial/upgrade
 * Upgrade trial to paid plan (requires API key)
 */
router.post('/upgrade', authenticateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await upgradeTrial(req.user.id);

    res.status(200).json({
      message: 'Trial upgraded successfully',
    });
  } catch (error) {
    console.error('Trial upgrade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

