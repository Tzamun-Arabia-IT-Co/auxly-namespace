import Stripe from 'stripe';
import { updateSubscriptionFromStripe, cancelSubscription } from './subscription.service';
import { getPlanTierFromPriceId } from '../config/subscription-tiers';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set - using dummy key (Stripe features will not work)');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

// Webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Verify Stripe webhook signature
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): Stripe.Event | null => {
  try {
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return null;
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
};

/**
 * Map Stripe subscription status to database status
 */
const mapStripeStatus = (stripeStatus: string): string => {
  const statusMap: Record<string, string> = {
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
export const handleSubscriptionCreated = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  console.log('Processing subscription.created:', subscription.id);

  try {
    // Get price ID and map to tier
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    const planTier = getPlanTierFromPriceId(priceId);
    if (!planTier) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Use type assertion for current_period_end
    const subscriptionData = subscription as any;
    const currentPeriodEnd = subscriptionData.current_period_end
      ? new Date(subscriptionData.current_period_end * 1000)
      : undefined;

    const result = await updateSubscriptionFromStripe(subscription.id, {
      customer_id: subscription.customer as string,
      plan_tier: planTier,
      status: mapStripeStatus(subscription.status),
      current_period_end: currentPeriodEnd,
    });

    if (result.success) {
      console.log('✅ Subscription created successfully');
    } else {
      console.error('❌ Failed to create subscription:', result.error);
    }
  } catch (error) {
    console.error('Error handling subscription.created:', error);
  }
};

/**
 * Process subscription.updated event
 */
export const handleSubscriptionUpdated = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  console.log('Processing subscription.updated:', subscription.id);

  try {
    // Get price ID and map to tier
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    const planTier = getPlanTierFromPriceId(priceId);
    if (!planTier) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Use type assertion for current_period_end
    const subscriptionData = subscription as any;
    const currentPeriodEnd = subscriptionData.current_period_end
      ? new Date(subscriptionData.current_period_end * 1000)
      : undefined;

    const result = await updateSubscriptionFromStripe(subscription.id, {
      customer_id: subscription.customer as string,
      plan_tier: planTier,
      status: mapStripeStatus(subscription.status),
      current_period_end: currentPeriodEnd,
    });

    if (result.success) {
      console.log('✅ Subscription updated successfully');
    } else {
      console.error('❌ Failed to update subscription:', result.error);
    }
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
  }
};

/**
 * Process subscription.deleted event
 */
export const handleSubscriptionDeleted = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  console.log('Processing subscription.deleted:', subscription.id);

  try {
    const result = await cancelSubscription(subscription.id);

    if (result.success) {
      console.log('✅ Subscription canceled successfully');
    } else {
      console.error('❌ Failed to cancel subscription:', result.error);
    }
  } catch (error) {
    console.error('Error handling subscription.deleted:', error);
  }
};

/**
 * Process invoice.payment_failed event
 */
export const handlePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log('Processing invoice.payment_failed:', invoice.id);

  try {
    // Use type assertion to access subscription property
    const invoiceData = invoice as any;
    const subscriptionId = invoiceData.subscription;
    
    if (!subscriptionId) {
      console.log('Invoice not associated with subscription');
      return;
    }

    // Update subscription status to past_due
    const result = await updateSubscriptionFromStripe(
      typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id,
      {
        customer_id: invoice.customer as string,
        plan_tier: 'pro', // Will be updated from actual subscription
        status: 'past_due',
      }
    );

    if (result.success) {
      console.log('✅ Subscription marked as past_due');
    } else {
      console.error('❌ Failed to update subscription status:', result.error);
    }
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
  }
};

/**
 * Process invoice.payment_succeeded event
 */
export const handlePaymentSucceeded = async (invoice: Stripe.Invoice): Promise<void> => {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  try {
    // Use type assertion to access subscription property
    const invoiceData = invoice as any;
    const subscriptionId = invoiceData.subscription;
    
    if (!subscriptionId) {
      console.log('Invoice not associated with subscription');
      return;
    }

    // Fetch full subscription to get latest status
    const subscription = await stripe.subscriptions.retrieve(
      typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
    );

    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    const planTier = getPlanTierFromPriceId(priceId);
    if (!planTier) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Use type assertion for current_period_end
    const subscriptionData = subscription as any;
    const currentPeriodEnd = subscriptionData.current_period_end
      ? new Date(subscriptionData.current_period_end * 1000)
      : undefined;

    const result = await updateSubscriptionFromStripe(subscription.id, {
      customer_id: subscription.customer as string,
      plan_tier: planTier,
      status: mapStripeStatus(subscription.status),
      current_period_end: currentPeriodEnd,
    });

    if (result.success) {
      console.log('✅ Subscription reactivated after payment');
    } else {
      console.error('❌ Failed to reactivate subscription:', result.error);
    }
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
  }
};

/**
 * Process webhook event based on type
 */
export const processWebhookEvent = async (event: Stripe.Event): Promise<void> => {
  console.log(`📨 Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);
    throw error;
  }
};
