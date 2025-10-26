/**
 * Authentication Service
 * Handles user authentication, login/logout flows, and auth state management
 */

import * as vscode from 'vscode';
import { ApiClient } from '../api/api-client';
import { User, LoginRequest, ApiError } from '../api/types';
import { AuthState, AuthStateChangeListener, LoginCredentials } from './types';

/**
 * AuthService Singleton
 * Manages authentication state and provides login/logout functionality
 */
export class AuthService {
    private static instance: AuthService;
    private apiClient: ApiClient | null = null;
    private currentUser: User | null = null;
    private authStateListeners: AuthStateChangeListener[] = [];

    private constructor() {}

    /**
     * Get singleton instance
     */
    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * Initialize auth service with API client
     */
    initialize(apiClient: ApiClient): void {
        this.apiClient = apiClient;
    }

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChanged(listener: AuthStateChangeListener): vscode.Disposable {
        this.authStateListeners.push(listener);
        
        // Return disposable to allow unsubscribe
        return {
            dispose: () => {
                const index = this.authStateListeners.indexOf(listener);
                if (index > -1) {
                    this.authStateListeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify all listeners of auth state change
     */
    private notifyAuthStateChanged(): void {
        const state = this.getAuthState();
        this.authStateListeners.forEach(listener => {
            try {
                listener(state);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    /**
     * Get current auth state
     */
    getAuthState(): AuthState {
        return {
            isAuthenticated: !!this.currentUser,
            user: this.currentUser
        };
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        if (!this.apiClient) {
            return false;
        }
        return await this.apiClient.isAuthenticated();
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Validate email format
     */
    private validateEmail(email: string): string | null {
        if (!email || email.trim() === '') {
            return 'Please enter your email address';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }

        return null;
    }

    /**
     * Validate password
     */
    private validatePassword(password: string): string | null {
        if (!password || password.trim() === '') {
            return 'Please enter your password';
        }

        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }

        return null;
    }

    /**
     * Login with interactive prompts
     */
    async login(): Promise<boolean> {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return false;
        }

        try {
            // Prompt for email
            const email = await vscode.window.showInputBox({
                prompt: 'Enter your Auxly email address',
                placeHolder: 'user@example.com',
                ignoreFocusOut: true,
                validateInput: (value) => this.validateEmail(value)
            });

            // User cancelled
            if (email === undefined) {
                return false;
            }

            // Prompt for password
            const password = await vscode.window.showInputBox({
                prompt: 'Enter your Auxly password',
                password: true, // Masks input
                ignoreFocusOut: true,
                validateInput: (value) => this.validatePassword(value)
            });

            // User cancelled
            if (password === undefined) {
                return false;
            }

            // Show progress while logging in
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Logging in to Auxly...',
                cancellable: false
            }, async () => {
                try {
                    const credentials: LoginRequest = {
                        email: email.trim(),
                        password: password
                    };

                    const response = await this.apiClient!.login(credentials);
                    this.currentUser = response.user;

                    // Notify listeners
                    this.notifyAuthStateChanged();

                    vscode.window.showInformationMessage(
                        `✅ Logged in as ${response.user.email} (${response.user.plan.toUpperCase()} plan)`
                    );

                    return true;
                } catch (error) {
                    const apiError = error as ApiError;
                    let errorMessage = 'Login failed. Please try again.';

                    if (apiError.statusCode === 401) {
                        errorMessage = 'Email or password is incorrect. Please try again.';
                    } else if (apiError.message) {
                        errorMessage = apiError.message;
                    }

                    vscode.window.showErrorMessage(`Login failed: ${errorMessage}`);
                    return false;
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            vscode.window.showErrorMessage('An unexpected error occurred during login');
            return false;
        }
    }

    /**
     * Login with provided credentials (for programmatic login)
     */
    async loginWithCredentials(credentials: LoginCredentials): Promise<boolean> {
        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        try {
            const request: LoginRequest = {
                email: credentials.email,
                password: credentials.password
            };

            const response = await this.apiClient.login(request);
            this.currentUser = response.user;

            // Notify listeners
            this.notifyAuthStateChanged();

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Connect with API key
     * @param apiKey - The API key to connect with
     * @param os - Operating system override (windows/unix/darwin) for API verification
     */
    async connectWithApiKey(apiKey?: string, os?: string): Promise<boolean> {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return false;
        }

        try {
            // If no API key provided, prompt user
            let keyToUse = apiKey;
            if (!keyToUse) {
                keyToUse = await vscode.window.showInputBox({
                    prompt: 'Enter your Auxly API key',
                    placeHolder: 'auxly_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    password: true,
                    ignoreFocusOut: true,
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'API key cannot be empty';
                        }
                        if (!value.startsWith('auxly_')) {
                            return 'API key must start with "auxly_"';
                        }
                        return null;
                    }
                });

                if (!keyToUse) {
                    vscode.window.showInformationMessage('Connection cancelled');
                    return false;
                }
            }

            // Verify and store the API key
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Connecting to Auxly...',
                cancellable: false
            }, async () => {
                // Verify the API key with the backend (pass OS parameter)
                console.log(`🔑 AuthService: Verifying API key with OS: ${os || 'auto-detect'}`);
                const verifyResult = await this.apiClient!.verifyApiKey(keyToUse, os);

                if (!verifyResult.valid) {
                    vscode.window.showErrorMessage(`❌ Invalid API key: ${verifyResult.error || 'Unknown error'}`);
                    return false;
                }

                // Store the API key
                await this.apiClient!.storeApiKey(keyToUse!);

                // Set current user from verification response
                if (verifyResult.user) {
                    this.currentUser = {
                        id: verifyResult.user.user_id?.toString() || '',
                        email: verifyResult.user.email || 'Unknown',
                        plan: verifyResult.user.subscription?.plan_tier || 'free',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                }

                // Notify listeners
                this.notifyAuthStateChanged();

                vscode.window.showInformationMessage(`✅ Connected as ${this.currentUser?.email || 'User'}`);
                return true;
            });
        } catch (error: any) {
            console.error('Connect with API key error:', error);
            vscode.window.showErrorMessage(`Failed to connect: ${error.message || 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Disconnect (clear API key and logout)
     */
    async disconnect(): Promise<void> {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return;
        }

        try {
            // Clear API key
            await this.apiClient.clearApiKey();
            
            // Clear user state
            this.currentUser = null;

            // Notify listeners
            this.notifyAuthStateChanged();

            vscode.window.showInformationMessage('👋 Disconnected successfully');
        } catch (error) {
            console.error('Disconnect error:', error);
            // Clear local state even if API call failed
            this.currentUser = null;
            this.notifyAuthStateChanged();
            vscode.window.showWarningMessage('Disconnected (with errors)');
        }
    }

    /**
     * Logout (for backwards compatibility)
     */
    async logout(): Promise<void> {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Logging out...',
                cancellable: false
            }, async () => {
                // Check if using API key or JWT
                const hasApiKey = await this.apiClient!.isAuthenticated();
                if (hasApiKey) {
                    await this.disconnect();
                } else {
                    await this.apiClient!.logout();
                    this.currentUser = null;
                    this.notifyAuthStateChanged();
                }
            });

            vscode.window.showInformationMessage('👋 Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local state even if API call failed
            this.currentUser = null;
            this.notifyAuthStateChanged();
            vscode.window.showWarningMessage('Logged out (with errors)');
        }
    }

    /**
     * Check and restore auth state on startup
     * This will check for saved API key in .auxly/config.json
     */
    async checkAuthStatus(): Promise<void> {
        if (!this.apiClient) {
            return;
        }

        try {
            console.log('🔍 Checking auth status on startup...');
            
            // First, check if there's a saved API key in config
            const verifyResult = await this.apiClient.verifyApiKey();
            
            if (verifyResult.valid && verifyResult.user) {
                // API key exists and is valid - restore session!
                console.log('✅ Found valid API key in config - restoring session');
                
                this.currentUser = {
                    id: verifyResult.user.user_id?.toString() || '',
                    email: verifyResult.user.email || 'Unknown',
                    plan: verifyResult.user.subscription?.plan_tier || 'free',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                this.notifyAuthStateChanged();
                console.log(`✅ Restored API key session for ${this.currentUser.email}`);
                return;
            }
            
            // Fallback: Check for JWT token authentication
            const isAuth = await this.apiClient.isAuthenticated();
            if (isAuth) {
                try {
                    this.currentUser = await this.apiClient.getCurrentUser();
                    this.notifyAuthStateChanged();
                    console.log(`✅ Restored JWT session for ${this.currentUser.email}`);
                } catch (error) {
                    console.log('JWT token exists but failed to get user info');
                    this.currentUser = null;
                }
            } else {
                console.log('ℹ️ No saved authentication found - user needs to connect');
            }
        } catch (error) {
            console.error('❌ Error checking auth status:', error);
        }
    }
}

