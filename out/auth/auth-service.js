"use strict";
/**
 * Authentication Service
 * Handles user authentication, login/logout flows, and auth state management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * AuthService Singleton
 * Manages authentication state and provides login/logout functionality
 */
class AuthService {
    constructor() {
        this.apiClient = null;
        this.currentUser = null;
        this.authStateListeners = [];
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    /**
     * Initialize auth service with API client
     */
    initialize(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Subscribe to auth state changes
     */
    onAuthStateChanged(listener) {
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
    notifyAuthStateChanged() {
        const state = this.getAuthState();
        this.authStateListeners.forEach(listener => {
            try {
                listener(state);
            }
            catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }
    /**
     * Get current auth state
     */
    getAuthState() {
        return {
            isAuthenticated: !!this.currentUser,
            user: this.currentUser
        };
    }
    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        if (!this.apiClient) {
            return false;
        }
        return await this.apiClient.isAuthenticated();
    }
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    /**
     * Validate email format
     */
    validateEmail(email) {
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
    validatePassword(password) {
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
    async login() {
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
                    const credentials = {
                        email: email.trim(),
                        password: password
                    };
                    const response = await this.apiClient.login(credentials);
                    this.currentUser = response.user;
                    // Notify listeners
                    this.notifyAuthStateChanged();
                    vscode.window.showInformationMessage(`✅ Logged in as ${response.user.email} (${response.user.plan.toUpperCase()} plan)`);
                    return true;
                }
                catch (error) {
                    const apiError = error;
                    let errorMessage = 'Login failed. Please try again.';
                    if (apiError.statusCode === 401) {
                        errorMessage = 'Email or password is incorrect. Please try again.';
                    }
                    else if (apiError.message) {
                        errorMessage = apiError.message;
                    }
                    vscode.window.showErrorMessage(`Login failed: ${errorMessage}`);
                    return false;
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            vscode.window.showErrorMessage('An unexpected error occurred during login');
            return false;
        }
    }
    /**
     * Login with provided credentials (for programmatic login)
     */
    async loginWithCredentials(credentials) {
        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }
        try {
            const request = {
                email: credentials.email,
                password: credentials.password
            };
            const response = await this.apiClient.login(request);
            this.currentUser = response.user;
            // Notify listeners
            this.notifyAuthStateChanged();
            return true;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Connect with API key
     */
    async connectWithApiKey(apiKey) {
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
                // Verify the API key with the backend
                const verifyResult = await this.apiClient.verifyApiKey(keyToUse);
                if (!verifyResult.valid) {
                    vscode.window.showErrorMessage(`❌ Invalid API key: ${verifyResult.error || 'Unknown error'}`);
                    return false;
                }
                // Store the API key
                await this.apiClient.storeApiKey(keyToUse);
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
        }
        catch (error) {
            console.error('Connect with API key error:', error);
            vscode.window.showErrorMessage(`Failed to connect: ${error.message || 'Unknown error'}`);
            return false;
        }
    }
    /**
     * Disconnect (clear API key and logout)
     */
    async disconnect() {
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
        }
        catch (error) {
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
    async logout() {
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
                const hasApiKey = await this.apiClient.isAuthenticated();
                if (hasApiKey) {
                    await this.disconnect();
                }
                else {
                    await this.apiClient.logout();
                    this.currentUser = null;
                    this.notifyAuthStateChanged();
                }
            });
            vscode.window.showInformationMessage('👋 Logged out successfully');
        }
        catch (error) {
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
    async checkAuthStatus() {
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
                }
                catch (error) {
                    console.log('JWT token exists but failed to get user info');
                    this.currentUser = null;
                }
            }
            else {
                console.log('ℹ️ No saved authentication found - user needs to connect');
            }
        }
        catch (error) {
            console.error('❌ Error checking auth status:', error);
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map