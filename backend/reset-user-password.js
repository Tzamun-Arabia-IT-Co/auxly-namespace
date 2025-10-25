const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function resetPassword() {
  const email = 'wsamoum@tzamun.sa';
  const newPassword = 'TempPassword123!'; // Temporary password - user should change it

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if user exists
    const userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ User not found: ${email}`);
      client.release();
      await pool.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`\n👤 Found user: ${user.email} (ID: ${user.id})`);

    // Hash new password
    console.log('\n🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    console.log('🔄 Updating password in database...');
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    console.log('\n✅ Password reset successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: User should change this password after login!');

    client.release();
    await pool.end();
    console.log('\n✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    await pool.end();
    process.exit(1);
  }
}

resetPassword();








