require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  try {
    console.log('📊 Running trial columns migration...\n');
    
    const migrationPath = path.join(__dirname, 'src/db/migrations/add-trial-columns.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 80) + '...');
      await pool.query(statement);
      console.log('✅ Success\n');
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name LIKE 'trial%'
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Trial columns added:');
    result.rows.forEach(row => console.log(`   ✅ ${row.column_name}`));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();



