export class AuthManager {
    tokens = null;
    setTokens(tokens) {
        this.tokens = {
            ...tokens,
            expiresAt: tokens.expiresAt || Date.now() + (15 * 60 * 1000)
        };
    }
    getAccessToken() {
        if (!this.tokens) {
            return null;
        }
        if (this.tokens.expiresAt && Date.now() >= this.tokens.expiresAt) {
            return null;
        }
        return this.tokens.accessToken;
    }
    getRefreshToken() {
        return this.tokens?.refreshToken || null;
    }
    clearTokens() {
        this.tokens = null;
    }
    isAuthenticated() {
        return this.getAccessToken() !== null;
    }
}
//# sourceMappingURL=auth.js.map