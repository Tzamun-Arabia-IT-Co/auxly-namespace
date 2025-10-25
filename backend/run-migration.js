// Run Device Limit Migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting device limit migration...');
    console.log(`📊 Database: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
    
    // Read migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../RUN-DEVICE-LIMIT-MIGRATION.sql'),
      'utf8'
    );
    
    // Execute migration
    await client.query('BEGIN');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('DO $$')) {
        // Handle DO blocks specially
        const doBlock = migrationSQL.match(/DO \$\$[\s\S]*?END \$\$;/)[0];
        await client.query(doBlock);
        console.log('✅ Executed constraint check');
      } else if (!statement.includes('DO $$')) {
        try {
          await client.query(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            throw err;
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Verify migration
    const result = await client.query(`
      SELECT COUNT(*) as total_users, AVG(max_devices) as avg_device_limit 
      FROM users
    `);
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Total users: ${result.rows[0].total_users}`);
    console.log(`📊 Average device limit: ${result.rows[0].avg_device_limit}`);
    
    // Check if audit table exists
    const auditCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'device_limit_audit_log'
      );
    `);
    
    console.log(`📋 Audit log table: ${auditCheck.rows[0].exists ? '✅ Created' : '❌ Not found'}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 All done! Backend can now use device limit features.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Migration error:', err);
    process.exit(1);
  });
