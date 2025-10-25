-- Cleanup script for old device fingerprints
-- Run this to remove old vscode-* fingerprints so new MAC-based ones can register

-- Show current devices before cleanup
SELECT 
  id,
  api_key_id,
  device_fingerprint,
  device_name,
  last_used_at
FROM api_key_devices
ORDER BY last_used_at DESC;

-- Delete old vscode-* fingerprints (they will re-register with MAC address)
-- UNCOMMENT THE LINE BELOW TO EXECUTE:
-- DELETE FROM api_key_devices WHERE device_fingerprint LIKE 'vscode-%';

-- After deletion, the extension will automatically re-register with MAC address format
-- The new fingerprint will be: mac-XX:XX:XX:XX:XX:XX

-- Verify cleanup (run after uncommenting DELETE above)
-- SELECT COUNT(*) as remaining_devices FROM api_key_devices;






