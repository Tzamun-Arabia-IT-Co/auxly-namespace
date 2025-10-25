import crypto from 'crypto';

const KEY_PREFIX = 'auxly_';
const KEY_BYTES = 32; // 256 bits of entropy

/**
 * Generate a secure random API key
 * Format: auxly_[64 hex characters]
 * Total length: 70 characters
 */
export const generateApiKey = (): string => {
  // Generate 32 cryptographically secure random bytes
  const randomBytes = crypto.randomBytes(KEY_BYTES);
  
  // Convert to hex string (64 characters)
  const randomHex = randomBytes.toString('hex');
  
  // Combine prefix with random hex
  return `${KEY_PREFIX}${randomHex}`;
};

/**
 * Validate API key format
 * Returns true if key matches expected format
 */
export const validateApiKeyFormat = (key: string): boolean => {
  // Check if key starts with prefix
  if (!key.startsWith(KEY_PREFIX)) {
    return false;
  }
  
  // Check total length (prefix + 64 hex chars = 70)
  const expectedLength = KEY_PREFIX.length + (KEY_BYTES * 2);
  if (key.length !== expectedLength) {
    return false;
  }
  
  // Check if suffix is valid hex
  const suffix = key.slice(KEY_PREFIX.length);
  const hexRegex = /^[0-9a-f]+$/;
  return hexRegex.test(suffix);
};

/**
 * Mask API key for display purposes
 * Shows: auxly_abc...xyz (first 3 and last 3 chars of random part)
 */
export const maskApiKey = (key: string): string => {
  if (!validateApiKeyFormat(key)) {
    return '***invalid***';
  }
  
  const randomPart = key.slice(KEY_PREFIX.length);
  const masked = `${KEY_PREFIX}${randomPart.slice(0, 3)}...${randomPart.slice(-3)}`;
  
  return masked;
};

/**
 * Extract key ID from full key (for display purposes)
 * Returns last 8 characters as identifier
 */
export const getKeyIdentifier = (key: string): string => {
  if (!validateApiKeyFormat(key)) {
    return 'invalid';
  }
  
  return key.slice(-8);
};


