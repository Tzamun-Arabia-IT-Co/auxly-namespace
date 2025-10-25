import pool from './connection';

async function checkUserTasks() {
  try {
    // Check all users
    const users = await pool.query(`
      SELECT id, email, created_at 
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n📧 All Users:');
    console.table(users.rows);
    
    // Check all tasks with user info
    const tasks = await pool.query(`
      SELECT 
        t.id,
        t.user_id,
        u.email as user_email,
        t.title,
        t.status,
        t.priority,
        t.created_at
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.id
    `);
    
    console.log('\n📋 All Tasks:');
    console.table(tasks.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUserTasks();



























