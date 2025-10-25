const { Pool } = require('pg');
const bcrypt = require('bcrypt');

require('dotenv').config();

async function checkTestUser() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    // Check if user exists
    const result = await pool.query('SELECT id, email, is_active, created_at FROM users WHERE email = $1', ['test@auxly.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ Test user NOT FOUND');
      console.log('Please run: node backend/setup-test-user.js');
    } else {
      const user = result.rows[0];
      console.log('✅ Test user EXISTS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Active:', user.is_active);
      console.log('Created:', user.created_at);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('✅ Ready to login with:');
      console.log('   Email: test@auxly.com');
      console.log('   Password: test123456');
      console.log('');
      console.log('🌐 Login at: http://localhost:5173/login');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTestUser();






