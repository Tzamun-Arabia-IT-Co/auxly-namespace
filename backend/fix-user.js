require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function fixUser() {
  try {
    // Delete existing user
    await pool.query('DELETE FROM users WHERE email = $1', ['test@auxly.com']);
    console.log('✅ Deleted old user');
    
    // Create new user with proper hash
    const password = 'test123456';
    const hash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, trial_start, trial_end, trial_status, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days', 'active', NOW(), NOW())
       RETURNING id, email`,
      ['test@auxly.com', hash]
    );
    
    console.log('✅ User created:', result.rows[0]);
    console.log('\n📧 Email: test@auxly.com');
    console.log('🔒 Password: test123456');
    console.log('\n🌐 Login at: http://localhost:5173/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixUser();






