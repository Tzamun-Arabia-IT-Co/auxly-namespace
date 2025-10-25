import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import passport from './config/passport';
import { testConnection } from './db/connection';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import apiKeysRoutes from './routes/api-keys';
import stripeRoutes from './routes/stripe';
import subscriptionRoutes from './routes/subscription';
import tasksRoutes from './routes/tasks';
import trialRoutes from './routes/trial';
import betaAdminRoutes from './routes/beta-admin';
import fixSubscriptionRoutes from './routes/fix-subscription';
import adminRoutes from './routes/admin';
import settingsRoutes from './routes/settings';
import { logApiUsage } from './middleware/usage-logger';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 7000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'https://auxly.tzamun.com', // Production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// IMPORTANT: Stripe webhook endpoint MUST be before express.json()
// to preserve raw body for signature verification
app.use('/stripe/webhook', express.raw({ type: 'application/json' }), stripeRoutes);

// Body parsing middleware (for all other routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Serve beta portal at root
const betaPath = path.join(__dirname, '../../web/beta');
console.log('📁 Serving static files from:', betaPath);
app.use(express.static(betaPath));

// Serve old API test page at /api-docs
app.use('/api-docs', express.static('.'));

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Usage logging middleware (after auth, before routes)
app.use(logApiUsage);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Auxly Backend API'
  });
});

// API routes
app.use('/api/auth', authRoutes); // Email/password auth routes
app.use('/api/auth', oauthRoutes); // OAuth routes (GitHub, Google)
app.use('/api-keys', apiKeysRoutes);
app.use('/tasks', tasksRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/trial', trialRoutes);
app.use('/api/beta/admin', betaAdminRoutes);
app.use('/api/fix', fixSubscriptionRoutes); // Quick fix endpoint
app.use('/api/admin', adminRoutes); // Admin dashboard routes
app.use('/api/settings', settingsRoutes); // System settings routes

// 404 handler for API routes and serve index.html for React Router
app.use((req: Request, res: Response, _next: NextFunction) => {
  // If it's an API route, return 404 JSON
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/tasks') || 
      req.path.startsWith('/api-keys') || req.path.startsWith('/subscription') || 
      req.path.startsWith('/trial') || req.path.startsWith('/stripe')) {
    res.status(404).json({ error: 'Route not found' });
  } else {
    // Otherwise, serve index.html for React Router
    res.sendFile(path.join(__dirname, '../../web/beta/index.html'));
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connection established');

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Auxly Backend API running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`💳 Stripe webhook: http://localhost:${PORT}/stripe/webhook`);
      console.log(`📊 Subscription: http://localhost:${PORT}/subscription`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

