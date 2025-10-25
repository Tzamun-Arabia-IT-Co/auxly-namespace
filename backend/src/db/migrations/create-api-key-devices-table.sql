-- Create API Key Devices Table for Device Tracking
-- Enforces 2-device limit per API key to prevent multi-user sharing

CREATE TABLE IF NOT EXISTS api_key_devices (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    os_info VARCHAR(100),
    browser_info VARCHAR(100),
    first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    
    -- Foreign key to api_keys table
    CONSTRAINT fk_api_key
        FOREIGN KEY (api_key_id) 
        REFERENCES api_keys(id)
        ON DELETE CASCADE,
    
    -- Unique constraint: one fingerprint per API key
    CONSTRAINT unique_device_per_key
        UNIQUE (api_key_id, device_fingerprint),
    
    -- Index for fast lookups
    CONSTRAINT idx_api_key_devices_key_id
        UNIQUE (api_key_id, device_fingerprint)
);

-- Index for querying devices by API key
CREATE INDEX IF NOT EXISTS idx_api_key_devices_api_key_id 
ON api_key_devices(api_key_id);

-- Index for querying by fingerprint
CREATE INDEX IF NOT EXISTS idx_api_key_devices_fingerprint 
ON api_key_devices(device_fingerprint);

-- Index for last used queries
CREATE INDEX IF NOT EXISTS idx_api_key_devices_last_used 
ON api_key_devices(last_used_at DESC);

-- Comments for documentation
COMMENT ON TABLE api_key_devices IS 'Tracks devices connected to each API key (max 2 devices per key)';
COMMENT ON COLUMN api_key_devices.device_fingerprint IS 'Unique hash identifying the device (machine ID + browser + OS)';
COMMENT ON COLUMN api_key_devices.device_name IS 'Human-readable device name (e.g., Windows 10 - Chrome)';
COMMENT ON COLUMN api_key_devices.first_used_at IS 'When this device first connected with this API key';
COMMENT ON COLUMN api_key_devices.last_used_at IS 'Most recent connection from this device';






