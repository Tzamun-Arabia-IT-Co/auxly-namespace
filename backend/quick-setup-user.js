// Quick and dirty test user setup
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

// Load .env from backend directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    // Delete old user
    await pool.query('DELETE FROM users WHERE email = $1', ['test@auxly.com']);
    
    // Create new user with known password
    const hash = await bcrypt.hash('test123456', 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, is_active, trial_start, trial_end) VALUES ($1, $2, true, NOW(), NOW() + INTERVAL \'30 days\')',
      ['test@auxly.com', hash]
    );
    
    console.log('SUCCESS! User created: test@auxly.com / test123456');
    
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('Full error:', e);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();

