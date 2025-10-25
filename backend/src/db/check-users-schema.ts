import pool from './connection';

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table schema:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();



























