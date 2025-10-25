"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trial_service_1 = require("../services/trial.service");
const api_key_1 = require("../middleware/api-key");
const router = (0, express_1.Router)();
/**
 * POST /trial/verify
 * Verify trial status for a user (requires API key)
 */
router.post('/verify', api_key_1.authenticateApiKey, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const trialInfo = await (0, trial_service_1.getTrialInfo)(req.user.id);
        if (!trialInfo) {
            res.status(404).json({ error: 'Trial not found' });
            return;
        }
        res.status(200).json({
            trial_start: trialInfo.trial_start ? trialInfo.trial_start.toISOString() : null,
            trial_end: trialInfo.trial_end ? trialInfo.trial_end.toISOString() : null,
            status: trialInfo.trial_status,
            days_remaining: trialInfo.days_remaining,
        });
    }
    catch (error) {
        console.error('Trial verify error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /trial/start
 * Initialize trial for a new user (requires API key)
 */
router.post('/start', api_key_1.authenticateApiKey, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Check if trial already exists
        const existing = await (0, trial_service_1.getTrialInfo)(req.user.id);
        if (existing) {
            res.status(200).json({
                message: 'Trial already exists',
                trial_start: existing.trial_start ? existing.trial_start.toISOString() : null,
                trial_end: existing.trial_end ? existing.trial_end.toISOString() : null,
                status: existing.trial_status,
                days_remaining: existing.days_remaining,
            });
            return;
        }
        const trialInfo = await (0, trial_service_1.initializeTrial)(req.user.id);
        res.status(201).json({
            message: 'Trial initialized successfully',
            trial_start: trialInfo.trial_start ? trialInfo.trial_start.toISOString() : null,
            trial_end: trialInfo.trial_end ? trialInfo.trial_end.toISOString() : null,
            status: trialInfo.trial_status,
            days_remaining: trialInfo.days_remaining,
        });
    }
    catch (error) {
        console.error('Trial start error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /trial/upgrade
 * Upgrade trial to paid plan (requires API key)
 */
router.post('/upgrade', api_key_1.authenticateApiKey, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        await (0, trial_service_1.upgradeTrial)(req.user.id);
        res.status(200).json({
            message: 'Trial upgraded successfully',
        });
    }
    catch (error) {
        console.error('Trial upgrade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=trial.js.map