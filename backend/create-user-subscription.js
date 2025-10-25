const { Pool } = require('pg');
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

async function createSubscription() {
  const email = 'wsamoum@tzamun.sa';
  const planTier = 'pro'; // or 'free'

  try {
    const client = await pool.connect();
    
    // Get user
    const userResult = await client.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      console.error(`User not found: ${email}`);
      client.release();
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`\n👤 User: ${user.email} (ID: ${user.id})`);

    // Check if subscription exists
    const existingSub = await client.query('SELECT * FROM subscriptions WHERE user_id = $1', [user.id]);
    
    if (existingSub.rows.length > 0) {
      console.log(`\n✏️  Updating existing subscription...`);
      await client.query(
        'UPDATE subscriptions SET plan_tier = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
        [planTier, 'active', user.id]
      );
      console.log(`✅ Subscription updated to ${planTier.toUpperCase()}`);
    } else {
      console.log(`\n➕ Creating new subscription...`);
      await client.query(
        `INSERT INTO subscriptions (user_id, plan_tier, status, current_period_end, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '6 months', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [user.id, planTier, 'active']
      );
      console.log(`✅ Subscription created: ${planTier.toUpperCase()}`);
    }

    console.log(`\n📋 Subscription Details:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`User:   ${user.email}`);
    console.log(`Plan:   ${planTier.toUpperCase()}`);
    console.log(`Status: ACTIVE`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

createSubscription();








