import pool from './connection';
import fs from 'fs';
import path from 'path';

async function runExpirationMigration() {
  try {
    console.log('🔄 Running API key expiration migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add-api-key-expiration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('   - Added expires_at column to api_keys table');
    console.log('   - Set 12-month expiration for existing keys');
    console.log('   - Created performance indexes\n');

    // Verify the changes
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_keys,
        COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_keys,
        COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_keys
      FROM api_keys
    `);

    console.log('📊 Current API Keys Status:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runExpirationMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runExpirationMigration;






