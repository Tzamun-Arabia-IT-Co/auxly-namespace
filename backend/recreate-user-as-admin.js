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

async function recreateUserAsAdmin() {
  const email = 'wsamoum@tzamun.sa';
  const newPassword = 'Admin@123!'; // Temporary admin password

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if user exists
    const userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      console.log(`\n🗑️ Deleting existing user: ${email} (ID: ${userId})`);

      // Delete in order to respect foreign key constraints
      console.log('  - Deleting device limit audit logs...');
      await client.query('DELETE FROM device_limit_audit_log WHERE user_id = $1 OR admin_id = $1', [userId]);

      console.log('  - Deleting usage logs...');
      await client.query('DELETE FROM usage_logs WHERE user_id = $1', [userId]);

      console.log('  - Deleting tasks...');
      await client.query('DELETE FROM tasks WHERE user_id = $1', [userId]);

      console.log('  - Deleting API key devices...');
      await client.query(
        'DELETE FROM api_key_devices WHERE api_key_id IN (SELECT id FROM api_keys WHERE user_id = $1)',
        [userId]
      );

      console.log('  - Deleting API keys...');
      await client.query('DELETE FROM api_keys WHERE user_id = $1', [userId]);

      console.log('  - Deleting subscriptions...');
      await client.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);

      console.log('  - Deleting user...');
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      console.log('✅ User deleted successfully');
    } else {
      console.log(`\n📝 User not found, will create new user`);
    }

    // Create new user with admin access
    console.log(`\n👤 Creating new admin user: ${email}`);
    
    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Insert new user
    console.log('💾 Inserting new user...');
    const insertResult = await client.query(
      `INSERT INTO users (
        email, 
        password_hash, 
        is_admin, 
        is_blocked,
        max_devices,
        trial_start,
        trial_end,
        trial_status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months', $6, CURRENT_TIMESTAMP)
      RETURNING id, email, is_admin, max_devices`,
      [email, hashedPassword, true, false, 10, 'active']
    );

    const newUser = insertResult.rows[0];

    console.log('\n✅ User created successfully!');
    console.log('\n📋 User Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:        ${newUser.email}`);
    console.log(`Password:     ${newPassword}`);
    console.log(`Admin:        ${newUser.is_admin ? '✅ YES' : '❌ NO'}`);
    console.log(`Max Devices:  ${newUser.max_devices}`);
    console.log(`User ID:      ${newUser.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: User should change this password after login!');
    console.log(`\n🔗 Login at: https://auxly.tzamun.com/login`);

    client.release();
    await pool.end();
    console.log('\n✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error recreating user:', error);
    await pool.end();
    process.exit(1);
  }
}

recreateUserAsAdmin();

