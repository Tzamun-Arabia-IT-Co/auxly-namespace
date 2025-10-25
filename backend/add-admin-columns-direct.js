const { Pool } = require('pg');

const pool = new Pool({
  host: 'rnd.tzamun.com',
  port: 5432,
  database: 'Auxly',
  user: 'wsamoum',
  password: 'W@el401962'
});

async function addAdminColumns() {
  try {
    console.log('🔧 Adding admin columns...');
    
    // Add is_admin column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL
    `);
    console.log('✅ Added is_admin column');
    
    // Add is_blocked column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false NOT NULL
    `);
    console.log('✅ Added is_blocked column');
    
    // Make user admin
    const result = await pool.query(`
      UPDATE users 
      SET is_admin = true 
      WHERE email = 'wsamoum@tzamun.sa'
      RETURNING id, email, is_admin, is_blocked
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ User updated to admin:');
      console.log(result.rows[0]);
    } else {
      console.log('⚠️ User not found');
    }
    
    // Verify
    const verify = await pool.query(`
      SELECT id, email, is_admin, is_blocked 
      FROM users 
      WHERE email = 'wsamoum@tzamun.sa'
    `);
    
    console.log('\n✅ Final verification:');
    console.log(verify.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addAdminColumns();


