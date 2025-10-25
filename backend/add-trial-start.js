require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function addTrialStart() {
  try {
    console.log('Adding trial_start column...');
    
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE;
    `);
    
    console.log('✅ trial_start column added');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_trial_start ON users(trial_start);
    `);
    
    console.log('✅ Index created');
    
    await pool.query(`
      COMMENT ON COLUMN users.trial_start IS 'Trial start date for new users';
    `);
    
    console.log('✅ Comment added');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name LIKE 'trial%'
      ORDER BY column_name;
    `);
    
    console.log('\n📋 All trial columns:');
    result.rows.forEach(row => console.log(`   ✅ ${row.column_name}`));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTrialStart();



