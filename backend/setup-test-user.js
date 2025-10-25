const { Pool } = require('pg');
const bcrypt = require('bcrypt');

require('dotenv').config();

async function setupTestUser() {
  console.log('🚀 Starting test user setup...\n');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    // 1. Check database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully\n');

    // 2. Delete existing test user
    console.log('🗑️  Removing existing test user...');
    const deleteResult = await pool.query('DELETE FROM users WHERE email = $1', ['test@auxly.com']);
    console.log(`✅ Deleted ${deleteResult.rowCount} existing user(s)\n`);

    // 3. Create password hash
    console.log('🔐 Hashing password...');
    const password = 'test123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully\n');

    // 4. Insert new test user
    console.log('👤 Creating new test user...');
    const insertResult = await pool.query(
      `INSERT INTO users (email, password_hash, is_active, trial_start, trial_end, created_at)
       VALUES ($1, $2, true, NOW(), NOW() + INTERVAL '30 days', NOW())
       RETURNING id, email, is_active, created_at`,
      ['test@auxly.com', hashedPassword]
    );

    const newUser = insertResult.rows[0];
    console.log('✅ User created successfully!');
    console.log('   User ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Active:', newUser.is_active);
    console.log('   Created:', newUser.created_at);
    console.log('');

    // 5. Verify user exists
    console.log('🔍 Verifying user in database...');
    const verifyUser = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', ['test@auxly.com']);
    if (verifyUser.rows.length === 0) {
      console.log('❌ ERROR: User not found after insert!');
      return;
    }
    console.log('✅ User exists in database\n');

    // 6. Test password verification
    console.log('🔑 Testing password verification...');
    const storedHash = verifyUser.rows[0].password_hash;
    const isMatch = await bcrypt.compare(password, storedHash);
    
    if (isMatch) {
      console.log('✅ Password verification: SUCCESS');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('   This means login will NOT work!');
    }
    console.log('');

    // 7. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST USER SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📧 Email:    test@auxly.com');
    console.log('🔐 Password: test123456');
    console.log('');
    console.log('🌐 Login URL: http://localhost:5173/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

setupTestUser();






