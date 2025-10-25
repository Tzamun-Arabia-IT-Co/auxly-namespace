-- Add Device Limit Management
-- Allows per-user device limits and audit logging

-- Add max_devices column to users table (default 2, max 100)
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 2 NOT NULL;

-- Add constraint to ensure max_devices is between 1 and 100
ALTER TABLE users ADD CONSTRAINT check_max_devices_range 
    CHECK (max_devices >= 1 AND max_devices <= 100);

-- Create audit log table for device limit changes
CREATE TABLE IF NOT EXISTS device_limit_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    old_limit INTEGER NOT NULL,
    new_limit INTEGER NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    
    -- Foreign keys
    CONSTRAINT fk_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_admin
        FOREIGN KEY (admin_id) 
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Index for querying audit logs by user
CREATE INDEX IF NOT EXISTS idx_device_limit_audit_user_id 
ON device_limit_audit_log(user_id);

-- Index for querying audit logs by admin
CREATE INDEX IF NOT EXISTS idx_device_limit_audit_admin_id 
ON device_limit_audit_log(admin_id);

-- Index for querying audit logs by date
CREATE INDEX IF NOT EXISTS idx_device_limit_audit_changed_at 
ON device_limit_audit_log(changed_at DESC);

-- Comments for documentation
COMMENT ON TABLE device_limit_audit_log IS 'Audit log for tracking device limit changes by admins';
COMMENT ON COLUMN device_limit_audit_log.user_id IS 'User whose device limit was changed';
COMMENT ON COLUMN device_limit_audit_log.admin_id IS 'Admin who made the change';
COMMENT ON COLUMN device_limit_audit_log.old_limit IS 'Previous device limit';
COMMENT ON COLUMN device_limit_audit_log.new_limit IS 'New device limit';
COMMENT ON COLUMN device_limit_audit_log.reason IS 'Optional reason for the change';
COMMENT ON COLUMN users.max_devices IS 'Maximum number of devices this user can connect (1-100)';






