const { Pool } = require('pg');

const pool = new Pool({
  host: 'rnd.tzamun.com',
  port: 5432,
  database: 'Auxly',
  user: 'wsamoum',
  password: 'W@el401962',
  ssl: false
});

async function markMigrations() {
  try {
    await pool.query(`
      INSERT INTO pgmigrations (name, run_on) 
      VALUES ('1760186283367_add-tasks-table', NOW())
      ON CONFLICT DO NOTHING
    `);
    
    await pool.query(`
      INSERT INTO pgmigrations (name, run_on) 
      VALUES ('1760483900000_add-trial-columns', NOW())
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Successfully marked old migrations as complete');
  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}

markMigrations();

