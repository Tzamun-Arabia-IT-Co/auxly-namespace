import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface User {
            id: number;
            email: string;
        }
    }
}
/**
 * Authentication middleware - Verifies JWT token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware - Does not fail if no token provided
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
export declare const optionalAuthenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map