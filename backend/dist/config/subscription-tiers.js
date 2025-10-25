"use strict";
// Subscription tier configuration for Auxly
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTierConfig = exports.getPlanTierFromPriceId = exports.SUBSCRIPTION_TIERS = void 0;
exports.SUBSCRIPTION_TIERS = {
    free: {
        name: 'Free',
        price: 0,
        features: {
            tasks_per_month: 50,
            workspaces: 1,
            history_days: 7,
        },
    },
    pro: {
        name: 'Pro',
        price: 9,
        stripe_price_id: process.env.STRIPE_PRICE_PRO,
        features: {
            tasks_per_month: Infinity,
            workspaces: Infinity,
            history_days: 30,
            priority_support: true,
        },
    },
    team: {
        name: 'Team',
        price: 29,
        stripe_price_id: process.env.STRIPE_PRICE_TEAM,
        features: {
            tasks_per_month: Infinity,
            workspaces: Infinity,
            history_days: Infinity,
            team_features: true,
            priority_support: true,
        },
    },
};
// Map Stripe price IDs to internal tier names
const getPlanTierFromPriceId = (priceId) => {
    for (const [tier, config] of Object.entries(exports.SUBSCRIPTION_TIERS)) {
        if (config.stripe_price_id === priceId) {
            return tier;
        }
    }
    return null;
};
exports.getPlanTierFromPriceId = getPlanTierFromPriceId;
// Get tier configuration
const getTierConfig = (tier) => {
    return exports.SUBSCRIPTION_TIERS[tier] || exports.SUBSCRIPTION_TIERS.free;
};
exports.getTierConfig = getTierConfig;
//# sourceMappingURL=subscription-tiers.js.map