import { testConnection, closePool } from './connection';

/**
 * Initialize database connection and verify it's working
 */
async function initializeDatabase() {
  console.log('🔄 Initializing Auxly database connection...');
  
  try {
    await testConnection();
    console.log('✅ Database initialization complete');
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    await closePool();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase;

