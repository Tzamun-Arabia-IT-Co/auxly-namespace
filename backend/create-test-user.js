const { Pool } = require('pg');
const bcrypt = require('bcrypt');

require('dotenv').config();

async function createTestUser() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('🔍 Checking for existing test user...');
    
    // Delete existing test user
    await pool.query('DELETE FROM users WHERE email = $1', ['test@auxly.com']);
    console.log('✅ Deleted existing test user (if any)');

    // Hash password
    const password = 'test123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Create new test user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, is_active, trial_start, trial_end)
       VALUES ($1, $2, true, NOW(), NOW() + INTERVAL '30 days')
       RETURNING id, email, created_at`,
      ['test@auxly.com', hashedPassword]
    );

    console.log('\n✅ TEST USER CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: test@auxly.com');
    console.log('🔐 Password: test123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', result.rows[0].id);
    console.log('Created:', result.rows[0].created_at);
    
    // Verify password
    const verifyResult = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['test@auxly.com']);
    const isValid = await bcrypt.compare(password, verifyResult.rows[0].password_hash);
    console.log('✅ Password verification:', isValid ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

createTestUser();






