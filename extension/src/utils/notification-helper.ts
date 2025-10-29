/**
 * Notification Helper - Provides auto-hide functionality for VS Code notifications
 */
import * as vscode from 'vscode';

export interface NotificationOptions {
    timeout?: number; // Auto-hide timeout in milliseconds (default: 5000)
    modal?: boolean;  // Show as modal (default: false)
}

/**
 * Show information message with auto-hide timeout
 */
export async function showInformationMessage(
    message: string, 
    options: NotificationOptions = {},
    ...items: string[]
): Promise<string | undefined> {
    const { timeout = 5000 } = options;
    
    const result = vscode.window.showInformationMessage(message, ...items);
    
    // Auto-hide after timeout if no user interaction
    if (timeout > 0) {
        setTimeout(() => {
            console.log(`🔄 Information notification auto-hide timeout reached (${timeout}ms)`);
        }, timeout);
    }
    
    return result;
}

/**
 * Show warning message with auto-hide timeout
 */
export async function showWarningMessage(
    message: string, 
    options: NotificationOptions = {},
    ...items: string[]
): Promise<string | undefined> {
    const { timeout = 5000 } = options;
    
    const result = vscode.window.showWarningMessage(message, ...items);
    
    // Auto-hide after timeout if no user interaction
    if (timeout > 0) {
        setTimeout(() => {
            console.log(`🔄 Warning notification auto-hide timeout reached (${timeout}ms)`);
        }, timeout);
    }
    
    return result;
}

/**
 * Show error message with auto-hide timeout
 */
export async function showErrorMessage(
    message: string, 
    options: NotificationOptions = {},
    ...items: string[]
): Promise<string | undefined> {
    const { timeout = 8000 } = options; // Longer timeout for errors
    
    const result = vscode.window.showErrorMessage(message, ...items);
    
    // Auto-hide after timeout if no user interaction
    if (timeout > 0) {
        setTimeout(() => {
            console.log(`🔄 Error notification auto-hide timeout reached (${timeout}ms)`);
        }, timeout);
    }
    
    return result;
}

/**
 * Show success message (information with shorter timeout)
 */
export async function showSuccessMessage(
    message: string, 
    options: NotificationOptions = {},
    ...items: string[]
): Promise<string | undefined> {
    const { timeout = 3000 } = options; // Shorter timeout for success
    
    return showInformationMessage(message, { ...options, timeout }, ...items);
}
