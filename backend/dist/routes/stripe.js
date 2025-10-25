"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_service_1 = require("../services/stripe.service");
const router = (0, express_1.Router)();
/**
 * POST /stripe/webhook
 * Stripe webhook endpoint for subscription events
 *
 * IMPORTANT: This endpoint must use express.raw() middleware
 * to preserve the raw body for signature verification
 */
router.post('/webhook', async (req, res) => {
    try {
        // Get Stripe signature from headers
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            res.status(400).json({ error: 'Missing stripe-signature header' });
            return;
        }
        // Verify webhook signature
        const event = (0, stripe_service_1.verifyWebhookSignature)(req.body, signature);
        if (!event) {
            console.error('❌ Webhook signature verification failed');
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }
        console.log(`✅ Webhook signature verified: ${event.type}`);
        // Process the event
        try {
            await (0, stripe_service_1.processWebhookEvent)(event);
            res.status(200).json({ received: true, event_type: event.type });
        }
        catch (processingError) {
            // Log error but return 200 to prevent Stripe retries
            console.error('Error processing webhook:', processingError);
            res.status(200).json({
                received: true,
                event_type: event.type,
                processing_error: 'Event received but processing failed',
            });
        }
    }
    catch (error) {
        console.error('Webhook endpoint error:', error);
        res.status(400).json({ error: 'Webhook processing failed' });
    }
});
exports.default = router;
//# sourceMappingURL=stripe.js.map