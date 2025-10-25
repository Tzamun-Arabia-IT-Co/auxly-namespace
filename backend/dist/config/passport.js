"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_microsoft_1 = require("passport-microsoft");
const connection_1 = require("../db/connection");
// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.BACKEND_URL
            ? `${process.env.BACKEND_URL}/api/auth/github/callback`
            : (process.env.NODE_ENV === 'production'
                ? 'https://auxly.tzamun.com/api/auth/github/callback'
                : 'http://localhost:7000/api/auth/github/callback'),
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            console.log('🔐 GitHub OAuth callback received');
            console.log('📧 Profile:', JSON.stringify(profile, null, 2));
            // Try multiple sources for email
            let email = null;
            // 1. Try profile.emails array (most common)
            if (profile.emails && profile.emails.length > 0) {
                email = profile.emails[0].value;
                console.log('📧 Email from profile.emails:', email);
            }
            // 2. Try profile._json.email (GitHub API direct response)
            if (!email && profile._json?.email) {
                email = profile._json.email;
                console.log('📧 Email from profile._json:', email);
            }
            // 3. Fallback to username@github.com
            if (!email) {
                email = `${profile.username}@github.com`;
                console.log('⚠️ Using fallback email:', email);
            }
            console.log('✅ Final email:', email);
            // Check if user exists
            let result = await connection_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
            console.log('👤 Existing users found:', result.rows.length);
            let user;
            if (result.rows.length > 0) {
                // User exists
                user = result.rows[0];
                console.log('✅ User exists, logging in:', user.id);
            }
            else {
                // Create new user with trial
                console.log('🆕 Creating new user...');
                const trialStart = new Date();
                const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
                console.log('📝 INSERT params:', {
                    email,
                    oauth_provider: 'github',
                    oauth_id: profile.id,
                    trial_start: trialStart,
                    trial_end: trialEnd,
                    trial_status: 'active'
                });
                result = await connection_1.pool.query('INSERT INTO users (email, password_hash, oauth_provider, oauth_id, trial_start, trial_end, trial_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [email, '', 'github', profile.id, trialStart, trialEnd, 'active']);
                user = result.rows[0];
                console.log('✅ New user created:', user.id);
                // Create PRO subscription for new OAuth user (free PRO plan for everyone!)
                console.log('🎁 Creating PRO subscription for new user...');
                await connection_1.pool.query('INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)', [user.id, 'pro', 'active']);
                console.log('✅ PRO subscription created');
            }
            console.log('✅ OAuth success, returning user:', user.id);
            done(null, user);
        }
        catch (error) {
            console.error('❌ GitHub OAuth error:', error);
            console.error('Error stack:', error.stack);
            done(error, null);
        }
    }));
}
// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.BACKEND_URL
            ? `${process.env.BACKEND_URL}/api/auth/google/callback`
            : (process.env.NODE_ENV === 'production'
                ? 'https://auxly.tzamun.com/api/auth/google/callback'
                : 'http://localhost:7000/api/auth/google/callback'),
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('No email found from Google profile'), null);
            }
            // Check if user exists
            let result = await connection_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
            let user;
            if (result.rows.length > 0) {
                // User exists
                user = result.rows[0];
            }
            else {
                // Create new user with trial
                const trialStart = new Date();
                const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
                result = await connection_1.pool.query('INSERT INTO users (email, password_hash, oauth_provider, oauth_id, trial_start, trial_end, trial_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [email, '', 'google', profile.id, trialStart, trialEnd, 'active']);
                user = result.rows[0];
                // Create PRO subscription for new OAuth user (free PRO plan for everyone!)
                await connection_1.pool.query('INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)', [user.id, 'pro', 'active']);
            }
            done(null, user);
        }
        catch (error) {
            done(error, null);
        }
    }));
}
// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport_1.default.use(new passport_microsoft_1.Strategy({
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.BACKEND_URL
            ? `${process.env.BACKEND_URL}/api/auth/microsoft/callback`
            : (process.env.NODE_ENV === 'production'
                ? 'https://auxly.tzamun.com/api/auth/microsoft/callback'
                : 'http://localhost:7000/api/auth/microsoft/callback'),
        tenant: process.env.MICROSOFT_TENANT_ID || 'common',
        scope: ['user.read'],
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            console.log('🔐 Microsoft OAuth callback received');
            console.log('📧 Profile:', JSON.stringify(profile, null, 2));
            const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
            if (!email) {
                return done(new Error('No email found from Microsoft profile'), null);
            }
            console.log('✅ Final email:', email);
            // Check if user exists
            let result = await connection_1.pool.query('SELECT * FROM users WHERE email = $1', [email]);
            console.log('👤 Existing users found:', result.rows.length);
            let user;
            if (result.rows.length > 0) {
                // User exists
                user = result.rows[0];
                console.log('✅ User exists, logging in:', user.id);
            }
            else {
                // Create new user with trial
                console.log('🆕 Creating new user...');
                const trialStart = new Date();
                const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
                result = await connection_1.pool.query('INSERT INTO users (email, password_hash, oauth_provider, oauth_id, trial_start, trial_end, trial_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [email, '', 'microsoft', profile.id, trialStart, trialEnd, 'active']);
                user = result.rows[0];
                console.log('✅ New user created:', user.id);
                // Create PRO subscription for new OAuth user (free PRO plan for everyone!)
                console.log('🎁 Creating PRO subscription for new user...');
                await connection_1.pool.query('INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)', [user.id, 'pro', 'active']);
                console.log('✅ PRO subscription created');
            }
            console.log('✅ OAuth success, returning user:', user.id);
            done(null, user);
        }
        catch (error) {
            console.error('❌ Microsoft OAuth error:', error);
            console.error('Error stack:', error.stack);
            done(error, null);
        }
    }));
}
// Serialize user for session
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const result = await connection_1.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map