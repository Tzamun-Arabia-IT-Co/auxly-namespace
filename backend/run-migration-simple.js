// Run Device Limit Migration - Simple Version
const { Pool } = require('pg');
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
    console.log(`📊 Database: ${process.env.DB_NAME} at ${process.env.DB_HOST}\n`);
    
    // Step 1: Add max_devices column
    console.log('Step 1: Adding max_devices column...');
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 2 NOT NULL
      `);
      console.log('✅ max_devices column added\n');
    } catch (err) {
      console.log('⚠️  Column might already exist:', err.message, '\n');
    }
    
    // Step 2: Add constraint
    console.log('Step 2: Adding constraint...');
    try {
      await client.query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS check_max_devices_range
      `);
      await client.query(`
        ALTER TABLE users 
        ADD CONSTRAINT check_max_devices_range 
        CHECK (max_devices >= 1 AND max_devices <= 100)
      `);
      console.log('✅ Constraint added\n');
    } catch (err) {
      console.log('⚠️  Constraint error:', err.message, '\n');
    }
    
    // Step 3: Create audit log table
    console.log('Step 3: Creating audit log table...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS device_limit_audit_log (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          admin_id INTEGER NOT NULL,
          old_limit INTEGER NOT NULL,
          new_limit INTEGER NOT NULL,
          changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          reason TEXT,
          CONSTRAINT fk_user
            FOREIGN KEY (user_id) 
            REFERENCES users(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_admin
            FOREIGN KEY (admin_id) 
            REFERENCES users(id)
            ON DELETE SET NULL
        )
      `);
      console.log('✅ Audit log table created\n');
    } catch (err) {
      console.log('⚠️  Table might already exist:', err.message, '\n');
    }
    
    // Step 4: Create indexes
    console.log('Step 4: Creating indexes...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_device_limit_audit_user_id 
        ON device_limit_audit_log(user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_device_limit_audit_admin_id 
        ON device_limit_audit_log(admin_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_device_limit_audit_changed_at 
        ON device_limit_audit_log(changed_at DESC)
      `);
      console.log('✅ Indexes created\n');
    } catch (err) {
      console.log('⚠️  Index error:', err.message, '\n');
    }
    
    // Verify migration
    console.log('Verifying migration...');
    const result = await client.query(`
      SELECT COUNT(*) as total_users, 
             COALESCE(AVG(max_devices), 0) as avg_device_limit 
      FROM users
    `);
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Total users: ${result.rows[0].total_users}`);
    console.log(`📊 Average device limit: ${parseFloat(result.rows[0].avg_device_limit).toFixed(1)}`);
    
    // Check if audit table exists
    const auditCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'device_limit_audit_log'
      ) as exists
    `);
    
    console.log(`📋 Audit log table: ${auditCheck.rows[0].exists ? '✅ Ready' : '❌ Not found'}`);
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'max_devices'
      ) as exists
    `);
    
    console.log(`📊 max_devices column: ${columnCheck.rows[0].exists ? '✅ Ready' : '❌ Not found'}`);
    
  } catch (error) {
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









