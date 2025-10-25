"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeyIdentifier = exports.maskApiKey = exports.validateApiKeyFormat = exports.generateApiKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const KEY_PREFIX = 'auxly_';
const KEY_BYTES = 32; // 256 bits of entropy
/**
 * Generate a secure random API key
 * Format: auxly_[64 hex characters]
 * Total length: 70 characters
 */
const generateApiKey = () => {
    // Generate 32 cryptographically secure random bytes
    const randomBytes = crypto_1.default.randomBytes(KEY_BYTES);
    // Convert to hex string (64 characters)
    const randomHex = randomBytes.toString('hex');
    // Combine prefix with random hex
    return `${KEY_PREFIX}${randomHex}`;
};
exports.generateApiKey = generateApiKey;
/**
 * Validate API key format
 * Returns true if key matches expected format
 */
const validateApiKeyFormat = (key) => {
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
exports.validateApiKeyFormat = validateApiKeyFormat;
/**
 * Mask API key for display purposes
 * Shows: auxly_abc...xyz (first 3 and last 3 chars of random part)
 */
const maskApiKey = (key) => {
    if (!(0, exports.validateApiKeyFormat)(key)) {
        return '***invalid***';
    }
    const randomPart = key.slice(KEY_PREFIX.length);
    const masked = `${KEY_PREFIX}${randomPart.slice(0, 3)}...${randomPart.slice(-3)}`;
    return masked;
};
exports.maskApiKey = maskApiKey;
/**
 * Extract key ID from full key (for display purposes)
 * Returns last 8 characters as identifier
 */
const getKeyIdentifier = (key) => {
    if (!(0, exports.validateApiKeyFormat)(key)) {
        return 'invalid';
    }
    return key.slice(-8);
};
exports.getKeyIdentifier = getKeyIdentifier;
//# sourceMappingURL=key-generator.js.map