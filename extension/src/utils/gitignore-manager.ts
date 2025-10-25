import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GitignoreManager - Ensures .auxly folder is excluded from version control
 * 
 * Automatically adds .auxly folder to .gitignore during extension activation
 * to prevent internal project data from being committed to repository.
 */
export class GitignoreManager {
    private static readonly AUXLY_IGNORE_ENTRY = '.auxly/';
    private static readonly GITIGNORE_FILE = '.gitignore';

    /**
     * Ensures .auxly folder is listed in .gitignore
     * Creates .gitignore if it doesn't exist
     */
    public static async ensureAuxlyIgnored(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('[GitignoreManager] No workspace folder found, skipping .gitignore update');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const gitignorePath = path.join(workspaceRoot, this.GITIGNORE_FILE);

        try {
            let gitignoreContent = '';
            let fileExists = false;

            // Check if .gitignore exists
            if (fs.existsSync(gitignorePath)) {
                gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
                fileExists = true;
            }

            // Check if .auxly/ is already in .gitignore
            const lines = gitignoreContent.split('\n');
            const hasAuxlyEntry = lines.some(line => 
                line.trim() === this.AUXLY_IGNORE_ENTRY || 
                line.trim() === '.auxly' ||
                line.trim() === '.auxly/**'
            );

            if (hasAuxlyEntry) {
                console.log('[GitignoreManager] ✅ .auxly/ already in .gitignore');
                return;
            }

            // Add .auxly/ to .gitignore
            let updatedContent = gitignoreContent;

            // Add section header if file exists and has content
            if (fileExists && gitignoreContent.trim().length > 0) {
                // Ensure there's a newline at the end
                if (!gitignoreContent.endsWith('\n')) {
                    updatedContent += '\n';
                }
                updatedContent += '\n# Auxly - AI Task Management (internal data)\n';
            } else if (!fileExists) {
                // New .gitignore file
                updatedContent = '# Auxly - AI Task Management (internal data)\n';
            }

            updatedContent += `${this.AUXLY_IGNORE_ENTRY}\n`;

            // Write to .gitignore
            fs.writeFileSync(gitignorePath, updatedContent, 'utf-8');

            const action = fileExists ? 'updated' : 'created';
            console.log(`[GitignoreManager] ✅ .gitignore ${action} - .auxly/ folder excluded`);
            
            // Show subtle notification (don't be too noisy)
            if (!fileExists) {
                vscode.window.showInformationMessage(
                    '✅ Created .gitignore and excluded .auxly folder from version control'
                );
            }

        } catch (error) {
            console.error('[GitignoreManager] ❌ Failed to update .gitignore:', error);
            // Don't show error to user - this is not critical
        }
    }

    /**
     * Checks if .auxly folder is properly excluded
     * @returns true if .auxly is in .gitignore, false otherwise
     */
    public static isAuxlyIgnored(): boolean {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return false;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const gitignorePath = path.join(workspaceRoot, this.GITIGNORE_FILE);

        if (!fs.existsSync(gitignorePath)) {
            return false;
        }

        try {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            const lines = gitignoreContent.split('\n');
            
            return lines.some(line => 
                line.trim() === this.AUXLY_IGNORE_ENTRY || 
                line.trim() === '.auxly' ||
                line.trim() === '.auxly/**'
            );
        } catch (error) {
            console.error('[GitignoreManager] Error reading .gitignore:', error);
            return false;
        }
    }
}

