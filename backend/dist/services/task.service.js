"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.getTasks = getTasks;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
const connection_1 = require("../db/connection");
/**
 * Create a new task
 */
async function createTask(data) {
    const pool = (0, connection_1.getPool)();
    const result = await pool.query(`INSERT INTO tasks (user_id, title, description, priority, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`, [
        data.user_id,
        data.title,
        data.description || null,
        data.priority,
        JSON.stringify(data.tags),
    ]);
    const task = result.rows[0];
    return {
        ...task,
        tags: typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags,
    };
}
/**
 * Get all tasks for a user, optionally filtered by status
 */
async function getTasks(userId, status) {
    const pool = (0, connection_1.getPool)();
    let query = `SELECT * FROM tasks WHERE user_id = $1`;
    const params = [userId];
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
async function getTaskById(taskId, userId) {
    const pool = (0, connection_1.getPool)();
    const result = await pool.query(`SELECT * FROM tasks WHERE id = $1 AND user_id = $2`, [taskId, userId]);
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
async function updateTask(taskId, userId, updates) {
    const pool = (0, connection_1.getPool)();
    // Build dynamic update query
    const updateFields = [];
    const values = [];
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
async function deleteTask(taskId, userId) {
    const pool = (0, connection_1.getPool)();
    const result = await pool.query(`DELETE FROM tasks WHERE id = $1 AND user_id = $2`, [taskId, userId]);
    return (result.rowCount || 0) > 0;
}
//# sourceMappingURL=task.service.js.map