import bcrypt from 'bcrypt';
import { pool } from '../src/db/connection';

async function createDummyUser() {
  try {
    console.log('\n👤 Creating Dummy User for Testing\n');
    
    // Dummy user credentials
    const email = 'test@auxly.com';
    const password = 'test123456';
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password: ${password}`);
    console.log('');
    
    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      console.log(`⚠️  User "${email}" already exists`);
      console.log('\n💡 Updating password...');
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [passwordHash, email]
      );
      
      console.log('✅ Password updated successfully!\n');
    } else {
      console.log('⏳ Creating new user...');
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Insert user with trial
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, trial_start, trial_end, trial_status)
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days', 'active')
         RETURNING id, email, trial_start, trial_end`,
        [email, passwordHash]
      );
      
      const user = result.rows[0];
      
      console.log('\n✅ User created successfully!');
      console.log(`🆔 ID: ${user.id}`);
      console.log(`📅 Trial Start: ${user.trial_start}`);
      console.log(`📅 Trial End: ${user.trial_end}\n`);
    }
    
    console.log('🔗 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Login at:');
    console.log('   http://localhost:5173/login');
    console.log('\n💡 Use these credentials to test the user dashboard\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating user:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createDummyUser();






