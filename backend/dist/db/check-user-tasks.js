"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("./connection"));
async function checkUserTasks() {
    try {
        // Check all users
        const users = await connection_1.default.query(`
      SELECT id, email, created_at 
      FROM users 
      ORDER BY id
    `);
        console.log('\n📧 All Users:');
        console.table(users.rows);
        // Check all tasks with user info
        const tasks = await connection_1.default.query(`
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
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await connection_1.default.end();
    }
}
checkUserTasks();
//# sourceMappingURL=check-user-tasks.js.map