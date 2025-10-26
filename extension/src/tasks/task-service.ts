/**
 * Task Service (Local Storage Edition)
 * Handles task management with local .auxly/tasks.json storage
 * Fast, reliable, offline-first approach (like Todo2)
 */

import * as vscode from 'vscode';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../api/types';
import { GroupedTasks, TaskLoadingState, TaskCreationInput } from './types';
import { LocalStorageService } from '../storage/local-storage';
import { LocalConfigService } from '../config/local-config';

/**
 * TaskService Singleton
 * Manages all task-related operations using local storage
 */
export class TaskService {
    private static instance: TaskService;
    private localStorage: LocalStorageService;
    private configService: LocalConfigService;
    private taskUpdateListeners: Array<(tasks: GroupedTasks) => void> = [];
    private loadingStateListeners: Array<(state: TaskLoadingState) => void> = [];

    private constructor() {
        this.localStorage = LocalStorageService.getInstance();
        this.configService = LocalConfigService.getInstance();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): TaskService {
        if (!TaskService.instance) {
            TaskService.instance = new TaskService();
        }
        return TaskService.instance;
    }

    /**
     * Initialize task service with local storage
     */
    async initialize(): Promise<void> {
        try {
            await this.localStorage.initialize();
            console.log('✅ TaskService initialized with local storage');
            
            // Watch for external file changes
            this.localStorage.watchTasksFile(() => {
                this.fetchTasks(true);
            });
            
            // Load initial tasks
            await this.fetchTasks(true);
        } catch (error) {
            console.error('❌ Failed to initialize TaskService:', error);
            throw error;
        }
    }

    /**
     * Subscribe to task updates
     */
    onTasksUpdated(listener: (tasks: GroupedTasks) => void): vscode.Disposable {
        this.taskUpdateListeners.push(listener);
        
        return {
            dispose: () => {
                const index = this.taskUpdateListeners.indexOf(listener);
                if (index > -1) {
                    this.taskUpdateListeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Subscribe to loading state changes
     */
    onLoadingStateChanged(listener: (state: TaskLoadingState) => void): vscode.Disposable {
        this.loadingStateListeners.push(listener);
        
        return {
            dispose: () => {
                const index = this.loadingStateListeners.indexOf(listener);
                if (index > -1) {
                    this.loadingStateListeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify listeners of task updates
     */
    private notifyTasksUpdated(tasks: GroupedTasks): void {
        this.taskUpdateListeners.forEach(listener => {
            try {
                listener(tasks);
            } catch (error) {
                console.error('Error in task update listener:', error);
            }
        });
    }

    /**
     * Notify listeners of loading state changes
     */
    private notifyLoadingStateChanged(state: TaskLoadingState): void {
        this.loadingStateListeners.forEach(listener => {
            try {
                listener(state);
            } catch (error) {
                console.error('Error in loading state listener:', error);
            }
        });
    }

    /**
     * Get storage file path (for debugging)
     */
    getStoragePath(): string {
        return this.localStorage.getStoragePath();
    }

    /**
     * Check if user has write access (API key required)
     * Returns true if user has valid API key
     */
    private async canWriteTasks(): Promise<boolean> {
        try {
            // Check if user has API key
            const hasApiKey = await this.configService.hasApiKey();
            return hasApiKey;
        } catch (error) {
            console.error('Error checking write access:', error);
            return false; // Fail secure
        }
    }

    /**
     * Show read-only mode error with API key prompt
     */
    private async showReadOnlyError(): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            '🔒 Please connect your API key to create or edit tasks.',
            'Enter API Key',
            'Get Free API Key'
        );

        if (action === 'Enter API Key') {
            // Trigger API key entry command via connect (not login)
            vscode.commands.executeCommand('auxly.connect');
        } else if (action === 'Get Free API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://auxly.tzamun.com'));
        }
    }

    /**
     * Force fresh fetch from backend (bypasses localStorage cache)
     * Used when webview reloads to ensure fresh data
     */
    async forceFreshFetch(): Promise<GroupedTasks | null> {
        try {
            console.log('🔄 forceFreshFetch: Clearing cache and reloading from backend');
            this.notifyLoadingStateChanged({ isLoading: true, operation: 'refreshing' });

            // Clear localStorage cache
            await this.localStorage.clearAllTasks();
            console.log('🗑️ Cache cleared');

            // Re-initialize to load from backend
            await this.localStorage.initialize();
            console.log('♻️ Storage re-initialized');

            // Fetch fresh data
            const groupedTasks = await this.localStorage.getGroupedTasks();
            console.log(`✅ Fresh fetch complete: ${Object.values(groupedTasks).flat().length} tasks loaded`);

            this.notifyTasksUpdated(groupedTasks);

            return groupedTasks;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh tasks';
            console.error('Force fresh fetch error:', error);
            vscode.window.showErrorMessage(`Failed to refresh tasks: ${errorMessage}`);
            return null;
        } finally {
            this.notifyLoadingStateChanged({ isLoading: false });
        }
    }

    /**
     * Fetch all tasks from local storage
     */
    async fetchTasks(silent = false): Promise<GroupedTasks | null> {
        try {
            if (!silent) {
                this.notifyLoadingStateChanged({ isLoading: true, operation: 'fetching' });
            }

            const groupedTasks = await this.localStorage.getGroupedTasks();
            console.log(`📋 Fetched ${Object.values(groupedTasks).flat().length} tasks from local storage`);

            this.notifyTasksUpdated(groupedTasks);

            return groupedTasks;
        } catch (error) {
            if (!silent) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
                vscode.window.showErrorMessage(`Failed to fetch tasks: ${errorMessage}`);
            } else {
                console.error('Fetch tasks error:', error);
            }

            return null;
        } finally {
            if (!silent) {
                this.notifyLoadingStateChanged({ isLoading: false });
            }
        }
    }

    /**
     * Create a new task with input dialogs
     */
    async createTask(): Promise<Task | null> {
        try {
            // Check write access (read-only mode)
            const canWrite = await this.canWriteTasks();
            if (!canWrite) {
                await this.showReadOnlyError();
                return null;
            }

            // Step 1: Get task title
            const title = await vscode.window.showInputBox({
                prompt: 'Enter task title',
                placeHolder: 'Implement new feature',
                ignoreFocusOut: true,
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Task title is required';
                    }
                    if (value.length > 100) {
                        return 'Task title must be 100 characters or less';
                    }
                    return null;
                }
            });

            if (title === undefined) {
                return null; // User cancelled
            }

            // Step 2: Get task description (optional)
            const description = await vscode.window.showInputBox({
                prompt: 'Enter task description (optional)',
                placeHolder: 'Detailed description of the task...',
                ignoreFocusOut: true
            });

            if (description === undefined) {
                return null; // User cancelled
            }

            // Step 3: Select priority
            const priorityOptions: vscode.QuickPickItem[] = [
                { label: 'Medium', description: 'Default priority', picked: true },
                { label: 'Low', description: 'Nice to have' },
                { label: 'High', description: 'Important' },
                { label: 'Critical', description: 'Urgent' }
            ];

            const prioritySelection = await vscode.window.showQuickPick(priorityOptions, {
                placeHolder: 'Select task priority',
                ignoreFocusOut: true
            });

            if (!prioritySelection) {
                return null; // User cancelled
            }

            const priority = prioritySelection.label.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';

            // Step 4: Create task with progress
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating task...',
                cancellable: false
            }, async () => {
                try {
                    this.notifyLoadingStateChanged({ isLoading: true, operation: 'creating' });

                    const taskData: CreateTaskRequest = {
                        title: title.trim(),
                        description: description?.trim() || undefined,
                        priority
                    };

                    const newTask = await this.localStorage.createTask(taskData);

                    // Refresh tasks to update UI
                    await this.fetchTasks(true);

                    // REMOTE SSH FIX: Safe config access
                    try {
                        const config = vscode.workspace.getConfiguration('auxly');
                        if (config && config.get<boolean>('enableNotifications', true)) {
                            vscode.window.showInformationMessage(`✅ Task created: ${newTask.title}`);
                        }
                    } catch (configError) {
                        // Show notification anyway if config fails
                        vscode.window.showInformationMessage(`✅ Task created: ${newTask.title}`);
                    }

                    return newTask;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
                    vscode.window.showErrorMessage(`Failed to create task: ${errorMessage}`);
                    return null;
                } finally {
                    this.notifyLoadingStateChanged({ isLoading: false });
                }
            });
        } catch (error) {
            console.error('Task creation error:', error);
            vscode.window.showErrorMessage('An unexpected error occurred while creating task');
            return null;
        }
    }

    /**
     * Update a task
     */
    async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task | null> {
        try {
            // Check write access (read-only mode)
            const canWrite = await this.canWriteTasks();
            if (!canWrite) {
                await this.showReadOnlyError();
                return null;
            }

            this.notifyLoadingStateChanged({ isLoading: true, operation: 'updating' });

            const updatedTask = await this.localStorage.updateTask(taskId, updates);

            if (!updatedTask) {
                vscode.window.showErrorMessage('Task not found');
                return null;
            }

            // Refresh tasks to update UI
            await this.fetchTasks(true);

            // REMOTE SSH FIX: Safe config access
            try {
                const config = vscode.workspace.getConfiguration('auxly');
                if (config && config.get<boolean>('enableNotifications', true) && updates.status) {
                    vscode.window.showInformationMessage(`✅ Task moved to ${updates.status.replace('_', ' ')}`);
                }
            } catch (configError) {
                // Show notification anyway if config fails and status changed
                if (updates.status) {
                    vscode.window.showInformationMessage(`✅ Task moved to ${updates.status.replace('_', ' ')}`);
                }
            }

            return updatedTask;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
            vscode.window.showErrorMessage(`Failed to update task: ${errorMessage}`);
            return null;
        } finally {
            this.notifyLoadingStateChanged({ isLoading: false });
        }
    }

    /**
     * Reopen a task with a reason (adds comment and "reopen" tag)
     */
    async reopenTaskWithReason(taskId: string, reason: string): Promise<Task | null> {
        try {
            this.notifyLoadingStateChanged({ isLoading: true, operation: 'reopening' });

            // Get current task
            const task = await this.localStorage.getTask(taskId);
            if (!task) {
                vscode.window.showErrorMessage('Task not found');
                return null;
            }

            // Add reopen comment
            const reopenComment = {
                id: Date.now().toString(),
                author: 'user' as const,
                authorName: 'User',
                content: reason,
                type: 'reopen_reason' as const,
                createdAt: new Date().toISOString()
            };

            const comments = task.comments || [];
            comments.push(reopenComment);

            // Add "reopen" tag if not present
            const tags = task.tags || [];
            if (!tags.includes('reopen')) {
                tags.push('reopen');
            }

            // Update task with new status, comment, and tag
            const updatedTask = await this.localStorage.updateTask(taskId, {
                status: 'in_progress',
                tags: tags,
                comments: comments
            });

            if (!updatedTask) {
                vscode.window.showErrorMessage('Failed to reopen task');
                return null;
            }

            // Refresh tasks to update UI
            await this.fetchTasks(true);

            console.log(`✅ Task reopened: ${updatedTask.title} - Reason: ${reason}`);

            return updatedTask;
        } catch (error) {
            console.error('Failed to reopen task with reason:', error);
            vscode.window.showErrorMessage('Failed to reopen task: ' + (error as Error).message);
            return null;
        } finally {
            this.notifyLoadingStateChanged({ isLoading: false });
        }
    }

    /**
     * Delete a task with confirmation
     */
    async deleteTask(taskId: string, taskTitle: string): Promise<boolean> {
        try {
            // Check write access (read-only mode)
            const canWrite = await this.canWriteTasks();
            if (!canWrite) {
                await this.showReadOnlyError();
                return false;
            }

            // Confirm deletion
            const confirmation = await vscode.window.showWarningMessage(
                `Are you sure you want to delete task: "${taskTitle}"?`,
                { modal: true },
                'Delete',
                'Cancel'
            );

            if (confirmation !== 'Delete') {
                return false;
            }

            // Delete with progress
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Deleting task...',
                cancellable: false
            }, async () => {
                try {
                    this.notifyLoadingStateChanged({ isLoading: true, operation: 'deleting' });

                    const success = await this.localStorage.deleteTask(taskId);

                    if (!success) {
                        vscode.window.showErrorMessage('Task not found');
                        return false;
                    }

                    // Refresh tasks to update UI
                    await this.fetchTasks(true);

                    // REMOTE SSH FIX: Safe config access
                    try {
                        const config = vscode.workspace.getConfiguration('auxly');
                        if (config && config.get<boolean>('enableNotifications', true)) {
                            vscode.window.showInformationMessage('✅ Task deleted');
                        }
                    } catch (configError) {
                        // Show notification anyway if config fails
                        vscode.window.showInformationMessage('✅ Task deleted');
                    }

                    return true;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
                    vscode.window.showErrorMessage(`Failed to delete task: ${errorMessage}`);
                    return false;
                } finally {
                    this.notifyLoadingStateChanged({ isLoading: false });
                }
            });
        } catch (error) {
            console.error('Task deletion error:', error);
            vscode.window.showErrorMessage('An unexpected error occurred while deleting task');
            return false;
        }
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.taskUpdateListeners = [];
        this.loadingStateListeners = [];
    }
}







