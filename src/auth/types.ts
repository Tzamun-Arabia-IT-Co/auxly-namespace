/**
 * Authentication Type Definitions
 */

import { User } from '../api/types';

/**
 * Authentication state
 */
export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
}

/**
 * Auth state change event
 */
export type AuthStateChangeListener = (state: AuthState) => void;

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
}







