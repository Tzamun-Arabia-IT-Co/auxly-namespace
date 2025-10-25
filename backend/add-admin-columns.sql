-- Add admin and blocked columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false NOT NULL;

-- Make yourself an admin (user ID 3)
UPDATE users SET is_admin = true WHERE id = 3;

-- Verify
SELECT id, email, is_admin, is_blocked FROM users;


