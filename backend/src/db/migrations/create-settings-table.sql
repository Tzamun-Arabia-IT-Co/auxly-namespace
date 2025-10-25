-- Create system_settings table for storing global admin settings
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('default_free_device_limit', '2', 'Default device limit for free tier users'),
  ('default_pro_device_limit', '10', 'Default device limit for PRO tier users'),
  ('default_plan_tier', 'pro', 'Default plan tier for new users during launch campaign')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);










