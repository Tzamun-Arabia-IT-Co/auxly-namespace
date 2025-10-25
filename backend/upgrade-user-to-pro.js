require('dotenv').config();
const { Client } = require('pg');

async function upgradeUser() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get all users
    const users = await client.query('SELECT id, email FROM users');
    console.log('📋 Current users:', users.rows);

    // Upgrade all subscriptions to PRO
    const result = await client.query(`
      UPDATE subscriptions 
      SET plan_tier = 'pro', 
          status = 'active',
          updated_at = NOW()
      WHERE plan_tier = 'free'
      RETURNING *
    `);

    console.log(`✅ Upgraded ${result.rowCount} subscription(s) to PRO!`);
    console.table(result.rows);

    // Verify
    const verify = await client.query(`
      SELECT u.id, u.email, s.plan_tier, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
    `);

    console.log('\n📊 All subscriptions:');
    console.table(verify.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

upgradeUser();

