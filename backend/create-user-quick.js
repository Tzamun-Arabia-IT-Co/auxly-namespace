const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'rnd.tzamun.com',
  port: 5432,
  database: 'Auxly',
  user: 'wsamoum',
  password: process.env.DB_PASSWORD || ''
});

async function createUser() {
  try {
    const email = 'test@auxly.com';
    const password = 'test123456';
    const hash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, trial_start, trial_end, trial_status)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days', 'active')
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = $2
       RETURNING id, email`,
      [email, hash]
    );
    
    console.log('✅ User created/updated:', result.rows[0]);
    console.log('📧 Email: test@auxly.com');
    console.log('🔒 Password: test123456');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createUser();






