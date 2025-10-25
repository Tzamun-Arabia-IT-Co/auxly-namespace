-- Add expiration column to api_keys table
-- API keys will expire 12 months after creation

-- Add expires_at column (nullable initially for existing keys)
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Set expiration for existing keys (12 months from creation)
UPDATE api_keys 
SET expires_at = created_at + INTERVAL '12 months'
WHERE expires_at IS NULL;

-- Make expires_at NOT NULL for future records
ALTER TABLE api_keys 
ALTER COLUMN expires_at SET NOT NULL;

-- Create index for faster expiration checks
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Create index for checking non-expired, non-revoked keys
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(revoked, expires_at) 
WHERE revoked = false;

COMMENT ON COLUMN api_keys.expires_at IS 'API key expiration timestamp (12 months from creation)';






