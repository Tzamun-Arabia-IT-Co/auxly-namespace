import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
// Frontend URL for OAuth redirects - supports multiple environments
const FRONTEND_URL = process.env.FRONTEND_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://auxly.tzamun.com' : 'http://localhost:5173');

/**
 * GitHub OAuth Routes
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  (req: Request, _res: Response, next: any) => {
    console.log('🔵 GitHub callback route hit!');
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);
    next();
  },
  passport.authenticate('github', { 
    session: false, 
    failureRedirect: `${FRONTEND_URL}/login?error=github_auth_failed`,
    failureMessage: true
  }),
  (req: Request, res: Response) => {
    try {
      console.log('🟢 Passport authentication successful!');
      const user = req.user as any;
      
      if (!user) {
        console.error('❌ No user object after authentication');
        return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
      }
      
      console.log('👤 User authenticated:', user.id, user.email);
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      console.log('🔑 JWT token generated');

      // Redirect to frontend with token
      const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}`;
      console.log('↪️  Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ GitHub callback error:', error);
      console.error('Error stack:', (error as Error).stack);
      res.redirect(`${FRONTEND_URL}/login?error=auth_callback_failed`);
    }
  }
);

/**
 * Google OAuth Routes
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed` }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Redirect to frontend with token
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=auth_callback_failed`);
    }
  }
);

/**
 * Microsoft OAuth Routes
 */
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));

router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=microsoft_auth_failed` }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Redirect to frontend with token
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}`);
    } catch (error) {
      console.error('Microsoft callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=auth_callback_failed`);
    }
  }
);

export default router;

