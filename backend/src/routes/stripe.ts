import { Router, Request, Response } from 'express';
import { verifyWebhookSignature, processWebhookEvent } from '../services/stripe.service';

const router = Router();

/**
 * POST /stripe/webhook
 * Stripe webhook endpoint for subscription events
 * 
 * IMPORTANT: This endpoint must use express.raw() middleware
 * to preserve the raw body for signature verification
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get Stripe signature from headers
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(req.body, signature as string);

    if (!event) {
      console.error('❌ Webhook signature verification failed');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    console.log(`✅ Webhook signature verified: ${event.type}`);

    // Process the event
    try {
      await processWebhookEvent(event);
      res.status(200).json({ received: true, event_type: event.type });
    } catch (processingError) {
      // Log error but return 200 to prevent Stripe retries
      console.error('Error processing webhook:', processingError);
      res.status(200).json({
        received: true,
        event_type: event.type,
        processing_error: 'Event received but processing failed',
      });
    }
  } catch (error) {
    console.error('Webhook endpoint error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;


