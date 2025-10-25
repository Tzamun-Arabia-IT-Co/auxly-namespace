require('dotenv').config();
const { Pool } = require('pg');

async function fixSubscription() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔄 Connecting to database...');
    
    // Check current state
    const before = await pool.query(`
      SELECT u.id, u.email, s.plan_tier, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = 3
    `);
    
    console.log('\n📊 BEFORE:');
    console.table(before.rows);

    // Create or update subscription
    const result = await pool.query(`
      INSERT INTO subscriptions (user_id, plan_tier, status, created_at, updated_at)
      VALUES (3, 'pro', 'active', NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        plan_tier = 'pro', 
        status = 'active',
        updated_at = NOW()
      RETURNING *
    `);

    console.log('\n✅ SUBSCRIPTION CREATED/UPDATED:');
    console.table(result.rows);

    // Verify the fix
    const after = await pool.query(`
      SELECT u.id, u.email, s.plan_tier, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = 3
    `);

    console.log('\n📊 AFTER:');
    console.table(after.rows);

    if (after.rows[0]?.plan_tier === 'pro') {
      console.log('\n🎉 SUCCESS! User upgraded to PRO plan!');
    } else {
      console.log('\n⚠️ WARNING: Subscription still NULL!');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\n✅ Database connection closed');
  }
}

fixSubscription();

