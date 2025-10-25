import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to verify admin access
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=admin-auth.d.ts.map