/**
 * Manual script to create tasks table
 * Run with: npx tsx src/db/create-tasks-table.ts
 */

import pool from './connection';

async function createTasksTable() {

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
      priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
  `;

  try {
    await pool.query(createTableSQL);
    console.log('✅ Tasks table created successfully!');
    console.log('✅ Indexes created successfully!');
  } catch (error) {
    console.error('❌ Error creating tasks table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTasksTable().catch(console.error);

