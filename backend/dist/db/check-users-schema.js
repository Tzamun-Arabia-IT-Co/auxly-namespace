"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("./connection"));
async function checkSchema() {
    try {
        const result = await connection_1.default.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
        console.log('Users table schema:');
        console.table(result.rows);
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await connection_1.default.end();
    }
}
checkSchema();
//# sourceMappingURL=check-users-schema.js.map