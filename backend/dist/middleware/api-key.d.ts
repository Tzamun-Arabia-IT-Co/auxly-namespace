import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            apiKeyUser?: {
                user_id: number;
                api_key_id: number;
                email: string;
                subscription: {
                    plan_tier: string;
                    status: string;
                };
            };
        }
    }
}
/**
 * API Key authentication middleware
 * Validates API key from header and attaches user info to request
 */
export declare const authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional API key authentication
 * Does not fail if no key provided, but validates if present
 */
export declare const optionalApiKeyAuth: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=api-key.d.ts.map