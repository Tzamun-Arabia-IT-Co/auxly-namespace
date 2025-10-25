const { Pool } = require('pg');

async function checkAndFixDevice() {
  const pool = new Pool({
    host: 'rnd.tzamun.com',
    port: 5432,
    database: 'Auxly',
    user: 'wsamoum',
    password: 'W@el401962',
  });

  try {
    console.log('🔍 Checking devices for API key ID 15...\n');
    
    // Check current devices
    const devices = await pool.query(`
      SELECT * FROM api_key_devices 
      WHERE api_key_id = 15
      ORDER BY last_used_at DESC
    `);
    
    console.log('📊 Current devices:');
    console.table(devices.rows);

    if (devices.rows.length > 0) {
      const device = devices.rows[0];
      
      // Check if device info is NULL or "Unknown"
      if (!device.device_name || device.device_name.includes('Unknown') ||
          !device.os_info || device.os_info.includes('Unknown')) {
        
        console.log('\n🔧 Fixing device with better default values...');
        
        const result = await pool.query(`
          UPDATE api_key_devices 
          SET 
            device_name = COALESCE(NULLIF(device_name, 'Unknown OS - Unknown Browser'), 'VS Code Extension - Cursor'),
            os_info = COALESCE(NULLIF(os_info, 'Unknown OS'), 'Windows (detecting...)'),
            browser_info = COALESCE(NULLIF(browser_info, 'Unknown Browser'), 'VS Code Extension'),
            last_used_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [device.id]);
        
        console.log('\n✅ Device updated:');
        console.table(result.rows);
      } else {
        console.log('\n✅ Device already has proper info!');
      }
    } else {
      console.log('\n⚠️ No devices found for API key ID 15');
    }

    // Show final state
    const final = await pool.query(`
      SELECT 
        d.id,
        d.api_key_id,
        d.device_name,
        d.os_info,
        d.browser_info,
        d.first_used_at,
        d.last_used_at
      FROM api_key_devices d
      WHERE d.api_key_id = 15
      ORDER BY d.last_used_at DESC
    `);

    console.log('\n📊 FINAL STATE:');
    console.table(final.rows);

    await pool.end();
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await pool.end();
  }
}

checkAndFixDevice();

