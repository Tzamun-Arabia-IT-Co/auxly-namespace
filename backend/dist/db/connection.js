"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.transaction = exports.query = exports.testConnection = exports.pool = void 0;
exports.getPool = getPool;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Database connection pool configuration
const poolConfig = {
    host: process.env.DB_HOST || 'rnd.tzamun.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'Auxly',
    user: process.env.DB_USER || 'wsamoum',
    password: process.env.DB_PASSWORD || 'W@el401962',
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};
console.log('📊 Database config:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user
});
// Create connection pool
exports.pool = new pg_1.Pool(poolConfig);
// Pool error handling
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});
// Test database connection
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected successfully at:', result.rows[0].now);
        client.release();
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};
exports.testConnection = testConnection;
// Query helper with error handling
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    }
    catch (error) {
        console.error('Query error:', { text, error });
        throw error;
    }
};
exports.query = query;
// Transaction helper
const transaction = async (callback) => {
    const client = await exports.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
// Graceful shutdown
const closePool = async () => {
    await exports.pool.end();
    console.log('✅ Database pool closed');
};
exports.closePool = closePool;
// Handle process termination
process.on('SIGINT', async () => {
    await (0, exports.closePool)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.closePool)();
    process.exit(0);
});
// Export pool getter function
function getPool() {
    return exports.pool;
}
exports.default = exports.pool;
//# sourceMappingURL=connection.js.map