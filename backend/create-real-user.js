const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auxly_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function createUser() {
  try {
    const email = 'wsamoum@tzamun.sa';
    const password = 'test123456';
    
    console.log(`🔄 Creating/updating user: ${email}\n`);
    
    // Delete existing user if exists
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    console.log('✅ Deleted existing user (if any)');
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');
    
    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING id, email, created_at`,
      [email, passwordHash]
    );
    
    console.log('✅ User created successfully!');
    console.table(result.rows);
    
    console.log(`\n📝 Login credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

createUser();

