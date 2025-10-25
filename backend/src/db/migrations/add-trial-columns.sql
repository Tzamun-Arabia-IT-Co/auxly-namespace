-- Add Trial Management Columns
-- Adds trial tracking for OAuth users

-- Add trial columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_status VARCHAR(20) DEFAULT 'active';

-- Add index for querying trial status
CREATE INDEX IF NOT EXISTS idx_users_trial_status ON users(trial_status);
CREATE INDEX IF NOT EXISTS idx_users_trial_end ON users(trial_end);

-- Comments for documentation
COMMENT ON COLUMN users.trial_start IS 'Trial start date for new users';
COMMENT ON COLUMN users.trial_end IS 'Trial end date (7 days from start)';
COMMENT ON COLUMN users.trial_status IS 'Trial status: active, expired, or upgraded';



