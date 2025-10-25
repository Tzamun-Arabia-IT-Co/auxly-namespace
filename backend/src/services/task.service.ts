import { getPool } from '../db/connection';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskData {
  user_id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskData): Promise<Task> {
  const pool = getPool();

  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, description, priority, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.user_id,
      data.title,
      data.description || null,
      data.priority,
      JSON.stringify(data.tags),
    ]
  );

  const task = result.rows[0];
  return {
    ...task,
    tags: typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags,
  };
}

/**
 * Get all tasks for a user, optionally filtered by status
 */
export async function getTasks(userId: number, status?: string): Promise<Task[]> {
  const pool = getPool();

  let query = `SELECT * FROM tasks WHERE user_id = $1`;
  const params: any[] = [userId];

  if (status) {
    query += ` AND status = $2`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, params);

  return result.rows.map((task) => ({
    ...task,
    tags: typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags,
  }));
}

/**
 * Get a specific task by ID
 */
export async function getTaskById(taskId: number, userId: number): Promise<Task | null> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT * FROM tasks WHERE id = $1 AND user_id = $2`,
    [taskId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const task = result.rows[0];
  return {
    ...task,
    tags: typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags,
  };
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: number,
  userId: number,
  updates: UpdateTaskData
): Promise<Task | null> {
  const pool = getPool();

  // Build dynamic update query
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.title !== undefined) {
    updateFields.push(`title = $${paramCount++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    updateFields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    updateFields.push(`status = $${paramCount++}`);
    values.push(updates.status);
  }
  if (updates.priority !== undefined) {
    updateFields.push(`priority = $${paramCount++}`);
    values.push(updates.priority);
  }

  if (updateFields.length === 0) {
    // No updates provided, just return the existing task
    return getTaskById(taskId, userId);
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(taskId, userId);

  const query = `
    UPDATE tasks
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount++} AND user_id = $${paramCount++}
    RETURNING *
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    return null;
  }

  const task = result.rows[0];
  return {
    ...task,
    tags: typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags,
  };
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number, userId: number): Promise<boolean> {
  const pool = getPool();

  const result = await pool.query(
    `DELETE FROM tasks WHERE id = $1 AND user_id = $2`,
    [taskId, userId]
  );

  return (result.rowCount || 0) > 0;
}

