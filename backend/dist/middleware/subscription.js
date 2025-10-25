"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = exports.requireTier = exports.attachSubscription = void 0;
const subscription_service_1 = require("../services/subscription.service");
/**
 * Attach subscription info to request
 * Should be used after authentication middleware
 */
const attachSubscription = async (req, _res, next) => {
    try {
        // Get user ID from JWT auth or API key auth
        const userId = req.user?.id || req.apiKeyUser?.user_id;
        if (!userId) {
            // No authentication, continue without subscription
            next();
            return;
        }
        // Get subscription
        const subscription = await (0, subscription_service_1.getUserSubscription)(userId);
        // Attach to request
        req.subscription = subscription;
        next();
    }
    catch (error) {
        console.error('Attach subscription error:', error);
        // Continue even on error (fail gracefully)
        next();
    }
};
exports.attachSubscription = attachSubscription;
/**
 * Require specific subscription tier
 * @param allowedTiers Array of tier names that are allowed
 */
const requireTier = (allowedTiers) => {
    return async (req, res, next) => {
        try {
            if (!req.subscription) {
                // Try to get subscription if not already attached
                const userId = req.user?.id || req.apiKeyUser?.user_id;
                if (userId) {
                    req.subscription = await (0, subscription_service_1.getUserSubscription)(userId);
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
        }
        catch (error) {
            console.error('Require tier error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
exports.requireTier = requireTier;
/**
 * Check if subscription is active
 * Returns 402 Payment Required if subscription is not active
 */
const requireActiveSubscription = async (req, res, next) => {
    try {
        if (!req.subscription) {
            // Try to get subscription if not already attached
            const userId = req.user?.id || req.apiKeyUser?.user_id;
            if (userId) {
                req.subscription = await (0, subscription_service_1.getUserSubscription)(userId);
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
    }
    catch (error) {
        console.error('Require active subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireActiveSubscription = requireActiveSubscription;
//# sourceMappingURL=subscription.js.map