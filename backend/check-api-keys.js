const pg = require('pg');

const pool = new pg.Pool({
  host: 'rnd.tzamun.com',
  port: 5432,
  database: 'Auxly',
  user: 'wsamoum',
  password: 'AioD.2024'
});

pool.query(`
  SELECT 
    id, 
    created_at, 
    expires_at, 
    EXTRACT(EPOCH FROM (expires_at - created_at))/(60*60*24) as days_valid
  FROM api_keys 
  ORDER BY created_at DESC 
  LIMIT 5
`).then(result => {
  console.log('\n=== Recent API Keys ===\n');
  result.rows.forEach(row => {
    const days = Math.round(row.days_valid);
    const createdDate = new Date(row.created_at).toLocaleString();
    const expiresDate = new Date(row.expires_at).toLocaleString();
    console.log(`ID: ${row.id}`);
    console.log(`  Created: ${createdDate}`);
    console.log(`  Expires: ${expiresDate}`);
    console.log(`  Valid for: ${days} days (${days === 365 ? '1 year' : days >= 180 && days <= 183 ? '6 months ✅' : days + ' days'})`);
    console.log('');
  });
  pool.end();
}).catch(error => {
  console.error('Database error:', error.message);
  pool.end();
  process.exit(1);
});






