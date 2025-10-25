import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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
export const pool = new Pool(poolConfig);

// Pool error handling
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Query helper with error handling
export const query = async (
  text: string,
  params?: any[]
): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', { text, error });
    throw error;
  }
};

// Transaction helper
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('✅ Database pool closed');
};

// Handle process termination
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

// Export pool getter function
export function getPool(): Pool {
  return pool;
}

export default pool;

