import { User } from '../types/database';
export interface RegisterInput {
    email: string;
    password: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: {
        id: number;
        email: string;
        created_at: Date;
    };
    error?: string;
}
/**
 * Validate email format
 */
export declare const validateEmail: (email: string) => boolean;
/**
 * Validate password strength
 */
export declare const validatePassword: (password: string) => {
    valid: boolean;
    error?: string;
};
/**
 * Hash password using bcrypt
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compare password with hash
 */
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
/**
 * Generate JWT token
 */
export declare const generateToken: (userId: number, email: string) => string;
/**
 * Verify JWT token
 */
export declare const verifyToken: (token: string) => {
    id: number;
    email: string;
} | null;
/**
 * Register new user
 */
export declare const registerUser: (input: RegisterInput) => Promise<AuthResponse>;
/**
 * Login user
 */
export declare const loginUser: (input: LoginInput) => Promise<AuthResponse>;
/**
 * Get user by ID
 */
export declare const getUserById: (userId: number) => Promise<User | null>;
//# sourceMappingURL=auth.d.ts.map