import pool from './connection';

async function checkUsage() {
  try {
    // Check if usage_logs table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'usage_logs'
      );
    `);
    
    console.log('usage_logs table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get usage count
      const usage = await pool.query(`
        SELECT user_id, COUNT(*) as count
        FROM usage_logs
        WHERE timestamp > NOW() - INTERVAL '30 days'
        GROUP BY user_id
      `);
      
      console.log('Usage in last 30 days:');
      console.table(usage.rows);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsage();



























