require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function addOAuthColumns() {
  try {
    console.log('Adding OAuth columns...');
    
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
    `);
    console.log('✅ oauth_provider column added');
    
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
    `);
    console.log('✅ oauth_id column added');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
    `);
    console.log('✅ oauth_provider index created');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_oauth_id ON users(oauth_id);
    `);
    console.log('✅ oauth_id index created');
    
    await pool.query(`
      COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider: github, google, etc.';
    `);
    
    await pool.query(`
      COMMENT ON COLUMN users.oauth_id IS 'OAuth provider user ID';
    `);
    
    console.log('✅ Comments added');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'users' AND (column_name LIKE 'oauth%' OR column_name LIKE 'trial%')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 OAuth and Trial columns:');
    result.rows.forEach(row => console.log(`   ✅ ${row.column_name}`));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addOAuthColumns();



