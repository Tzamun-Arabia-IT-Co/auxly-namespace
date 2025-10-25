// Fix migration order by updating timestamps
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixOrder() {
  console.log('Fixing migration order...\n');
  
  try {
    const client = await pool.connect();
    
    // Get current migrations
    console.log('Current migrations:');
    const before = await client.query('SELECT * FROM public.pgmigrations ORDER BY id');
    before.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.name} - ${row.run_on}`);
    });
    
    // Update run_on dates to be in chronological order by name
    console.log('\nFixing timestamps...');
    
    // oauth-fields should be before admin-role
    await client.query(`
      UPDATE public.pgmigrations 
      SET run_on = (SELECT run_on FROM public.pgmigrations WHERE name = '1760500000000_add-admin-role') - INTERVAL '1 hour'
      WHERE name = '1760490835255_add-oauth-fields'
    `);
    console.log('  ✅ Fixed oauth-fields timestamp');
    
    // usage-logs should be after admin-role
    await client.query(`
      UPDATE public.pgmigrations 
      SET run_on = (SELECT run_on FROM public.pgmigrations WHERE name = '1760500000000_add-admin-role') + INTERVAL '1 hour'
      WHERE name = '1760630000000_add-usage-logs'
    `);
    console.log('  ✅ Fixed usage-logs timestamp');
    
    console.log('\nUpdated migrations:');
    const after = await client.query('SELECT * FROM public.pgmigrations ORDER BY run_on');
    after.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.run_on})`);
    });
    
    client.release();
    console.log('\n✅ Migration order fixed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixOrder();




