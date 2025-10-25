const axios = require('axios');

async function testAuthMe() {
  try {
    // Test the /auth/me endpoint
    console.log('🧪 Testing /auth/me endpoint...\n');
    
    // You need to provide a valid token
    console.log('⚠️  To test, you need to:');
    console.log('1. Login at https://auxly.tzamun.com/login');
    console.log('2. Open browser console (F12)');
    console.log('3. Run: localStorage.getItem("token")');
    console.log('4. Copy the token');
    console.log('5. Run this command:\n');
    console.log('   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:7000/api/auth/me\n');
    console.log('Expected response should include:');
    console.log('  - max_devices: 12');
    console.log('  - plan_tier: "pro"');
    console.log('  - subscription_status: "active"');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuthMe();








