const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkSubscriptions() {
  try {
    // Check subscriptions table structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Subscriptions table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Check user subscriptions
    console.log('\nUser subscriptions:');
    const subsResult = await pool.query(`
      SELECT u.id, u.email, u.max_devices, s.plan_tier, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      ORDER BY u.id
    `);
    
    subsResult.rows.forEach(row => {
      console.log(`  - [ID:${row.id}] ${row.email}: Plan=${row.plan_tier || 'NO SUBSCRIPTION'}, Status=${row.status || 'N/A'}, MaxDevices=${row.max_devices}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkSubscriptions();

