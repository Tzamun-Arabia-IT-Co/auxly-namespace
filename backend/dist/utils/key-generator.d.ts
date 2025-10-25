/**
 * Generate a secure random API key
 * Format: auxly_[64 hex characters]
 * Total length: 70 characters
 */
export declare const generateApiKey: () => string;
/**
 * Validate API key format
 * Returns true if key matches expected format
 */
export declare const validateApiKeyFormat: (key: string) => boolean;
/**
 * Mask API key for display purposes
 * Shows: auxly_abc...xyz (first 3 and last 3 chars of random part)
 */
export declare const maskApiKey: (key: string) => string;
/**
 * Extract key ID from full key (for display purposes)
 * Returns last 8 characters as identifier
 */
export declare const getKeyIdentifier: (key: string) => string;
//# sourceMappingURL=key-generator.d.ts.map