const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auxly_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  console.log('\n🔄 Running API Key Devices Table Migration...\n');
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'src/db/migrations/create-api-key-devices-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Migration file loaded:', sqlPath);
    
    // Execute migration
    console.log('\n📊 Creating api_key_devices table...');
    await pool.query(sql);
    
    console.log('✅ Table created successfully!');
    
    // Verify table exists
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'api_key_devices'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Table structure:');
    console.table(tableCheck.rows);
    
    // Check indexes
    const indexCheck = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'api_key_devices'
    `);
    
    console.log('\n🔍 Indexes created:');
    console.table(indexCheck.rows);
    
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('\n📝 Summary:');
    console.log('   - api_key_devices table created');
    console.log('   - Foreign key to api_keys table');
    console.log('   - Unique constraint per device per key');
    console.log('   - 4 indexes for fast lookups');
    console.log('\n🚀 Ready to enforce 2-device limit!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();






