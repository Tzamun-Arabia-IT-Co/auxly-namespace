"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("./connection"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function runExpirationMigration() {
    try {
        console.log('🔄 Running API key expiration migration...\n');
        // Read the migration SQL file
        const migrationPath = path_1.default.join(__dirname, 'migrations', 'add-api-key-expiration.sql');
        const migrationSQL = fs_1.default.readFileSync(migrationPath, 'utf8');
        // Execute the migration
        await connection_1.default.query(migrationSQL);
        console.log('✅ Migration completed successfully!');
        console.log('   - Added expires_at column to api_keys table');
        console.log('   - Set 12-month expiration for existing keys');
        console.log('   - Created performance indexes\n');
        // Verify the changes
        const result = await connection_1.default.query(`
      SELECT 
        COUNT(*) as total_keys,
        COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_keys,
        COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_keys
      FROM api_keys
    `);
        console.log('📊 Current API Keys Status:');
        console.table(result.rows);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
    finally {
        await connection_1.default.end();
    }
}
// Run if called directly
if (require.main === module) {
    runExpirationMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
exports.default = runExpirationMigration;
//# sourceMappingURL=run-expiration-migration.js.map