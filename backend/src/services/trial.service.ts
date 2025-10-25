import { query } from '../db/connection';

export interface TrialInfo {
  trial_start: Date | null;
  trial_end: Date | null;
  trial_status: 'active' | 'expired' | 'upgraded';
  days_remaining: number;
}

/**
 * Get trial information for a user
 */
export async function getTrialInfo(userId: number): Promise<TrialInfo | null> {
  try {
    const result = await query(
      `SELECT trial_start, trial_end, trial_status 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    
    if (!user.trial_start || !user.trial_end) {
      return null;
    }

    const endDate = new Date(user.trial_end);
    const now = new Date();
    const msRemaining = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    // Auto-expire if needed
    if (daysRemaining <= 0 && user.trial_status === 'active') {
      await query(
        `UPDATE users SET trial_status = 'expired' WHERE id = $1`,
        [userId]
      );
      user.trial_status = 'expired';
    }

    return {
      trial_start: new Date(user.trial_start),
      trial_end: endDate,
      trial_status: user.trial_status,
      days_remaining: Math.max(0, daysRemaining),
    };
  } catch (error) {
    console.error('Get trial info error:', error);
    throw error;
  }
}

/**
 * Initialize trial for a new user
 */
export async function initializeTrial(userId: number): Promise<TrialInfo> {
  try {
    // Check if trial already exists
    const existing = await query(
      `SELECT trial_start FROM users WHERE id = $1`,
      [userId]
    );

    if (existing.rows[0]?.trial_start) {
      throw new Error('Trial already initialized');
    }

    // Create 30-day trial
    const result = await query(
      `UPDATE users 
       SET 
         trial_start = NOW(),
         trial_end = NOW() + INTERVAL '30 days',
         trial_status = 'active'
       WHERE id = $1
       RETURNING trial_start, trial_end, trial_status`,
      [userId]
    );

    const trial = result.rows[0];

    return {
      trial_start: new Date(trial.trial_start),
      trial_end: new Date(trial.trial_end),
      trial_status: trial.trial_status,
      days_remaining: 30,
    };
  } catch (error) {
    console.error('Initialize trial error:', error);
    throw error;
  }
}

/**
 * Upgrade trial to paid plan
 */
export async function upgradeTrial(userId: number): Promise<void> {
  try {
    await query(
      `UPDATE users SET trial_status = 'upgraded' WHERE id = $1`,
      [userId]
    );
    console.log(`✅ Trial upgraded for user ${userId}`);
  } catch (error) {
    console.error('Upgrade trial error:', error);
    throw error;
  }
}

/**
 * Check if user has valid access (trial active OR subscription active)
 */
export async function hasValidAccess(userId: number): Promise<boolean> {
  try {
    const trialInfo = await getTrialInfo(userId);
    
    if (!trialInfo) {
      return false;
    }

    // Check subscription status
    const subscription = await query(
      `SELECT plan_tier, status FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    if (subscription.rows.length > 0) {
      const sub = subscription.rows[0];
      if (sub.plan_tier !== 'free' && sub.status === 'active') {
        return true; // Has active paid subscription
      }
    }

    // Check trial status
    return trialInfo.trial_status === 'active' && trialInfo.days_remaining > 0;
  } catch (error) {
    console.error('Check valid access error:', error);
    return false;
  }
}

