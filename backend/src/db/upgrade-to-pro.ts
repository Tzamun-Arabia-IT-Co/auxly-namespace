import pool from './connection';

async function upgradeToPro() {
  try {
    // Update user subscription to pro tier
    const result = await pool.query(`
      UPDATE subscriptions
      SET 
        plan_tier = 'pro',
        status = 'active',
        updated_at = NOW()
      WHERE user_id = 1
      RETURNING *
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ User upgraded to Pro tier successfully!');
      console.table(result.rows);
    } else {
      console.log('No subscription found, creating new Pro subscription...');
      
      const createResult = await pool.query(`
        INSERT INTO subscriptions (user_id, plan_tier, status)
        VALUES (1, 'pro', 'active')
        RETURNING *
      `);
      
      console.log('✅ Pro subscription created!');
      console.table(createResult.rows);
    }
    
    // Clear usage logs for fresh start (optional)
    await pool.query(`DELETE FROM usage_logs WHERE user_id = 1`);
    console.log('✅ Usage logs cleared!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

upgradeToPro();



























