import bcrypt from 'bcrypt';
import { pool } from '../src/db/connection';
import { generateBetaAPIKey } from '../src/utils/key-generator';

async function createBetaUser() {
  try {
    console.log('\n🔑 Creating Beta User with API Key...\n');
    
    const username = 'developer';
    const password = 'developer123';
    const email = 'developer@auxly.com';
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate API key
    const apiKey = generateBetaAPIKey(username);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO beta_users (username, password_hash, email, api_key, is_active, created_by) 
       VALUES ($1, $2, $3, $4, true, 'admin') 
       RETURNING id, username, email, api_key, created_at`,
      [username, passwordHash, email, apiKey]
    );
    
    const user = result.rows[0];
    
    console.log('✅ Beta User Created Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Username:', user.username);
    console.log('🔐 Password:', password);
    console.log('📧 Email:', user.email);
    console.log('🆔 User ID:', user.id);
    console.log('📅 Created:', user.created_at);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 API KEY (COPY THIS):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(user.api_key);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 How to use this API key:');
    console.log('1. Open Cursor IDE');
    console.log('2. Install Auxly extension');
    console.log('3. Run: Auxly: Connect API Key');
    console.log('4. Paste the API key above\n');
    
    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('\n❌ User already exists. Fetching existing API key...\n');
      try {
        const result = await pool.query(
          'SELECT id, username, email, api_key, created_at FROM beta_users WHERE username = $1',
          ['developer']
        );
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('👤 Username:', user.username);
          console.log('📧 Email:', user.email);
          console.log('🆔 User ID:', user.id);
          console.log('📅 Created:', user.created_at);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('\n🔑 API KEY (COPY THIS):');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(user.api_key);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      } catch (fetchError) {
        console.error('Error fetching user:', fetchError);
      }
    } else {
      console.error('\n❌ Error creating user:', error);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createBetaUser();


