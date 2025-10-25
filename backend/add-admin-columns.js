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
    console.log('🔧 Adding is_admin column...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL');
    console.log('✅ is_admin column added');

    console.log('🔧 Adding is_blocked column...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false NOT NULL');
    console.log('✅ is_blocked column added');

    console.log('🔧 Setting your account as admin...');
    const result = await pool.query(
      'UPDATE users SET is_admin = true WHERE email = $1 RETURNING id, email, is_admin',
      ['wsamoum@tzamun.sa']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin status set:', result.rows[0]);
    } else {
      console.log('❌ User not found!');
    }

    await pool.end();
    console.log('\n✅ ALL DONE! Columns added successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addAdminColumns();


