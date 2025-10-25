"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
async function createProSubscription() {
    try {
        console.log('\n🔄 Creating PRO subscription for user ID 3...\n');
        // Check current state
        const before = await (0, connection_1.query)(`
      SELECT u.id, u.email, s.plan_tier, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = 3
    `);
        console.log('📊 BEFORE:');
        console.table(before.rows);
        // Check if subscription exists
        const existing = await (0, connection_1.query)('SELECT * FROM subscriptions WHERE user_id = $1', [3]);
        let result;
        if (existing.rows.length === 0) {
            // Create new subscription
            console.log('\n➕ Creating new PRO subscription...');
            result = await (0, connection_1.query)(`INSERT INTO subscriptions (user_id, plan_tier, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`, [3, 'pro', 'active']);
            console.log('✅ Subscription created!');
        }
        else {
            // Update existing subscription
            console.log('\n🔄 Updating to PRO subscription...');
            result = await (0, connection_1.query)(`UPDATE subscriptions 
         SET plan_tier = $1, 
             status = $2,
             updated_at = NOW()
         WHERE user_id = $3
         RETURNING *`, ['pro', 'active', 3]);
            console.log('✅ Subscription updated!');
        }
        console.table(result.rows);
        // Verify final state
        const after = await (0, connection_1.query)(`
      SELECT u.id, u.email, s.plan_tier, s.status, s.created_at, s.updated_at
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.id = 3
    `);
        console.log('\n📊 AFTER:');
        console.table(after.rows);
        if (after.rows[0]?.plan_tier === 'pro') {
            console.log('\n🎉 SUCCESS! User upgraded to PRO plan!\n');
        }
        else {
            console.log('\n⚠️ WARNING: Something went wrong!\n');
        }
        await connection_1.pool.end();
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
        await connection_1.pool.end();
        process.exit(1);
    }
}
createProSubscription();
//# sourceMappingURL=create-pro-subscription.js.map