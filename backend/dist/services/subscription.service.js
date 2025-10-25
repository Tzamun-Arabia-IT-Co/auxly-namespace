"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageLimits = exports.hasFeatureAccess = exports.cancelSubscription = exports.updateSubscriptionFromStripe = exports.getUserSubscription = void 0;
const connection_1 = require("../db/connection");
const subscription_tiers_1 = require("../config/subscription-tiers");
/**
 * Get user's subscription status
 */
const getUserSubscription = async (userId) => {
    try {
        const result = await (0, connection_1.query)('SELECT plan_tier, status, current_period_end FROM subscriptions WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            // No subscription found, return free tier
            const freeConfig = (0, subscription_tiers_1.getTierConfig)('free');
            return {
                plan_tier: 'free',
                status: 'active',
                features: freeConfig.features,
            };
        }
        const subscription = result.rows[0];
        const tierConfig = (0, subscription_tiers_1.getTierConfig)(subscription.plan_tier);
        return {
            plan_tier: subscription.plan_tier,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            features: tierConfig.features,
        };
    }
    catch (error) {
        console.error('Get subscription error:', error);
        // Return free tier on error
        const freeConfig = (0, subscription_tiers_1.getTierConfig)('free');
        return {
            plan_tier: 'free',
            status: 'active',
            features: freeConfig.features,
        };
    }
};
exports.getUserSubscription = getUserSubscription;
/**
 * Update subscription from Stripe webhook data
 */
const updateSubscriptionFromStripe = async (stripeSubscriptionId, data) => {
    try {
        return await (0, connection_1.transaction)(async (client) => {
            // Find user by stripe_customer_id
            const userResult = await client.query('SELECT id FROM users WHERE id = (SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1 LIMIT 1)', [data.customer_id]);
            let userId;
            if (userResult.rows.length === 0) {
                // Customer not found - this shouldn't happen in normal flow
                console.error('Customer not found for Stripe customer:', data.customer_id);
                return { success: false, error: 'Customer not found' };
            }
            userId = userResult.rows[0].id;
            // Update or insert subscription
            await client.query(`INSERT INTO subscriptions (user_id, plan_tier, status, stripe_subscription_id, stripe_customer_id, current_period_end)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (stripe_subscription_id)
         DO UPDATE SET
           plan_tier = EXCLUDED.plan_tier,
           status = EXCLUDED.status,
           current_period_end = EXCLUDED.current_period_end,
           updated_at = NOW()
         RETURNING id`, [
                userId,
                data.plan_tier,
                data.status,
                stripeSubscriptionId,
                data.customer_id,
                data.current_period_end || null,
            ]);
            return { success: true };
        });
    }
    catch (error) {
        console.error('Update subscription error:', error);
        return { success: false, error: 'Failed to update subscription' };
    }
};
exports.updateSubscriptionFromStripe = updateSubscriptionFromStripe;
/**
 * Cancel subscription (mark as canceled)
 */
const cancelSubscription = async (stripeSubscriptionId) => {
    try {
        const result = await (0, connection_1.query)(`UPDATE subscriptions 
       SET status = 'canceled', updated_at = NOW()
       WHERE stripe_subscription_id = $1
       RETURNING id`, [stripeSubscriptionId]);
        if (result.rows.length === 0) {
            return { success: false, error: 'Subscription not found' };
        }
        return { success: true };
    }
    catch (error) {
        console.error('Cancel subscription error:', error);
        return { success: false, error: 'Failed to cancel subscription' };
    }
};
exports.cancelSubscription = cancelSubscription;
/**
 * Check if user has access to a feature
 */
const hasFeatureAccess = async (userId, feature) => {
    const subscription = await (0, exports.getUserSubscription)(userId);
    const features = subscription.features;
    return features[feature] === true || features[feature] === Infinity;
};
exports.hasFeatureAccess = hasFeatureAccess;
/**
 * Get usage limits for user
 */
const getUsageLimits = async (userId) => {
    const subscription = await (0, exports.getUserSubscription)(userId);
    return {
        tasks_per_month: subscription.features.tasks_per_month,
        workspaces: subscription.features.workspaces,
        history_days: subscription.features.history_days,
    };
};
exports.getUsageLimits = getUsageLimits;
//# sourceMappingURL=subscription.service.js.map