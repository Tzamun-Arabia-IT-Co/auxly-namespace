"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const passport_1 = __importDefault(require("./config/passport"));
const connection_1 = require("./db/connection");
const auth_1 = __importDefault(require("./routes/auth"));
const oauth_1 = __importDefault(require("./routes/oauth"));
const api_keys_1 = __importDefault(require("./routes/api-keys"));
const stripe_1 = __importDefault(require("./routes/stripe"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const trial_1 = __importDefault(require("./routes/trial"));
const beta_admin_1 = __importDefault(require("./routes/beta-admin"));
const fix_subscription_1 = __importDefault(require("./routes/fix-subscription"));
const admin_1 = __importDefault(require("./routes/admin"));
const settings_1 = __importDefault(require("./routes/settings"));
const usage_logger_1 = require("./middleware/usage-logger");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 7000;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
const allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'https://auxly.tzamun.com', // Production frontend
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// IMPORTANT: Stripe webhook endpoint MUST be before express.json()
// to preserve raw body for signature verification
app.use('/stripe/webhook', express_1.default.raw({ type: 'application/json' }), stripe_1.default);
// Body parsing middleware (for all other routes)
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Initialize Passport
app.use(passport_1.default.initialize());
// Serve beta portal at root
const betaPath = path_1.default.join(__dirname, '../../web/beta');
console.log('📁 Serving static files from:', betaPath);
app.use(express_1.default.static(betaPath));
// Serve old API test page at /api-docs
app.use('/api-docs', express_1.default.static('.'));
// Request logging middleware
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Usage logging middleware (after auth, before routes)
app.use(usage_logger_1.logApiUsage);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Auxly Backend API'
    });
});
// API routes
app.use('/api/auth', auth_1.default); // Email/password auth routes
app.use('/api/auth', oauth_1.default); // OAuth routes (GitHub, Google)
app.use('/api-keys', api_keys_1.default);
app.use('/tasks', tasks_1.default);
app.use('/subscription', subscription_1.default);
app.use('/trial', trial_1.default);
app.use('/api/beta/admin', beta_admin_1.default);
app.use('/api/fix', fix_subscription_1.default); // Quick fix endpoint
app.use('/api/admin', admin_1.default); // Admin dashboard routes
app.use('/api/settings', settings_1.default); // System settings routes
// 404 handler for API routes and serve index.html for React Router
app.use((req, res, _next) => {
    // If it's an API route, return 404 JSON
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/tasks') ||
        req.path.startsWith('/api-keys') || req.path.startsWith('/subscription') ||
        req.path.startsWith('/trial') || req.path.startsWith('/stripe')) {
        res.status(404).json({ error: 'Route not found' });
    }
    else {
        // Otherwise, serve index.html for React Router
        res.sendFile(path_1.default.join(__dirname, '../../web/beta/index.html'));
    }
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
const startServer = async () => {
    try {
        // Test database connection
        await (0, connection_1.testConnection)();
        console.log('✅ Database connection established');
        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Auxly Backend API running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
            console.log(`💳 Stripe webhook: http://localhost:${PORT}/stripe/webhook`);
            console.log(`📊 Subscription: http://localhost:${PORT}/subscription`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map