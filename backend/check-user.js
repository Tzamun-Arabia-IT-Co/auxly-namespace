const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auxly_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function checkUser() {
  try {
    console.log('🔍 Checking user wsamoum@tzamun.sa...\n');
    
    // Check if user exists
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE email = $1',
      ['wsamoum@tzamun.sa']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database!');
      console.log('\n📋 Available users:');
      const allUsers = await pool.query('SELECT id, email FROM users LIMIT 10');
      console.table(allUsers.rows);
    } else {
      console.log('✅ User found!');
      console.table(result.rows);
      
      // Check API keys
      console.log('\n🔑 Checking existing API keys for this user...');
      const apiKeys = await pool.query(
        'SELECT id, name, created_at, expires_at, revoked FROM api_keys WHERE user_id = $1',
        [result.rows[0].id]
      );
      
      if (apiKeys.rows.length === 0) {
        console.log('No API keys found for this user.');
      } else {
        console.table(apiKeys.rows);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

checkUser();






