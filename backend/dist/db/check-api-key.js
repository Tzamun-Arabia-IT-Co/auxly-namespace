"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("./connection"));
async function checkApiKey() {
    try {
        const result = await connection_1.default.query(`
      SELECT 
        ak.id,
        ak.user_id,
        ak.key_preview,
        ak.name,
        u.email,
        ak.created_at
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = crypt('auxly_16c3077b87d9d62e7ce6da4f4940d418eb85a6fa5d114bf57a523533399f0984', ak.key_hash)
    `);
        console.log('\n🔑 API Key Info:');
        if (result.rows.length > 0) {
            console.table(result.rows);
            console.log('\n✅ API key is valid and belongs to user:', result.rows[0].email);
        }
        else {
            console.log('❌ API key not found in database!');
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await connection_1.default.end();
    }
}
checkApiKey();
//# sourceMappingURL=check-api-key.js.map