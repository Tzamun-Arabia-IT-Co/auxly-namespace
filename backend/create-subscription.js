const { Pool } = require('pg');

async function createSubscription() {
  const pool = new Pool({
    host: 'rnd.tzamun.com',
    port: 5432,
    database: 'Auxly',
    user: 'wsamoum',
    password: 'W@el401962',
  });

  try {
    console.log('🔄 Connecting to database...');
    
    // First, check if subscription exists
    const check = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = 3'
    );
    
    console.log('📊 Current subscription:', check.rows);

    if (check.rows.length === 0) {
      // Create new subscription
      console.log('➕ Creating new subscription...');
      const result = await pool.query(
        `INSERT INTO subscriptions (user_id, plan_tier, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [3, 'pro', 'active']
      );
      console.log('✅ Subscription created:', result.rows[0]);
    } else {
      // Update existing subscription
      console.log('🔄 Updating existing subscription...');
      const result = await pool.query(
        `UPDATE subscriptions 
         SET plan_tier = $1, 
             status = $2,
             updated_at = NOW()
         WHERE user_id = $3
         RETURNING *`,
        ['pro', 'active', 3]
      );
      console.log('✅ Subscription updated:', result.rows[0]);
    }

    // Verify final state
    const verify = await pool.query(`
      SELECT u.id, u.email, s.plan_tier, s.status, s.created_at, s.updated_at
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = 3
    `);

    console.log('\n📊 FINAL STATE:');
    console.table(verify.rows);

    if (verify.rows[0]?.plan_tier === 'pro') {
      console.log('\n🎉 SUCCESS! User is now on PRO plan!');
    } else {
      console.log('\n⚠️ Something went wrong!');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

createSubscription();

