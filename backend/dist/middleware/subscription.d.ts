import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            subscription?: {
                plan_tier: string;
                status: string;
                features: {
                    tasks_per_month: number;
                    workspaces: number;
                    history_days: number;
                    team_features?: boolean;
                    priority_support?: boolean;
                };
            };
        }
    }
}
/**
 * Attach subscription info to request
 * Should be used after authentication middleware
 */
export declare const attachSubscription: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Require specific subscription tier
 * @param allowedTiers Array of tier names that are allowed
 */
export declare const requireTier: (allowedTiers: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Check if subscription is active
 * Returns 402 Payment Required if subscription is not active
 */
export declare const requireActiveSubscription: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=subscription.d.ts.map