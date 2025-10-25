const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'auxly_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔄 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    console.log('🔄 Running settings table migration...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'src', 'db', 'migrations', 'create-settings-table.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);
    console.log('✅ Settings table created successfully!');

    // Verify settings were inserted
    const result = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');
    console.log('\n📋 Default settings:');
    result.rows.forEach(row => {
      console.log(`  - ${row.setting_key}: ${row.setting_value}`);
    });

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Table already exists, skipping...');
      
      // Show current settings
      try {
        const result = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');
        console.log('\n📋 Current settings:');
        result.rows.forEach(row => {
          console.log(`  - ${row.setting_key}: ${row.setting_value}`);
        });
      } catch (e) {
        console.error('Could not fetch settings:', e.message);
      }
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();










