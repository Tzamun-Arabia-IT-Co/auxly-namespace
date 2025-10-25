"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWebhookEvent = exports.handlePaymentSucceeded = exports.handlePaymentFailed = exports.handleSubscriptionDeleted = exports.handleSubscriptionUpdated = exports.handleSubscriptionCreated = exports.verifyWebhookSignature = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const subscription_service_1 = require("./subscription.service");
const subscription_tiers_1 = require("../config/subscription-tiers");
// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';
if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not set - using dummy key (Stripe features will not work)');
}
exports.stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
});
// Webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
/**
 * Verify Stripe webhook signature
 */
const verifyWebhookSignature = (payload, signature) => {
    try {
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not configured');
            return null;
        }
        const event = exports.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return event;
    }
    catch (error) {
        console.error('Webhook signature verification failed:', error);
        return null;
    }
};
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Map Stripe subscription status to database status
 */
const mapStripeStatus = (stripeStatus) => {
    const statusMap = {
        active: 'active',
        canceled: 'canceled',
        past_due: 'past_due',
        trialing: 'trialing',
        incomplete: 'past_due',
        incomplete_expired: 'canceled',
        unpaid: 'past_due',
    };
    return statusMap[stripeStatus] || 'active';
};
/**
 * Process subscription.created event
 */
const handleSubscriptionCreated = async (subscription) => {
    console.log('Processing subscription.created:', subscription.id);
    try {
        // Get price ID and map to tier
        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
            console.error('No price ID found in subscription');
            return;
        }
        const planTier = (0, subscription_tiers_1.getPlanTierFromPriceId)(priceId);
        if (!planTier) {
            console.error('Unknown price ID:', priceId);
            return;
        }
        // Use type assertion for current_period_end
        const subscriptionData = subscription;
        const currentPeriodEnd = subscriptionData.current_period_end
            ? new Date(subscriptionData.current_period_end * 1000)
            : undefined;
        const result = await (0, subscription_service_1.updateSubscriptionFromStripe)(subscription.id, {
            customer_id: subscription.customer,
            plan_tier: planTier,
            status: mapStripeStatus(subscription.status),
            current_period_end: currentPeriodEnd,
        });
        if (result.success) {
            console.log('✅ Subscription created successfully');
        }
        else {
            console.error('❌ Failed to create subscription:', result.error);
        }
    }
    catch (error) {
        console.error('Error handling subscription.created:', error);
    }
};
exports.handleSubscriptionCreated = handleSubscriptionCreated;
/**
 * Process subscription.updated event
 */
const handleSubscriptionUpdated = async (subscription) => {
    console.log('Processing subscription.updated:', subscription.id);
    try {
        // Get price ID and map to tier
        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
            console.error('No price ID found in subscription');
            return;
        }
        const planTier = (0, subscription_tiers_1.getPlanTierFromPriceId)(priceId);
        if (!planTier) {
            console.error('Unknown price ID:', priceId);
            return;
        }
        // Use type assertion for current_period_end
        const subscriptionData = subscription;
        const currentPeriodEnd = subscriptionData.current_period_end
            ? new Date(subscriptionData.current_period_end * 1000)
            : undefined;
        const result = await (0, subscription_service_1.updateSubscriptionFromStripe)(subscription.id, {
            customer_id: subscription.customer,
            plan_tier: planTier,
            status: mapStripeStatus(subscription.status),
            current_period_end: currentPeriodEnd,
        });
        if (result.success) {
            console.log('✅ Subscription updated successfully');
        }
        else {
            console.error('❌ Failed to update subscription:', result.error);
        }
    }
    catch (error) {
        console.error('Error handling subscription.updated:', error);
    }
};
exports.handleSubscriptionUpdated = handleSubscriptionUpdated;
/**
 * Process subscription.deleted event
 */
const handleSubscriptionDeleted = async (subscription) => {
    console.log('Processing subscription.deleted:', subscription.id);
    try {
        const result = await (0, subscription_service_1.cancelSubscription)(subscription.id);
        if (result.success) {
            console.log('✅ Subscription canceled successfully');
        }
        else {
            console.error('❌ Failed to cancel subscription:', result.error);
        }
    }
    catch (error) {
        console.error('Error handling subscription.deleted:', error);
    }
};
exports.handleSubscriptionDeleted = handleSubscriptionDeleted;
/**
 * Process invoice.payment_failed event
 */
const handlePaymentFailed = async (invoice) => {
    console.log('Processing invoice.payment_failed:', invoice.id);
    try {
        // Use type assertion to access subscription property
        const invoiceData = invoice;
        const subscriptionId = invoiceData.subscription;
        if (!subscriptionId) {
            console.log('Invoice not associated with subscription');
            return;
        }
        // Update subscription status to past_due
        const result = await (0, subscription_service_1.updateSubscriptionFromStripe)(typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id, {
            customer_id: invoice.customer,
            plan_tier: 'pro', // Will be updated from actual subscription
            status: 'past_due',
        });
        if (result.success) {
            console.log('✅ Subscription marked as past_due');
        }
        else {
            console.error('❌ Failed to update subscription status:', result.error);
        }
    }
    catch (error) {
        console.error('Error handling invoice.payment_failed:', error);
    }
};
exports.handlePaymentFailed = handlePaymentFailed;
/**
 * Process invoice.payment_succeeded event
 */
const handlePaymentSucceeded = async (invoice) => {
    console.log('Processing invoice.payment_succeeded:', invoice.id);
    try {
        // Use type assertion to access subscription property
        const invoiceData = invoice;
        const subscriptionId = invoiceData.subscription;
        if (!subscriptionId) {
            console.log('Invoice not associated with subscription');
            return;
        }
        // Fetch full subscription to get latest status
        const subscription = await exports.stripe.subscriptions.retrieve(typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id);
        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
            console.error('No price ID found in subscription');
            return;
        }
        const planTier = (0, subscription_tiers_1.getPlanTierFromPriceId)(priceId);
        if (!planTier) {
            console.error('Unknown price ID:', priceId);
            return;
        }
        // Use type assertion for current_period_end
        const subscriptionData = subscription;
        const currentPeriodEnd = subscriptionData.current_period_end
            ? new Date(subscriptionData.current_period_end * 1000)
            : undefined;
        const result = await (0, subscription_service_1.updateSubscriptionFromStripe)(subscription.id, {
            customer_id: subscription.customer,
            plan_tier: planTier,
            status: mapStripeStatus(subscription.status),
            current_period_end: currentPeriodEnd,
        });
        if (result.success) {
            console.log('✅ Subscription reactivated after payment');
        }
        else {
            console.error('❌ Failed to reactivate subscription:', result.error);
        }
    }
    catch (error) {
        console.error('Error handling invoice.payment_succeeded:', error);
    }
};
exports.handlePaymentSucceeded = handlePaymentSucceeded;
/**
 * Process webhook event based on type
 */
const processWebhookEvent = async (event) => {
    console.log(`📨 Processing webhook event: ${event.type}`);
    try {
        switch (event.type) {
            case 'customer.subscription.created':
                await (0, exports.handleSubscriptionCreated)(event.data.object);
                break;
            case 'customer.subscription.updated':
                await (0, exports.handleSubscriptionUpdated)(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await (0, exports.handleSubscriptionDeleted)(event.data.object);
                break;
            case 'invoice.payment_failed':
                await (0, exports.handlePaymentFailed)(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await (0, exports.handlePaymentSucceeded)(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }
    catch (error) {
        console.error(`Error processing event ${event.type}:`, error);
        throw error;
    }
};
exports.processWebhookEvent = processWebhookEvent;
//# sourceMappingURL=stripe.service.js.map