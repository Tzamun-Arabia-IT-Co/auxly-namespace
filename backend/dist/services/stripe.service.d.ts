import Stripe from 'stripe';
export declare const stripe: Stripe;
/**
 * Verify Stripe webhook signature
 */
export declare const verifyWebhookSignature: (payload: string | Buffer, signature: string) => Stripe.Event | null;
/**
 * Process subscription.created event
 */
export declare const handleSubscriptionCreated: (subscription: Stripe.Subscription) => Promise<void>;
/**
 * Process subscription.updated event
 */
export declare const handleSubscriptionUpdated: (subscription: Stripe.Subscription) => Promise<void>;
/**
 * Process subscription.deleted event
 */
export declare const handleSubscriptionDeleted: (subscription: Stripe.Subscription) => Promise<void>;
/**
 * Process invoice.payment_failed event
 */
export declare const handlePaymentFailed: (invoice: Stripe.Invoice) => Promise<void>;
/**
 * Process invoice.payment_succeeded event
 */
export declare const handlePaymentSucceeded: (invoice: Stripe.Invoice) => Promise<void>;
/**
 * Process webhook event based on type
 */
export declare const processWebhookEvent: (event: Stripe.Event) => Promise<void>;
//# sourceMappingURL=stripe.service.d.ts.map