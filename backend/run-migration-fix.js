// Quick script to fix migration tracking
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixMigration() {
  console.log('Connecting to database...');
  
  try {
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    // Add both missing migrations in order
    const migrationsToAdd = [
      '1760490835255_add-oauth-fields',
      '1760500000000_add-admin-role',
      '1760630000000_add-usage-logs'
    ];
    
    for (const migrationName of migrationsToAdd) {
      console.log(`\nChecking migration: ${migrationName}...`);
      const check = await client.query(`
        SELECT * FROM public.pgmigrations WHERE name = $1
      `, [migrationName]);
      
      if (check.rows.length > 0) {
        console.log(`  ℹ️ Already exists (skipped)`);
      } else {
        console.log(`  Adding migration record...`);
        const result = await client.query(`
          INSERT INTO public.pgmigrations (name, run_on) 
          VALUES ($1, NOW())
          RETURNING *;
        `, [migrationName]);
        console.log(`  ✅ Added:`, result.rows[0]);
      }
    }
    
    console.log('\nCurrent migrations:');
    const migrations = await client.query('SELECT * FROM public.pgmigrations ORDER BY run_on');
    migrations.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.run_on})`);
    });
    
    client.release();
    console.log('\n✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixMigration();

