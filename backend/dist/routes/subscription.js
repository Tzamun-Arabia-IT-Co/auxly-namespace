"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_service_1 = require("../services/subscription.service");
const auth_1 = require("../middleware/auth");
const subscription_tiers_1 = require("../config/subscription-tiers");
const router = (0, express_1.Router)();
/**
 * GET /subscription/status
 * Get current user's subscription status
 * Protected by JWT authentication
 */
router.get('/status', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const subscription = await (0, subscription_service_1.getUserSubscription)(req.user.id);
        res.status(200).json({
            subscription,
        });
    }
    catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /subscription/limits
 * Get usage limits for current user
 * Protected by JWT authentication
 */
router.get('/limits', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const limits = await (0, subscription_service_1.getUsageLimits)(req.user.id);
        res.status(200).json({
            limits,
        });
    }
    catch (error) {
        console.error('Get subscription limits error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /subscription/tiers
 * Get available subscription tiers (public endpoint)
 */
router.get('/tiers', async (_req, res) => {
    try {
        // Return tier information (without Stripe IDs for security)
        const tiers = Object.entries(subscription_tiers_1.SUBSCRIPTION_TIERS).map(([key, config]) => ({
            id: key,
            name: config.name,
            price: config.price,
            features: config.features,
        }));
        res.status(200).json({
            tiers,
        });
    }
    catch (error) {
        console.error('Get subscription tiers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=subscription.js.map