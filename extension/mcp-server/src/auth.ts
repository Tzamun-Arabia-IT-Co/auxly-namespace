/**
 * Authentication Manager
 * Handles JWT tokens and authentication state
 */

import { AuthTokens } from './types.js';

export class AuthManager {
    private tokens: AuthTokens | null = null;

    /**
     * Set authentication tokens
     */
    setTokens(tokens: AuthTokens): void {
        this.tokens = {
            ...tokens,
            expiresAt: tokens.expiresAt || Date.now() + (15 * 60 * 1000) // Default 15 min
        };
    }

    /**
     * Get current access token
     */
    getAccessToken(): string | null {
        if (!this.tokens) {
            return null;
        }

        // Check if token is expired
        if (this.tokens.expiresAt && Date.now() >= this.tokens.expiresAt) {
            return null;
        }

        return this.tokens.accessToken;
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return this.tokens?.refreshToken || null;
    }

    /**
     * Clear tokens (logout)
     */
    clearTokens(): void {
        this.tokens = null;
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.getAccessToken() !== null;
    }
}







