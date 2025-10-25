const { Pool } = require('pg');

const pool = new Pool({
  host: 'rnd.tzamun.com',
  port: 5432,
  database: 'Auxly',
  user: 'wsamoum',
  password: 'W@el401962',
  ssl: false
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table columns:');
    res.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkSchema();

