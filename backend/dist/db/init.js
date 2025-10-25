"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
/**
 * Initialize database connection and verify it's working
 */
async function initializeDatabase() {
    console.log('🔄 Initializing Auxly database connection...');
    try {
        await (0, connection_1.testConnection)();
        console.log('✅ Database initialization complete');
        await (0, connection_1.closePool)();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        await (0, connection_1.closePool)();
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    initializeDatabase();
}
exports.default = initializeDatabase;
//# sourceMappingURL=init.js.map