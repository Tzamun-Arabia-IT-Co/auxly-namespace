import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use same connection config as the main app
const pool = new Pool({
  host: process.env.DB_HOST || 'rnd.tzamun.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'Auxly',
  user: process.env.DB_USER || 'wsamoum',
  password: process.env.DB_PASSWORD || 'W@el401962',
  connectionTimeoutMillis: 5000
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Running migration: 005_create_beta_tables.sql\n');
    console.log('📊 Database config:', {
      host: process.env.DB_HOST || 'rnd.tzamun.com',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'Auxly',
      user: process.env.DB_USER || 'wsamoum'
    });
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/005_create_beta_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\n⏳ Executing migration...\n');
    
    // Execute the migration
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('beta_users', 'beta_admins', 'api_key_usage')
      ORDER BY table_name
    `);
    
    console.log('📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Check indexes
    const indexesResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('beta_users', 'api_key_usage')
      ORDER BY indexname
    `);
    
    console.log('\n📊 Indexes created:');
    indexesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.indexname}`);
    });
    
    // Check view
    const viewResult = await client.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE viewname = 'beta_user_stats'
    `);
    
    if (viewResult.rows.length > 0) {
      console.log('\n📈 View created:');
      console.log(`   ✓ beta_user_stats`);
    }
    
    console.log('\n✨ Database is ready for beta portal!\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('🎉 All done! You can now create an admin user.');
    console.log('👉 Run: npx ts-node scripts/create-admin.ts\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });


