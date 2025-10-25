-- Upgrade all existing users to PRO plan
-- Run this once to give everyone free PRO access!

UPDATE subscriptions 
SET plan_tier = 'pro', 
    status = 'active',
    updated_at = NOW()
WHERE plan_tier = 'free';

-- Check results
SELECT 
    u.id,
    u.email,
    s.plan_tier,
    s.status,
    s.updated_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC;

