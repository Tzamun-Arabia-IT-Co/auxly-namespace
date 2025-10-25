import bcrypt from 'bcrypt';
import { pool } from '../src/db/connection';

async function createAdmin() {
  try {
    console.log('\n🔐 Auxly Beta - Create Admin User\n');
    
    // Get credentials from command line or use defaults
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    
    if (!username || username.length < 3) {
      console.error('❌ Username must be at least 3 characters');
      console.log('\n💡 Usage: npx ts-node scripts/create-admin.ts <username> <password>');
      process.exit(1);
    }
    
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      console.log('\n💡 Usage: npx ts-node scripts/create-admin.ts <username> <password>');
      process.exit(1);
    }
    
    console.log(`📝 Username: ${username}`);
    console.log(`🔒 Password: ${'*'.repeat(password.length)}`);
    console.log('');
    
    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM beta_admins WHERE username = $1',
      [username]
    );
    
    if (existing.rows.length > 0) {
      console.log(`⚠️  Admin user "${username}" already exists`);
      console.log('\n💡 Updating password...');
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE beta_admins SET password_hash = $1, updated_at = NOW() WHERE username = $2',
        [passwordHash, username]
      );
      
      console.log('✅ Password updated successfully!\n');
    } else {
      console.log('⏳ Creating new admin user...');
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Insert admin
      const result = await pool.query(
        'INSERT INTO beta_admins (username, password_hash) VALUES ($1, $2) RETURNING id, created_at',
        [username, passwordHash]
      );
      
      const admin = result.rows[0];
      
      console.log('\n✅ Admin user created successfully!');
      console.log(`🆔 ID: ${admin.id}`);
      console.log(`📅 Created: ${admin.created_at}\n`);
    }
    
    console.log('🔗 Admin credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Access the admin panel at:');
    console.log('   http://localhost:7000/');
    console.log('\n💡 Use these credentials to login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();


