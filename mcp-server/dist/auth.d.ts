import { AuthTokens } from './types.js';
export declare class AuthManager {
    private tokens;
    setTokens(tokens: AuthTokens): void;
    getAccessToken(): string | null;
    getRefreshToken(): string | null;
    clearTokens(): void;
    isAuthenticated(): boolean;
}
//# sourceMappingURL=auth.d.ts.map