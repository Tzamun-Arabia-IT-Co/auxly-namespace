/**
 * Local Storage Service for MCP Server
 * Reads/writes tasks from .auxly/tasks.json in workspace
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Task } from './types.js';

export interface TaskStorage {
    tasks: Task[];
    lastModified: string;
    version: string;
}

export class LocalTaskStorage {
    private storageFile: string;
    private tasks: Task[] = [];
    private nextId: number = 1;

    // 🚨 VALIDATION CONSTANTS
    private readonly VALID_TRANSITIONS: Record<string, string[]> = {
        'todo': ['in_progress'],
        'in_progress': ['review', 'done'],
        'review': ['done', 'in_progress'],
        'done': [] // Cannot change done tasks
    };

    private readonly FORBIDDEN_PATHS = [
        '.git/',
        'node_modules/',
        '.auxly/internal/',
        '.vscode/',
        '.cursor/',
        '*.exe',
        '*.dll',
        '*.so',
        '*.dylib'
    ];

    private readonly CRITICAL_FILES = [
        'package-lock.json',
        '.env',
        '.env.local',
        '.env.production',
        'tsconfig.json',
        'webpack.config.js',
        'vite.config.ts',
        '.gitignore'
    ];

    private readonly PROTECTED_TAGS = [
        'security',
        'database',
        'production',
        'urgent',
        'blocked',
        'critical-bug'
    ];

    private readonly APPROVAL_REQUIRED_TAGS = [
        'database-change',
        'api-breaking',
        'security',
        'production'
    ];

    // Removed MIN_WORK_TIME_MS restriction - tasks can be completed immediately
    private readonly MAX_STALE_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours

    constructor(workspacePath?: string) {
        // ULTIMATE FIX: Force use of C:\Auxly if no valid workspace path provided
        let workspaceRoot: string;
        
        if (workspacePath && workspacePath.trim()) {
            workspaceRoot = workspacePath;
            console.log(`[Auxly MCP] ✅ Using provided workspace: ${workspaceRoot}`);
        } else {
            // HARDCODED FALLBACK: Use C:\Auxly on Windows
            const hardcodedPath = process.platform === 'win32' ? 'C:\\Auxly' : os.homedir();
            workspaceRoot = hardcodedPath;
            console.log(`[Auxly MCP] ⚠️ No workspace provided, using hardcoded: ${workspaceRoot}`);
        }
        
        const storageDir = path.join(workspaceRoot, '.auxly');
        this.storageFile = path.join(storageDir, 'tasks.json');

        console.log(`[Auxly MCP] 📁 Storage directory: ${storageDir}`);
        console.log(`[Auxly MCP] 📄 Tasks file: ${this.storageFile}`);

        // Create .auxly directory if it doesn't exist
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
            console.log(`[Auxly MCP] ✅ Created storage directory: ${storageDir}`);
        }

        // Load existing tasks
        this.loadTasks();
    }

    /**
     * Load tasks from file
     */
    private loadTasks(): void {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data = fs.readFileSync(this.storageFile, 'utf-8');
                const storage: TaskStorage = JSON.parse(data);
                this.tasks = storage.tasks || [];

                // Calculate next ID
                if (this.tasks.length > 0) {
                    const maxId = Math.max(...this.tasks.map(t => parseInt(t.id) || 0));
                    this.nextId = maxId + 1;
                }

                // Silent: tasks loaded successfully
            } else {
                // Create new file with empty tasks
                this.saveTasks();
            }
        } catch (error) {
            // Silent: initialize with empty tasks on error
            this.tasks = [];
        }
    }

    /**
     * Save tasks to file
     */
    private saveTasks(): void {
        try {
            const storage: TaskStorage = {
                tasks: this.tasks,
                lastModified: new Date().toISOString(),
                version: '1.0.0'
            };

            fs.writeFileSync(this.storageFile, JSON.stringify(storage, null, 2), 'utf-8');
            // Silent: tasks saved successfully
        } catch (error) {
            // Silent: rethrow error without logging
            throw error;
        }
    }

    // ==========================================
    // 🚨 VALIDATION METHODS (10 RESTRICTIONS)
    // ==========================================

    /**
     * RESTRICTION #2: Validate status transitions
     */
    private validateStatusTransition(currentStatus: string, newStatus: string): void {
        const validNext = this.VALID_TRANSITIONS[currentStatus];
        if (!validNext || !validNext.includes(newStatus)) {
            throw new Error(
                `Invalid status transition: ${currentStatus} → ${newStatus}\n` +
                `Valid transitions from ${currentStatus}: ${validNext?.join(', ') || 'none'}`
            );
        }
    }

    /**
     * RESTRICTION #3: Validate research exists before starting work
     */
    private validateResearchExists(task: Task, newStatus: string): void {
        if (newStatus === 'in_progress') {
            // Question category doesn't require research
            if (task.category === 'question') {
                return; // ✅ Questions can start immediately
            }
            
            // Check for research in comments (technical_research or business_research)
            const comments = (task as any).comments || [];
            const hasResearch = comments.some((c: any) => 
                c.type === 'technical_research' || c.type === 'business_research'
            );
            
            if (!hasResearch) {
                throw new Error(
                    `❌ BLOCKED: Cannot start Task #${task.id} "${task.title}" without research.\n\n` +
                    `MANDATORY REQUIREMENT: Add research using auxly_add_research BEFORE starting work.\n\n` +
                    `Required research types:\n` +
                    `1. Technical Research (type: "technical_research")\n` +
                    `2. Business Research (type: "business_research")\n\n` +
                    `AI must conduct BOTH types of research before coding.\n\n` +
                    `💡 Exception: Tasks with category "question" don't require research.`
                );
            }
        }
    }

    /**
     * RESTRICTION #3: Validate file changes logged before completion
     */
    private validateFileChangesLogged(task: Task, newStatus: string): void {
        if ((newStatus === 'done' || newStatus === 'review')) {
            // Define non-code categories that don't require file changes
            const nonCodeCategories = ['research', 'documentation', 'testing', 'planning', 'review', 'question'];
            
            // Check if task category is non-code
            const isNonCodeTask = task.category && nonCodeCategories.includes(task.category);
            
            // Also check tags as fallback for backward compatibility
            const hasNonCodeTag = task.tags?.some(tag => 
                ['test', 'research', 'documentation', 'planning', 'audit', 'review', 'analysis'].includes(tag.toLowerCase())
            );
            
            if (isNonCodeTask || hasNonCodeTag) {
                // Non-code tasks don't require file changes
                return;
            }
            
            const hasChanges = task.changes && task.changes.length > 0;
            if (!hasChanges) {
                throw new Error(
                    `Cannot complete task without logging file changes.\n` +
                    `Task appears incomplete - no files modified.\n` +
                    `\n` +
                    `📌 Tip: If this is a non-code task, set category to one of:\n` +
                    `   research, documentation, testing, planning, review, or question`
                );
            }
        }
    }

    /**
     * RESTRICTION #4: Validate only ONE task with aiWorkingOn: true
     */
    private validateConcurrentTaskLimit(taskId: string, aiWorkingOn: boolean): void {
        if (aiWorkingOn === true) {
            const workingTasks = this.tasks.filter(t => t.aiWorkingOn === true && t.id !== taskId);
            if (workingTasks.length > 0) {
                const existingTask = workingTasks[0];
                throw new Error(
                    `Already working on Task #${existingTask.id} "${existingTask.title}".\n` +
                    `Complete or pause it before starting another task.`
                );
            }
        }
    }

    /**
     * RESTRICTION #6: Validate priority changes
     */
    private validatePriorityChange(task: Task, newPriority?: string): void {
        if (newPriority && newPriority !== task.priority) {
            if (newPriority === 'critical') {
                throw new Error(
                    `Cannot change priority to 'critical'.\n` +
                    `Only users can set critical priority.`
                );
            }
            console.warn(`[LocalStorage] ⚠️ Priority changed: ${task.priority} → ${newPriority} on Task #${task.id}`);
        }
    }

    /**
     * RESTRICTION #7: Validate tag modifications
     */
    private validateTagModifications(task: Task, newTags?: string[]): void {
        if (newTags && task.tags) {
            const removedTags = task.tags.filter(t => !newTags.includes(t));
            const protectedRemoved = removedTags.filter(t => this.PROTECTED_TAGS.includes(t));
            
            if (protectedRemoved.length > 0) {
                throw new Error(
                    `Cannot remove protected tags: ${protectedRemoved.join(', ')}\n` +
                    `These tags are critical for task categorization.`
                );
            }
        }
    }

    /**
     * RESTRICTION #8: Validate time-based rules
     */
    private validateTimingRules(task: Task, newStatus: string): void {
        const now = Date.now();
        const updatedAt = new Date(task.updatedAt).getTime();
        const timeElapsed = now - updatedAt;

        // Removed minimum work time check - tasks can be completed immediately
        // This allows for quick tasks and flexible workflow

        // Warn about stale tasks
        if (task.status === 'in_progress' && timeElapsed > this.MAX_STALE_TIME_MS) {
            console.warn(
                `[LocalStorage] ⚠️ Task #${task.id} is stale (no update for ${Math.round(timeElapsed / 1000 / 60 / 60)} hours)`
            );
        }
    }

    /**
     * RESTRICTION #9: Validate approval requirements
     */
    private validateApprovalRequirement(task: Task, newStatus: string): void {
        if (newStatus === 'in_progress') {
            const requiresApproval = task.tags?.some(tag => this.APPROVAL_REQUIRED_TAGS.includes(tag));
            
            if (requiresApproval) {
                const hasApproval = task.qaHistory?.some((qa: any) => qa.category === 'APPROVAL REQUEST' && qa.answer);
                if (!hasApproval) {
                    throw new Error(
                        `This task requires approval before starting (tags: ${task.tags?.join(', ')}).\n` +
                        `Use auxly_ask_question with category: APPROVAL REQUEST first.`
                    );
                }
            }
        }
    }

    /**
     * RESTRICTION #10: Validate task dependencies
     */
    private validateTaskDependencies(task: Task, newStatus: string): void {
        if (newStatus === 'in_progress' && task.dependencies && task.dependencies.length > 0) {
            const incompleteDeps = task.dependencies.filter(depId => {
                const depTask = this.tasks.find(t => t.id === depId);
                return depTask && depTask.status !== 'done';
            });
            
            if (incompleteDeps.length > 0) {
                const depTasks = incompleteDeps.map(id => {
                    const t = this.tasks.find(task => task.id === id);
                    return `#${id} "${t?.title || 'Unknown'}" [${t?.status}]`;
                }).join(', ');
                
                throw new Error(
                    `Cannot start task - complete dependencies first:\n${depTasks}`
                );
            }
        }
    }

    /**
     * RESTRICTION #11: Validate no unanswered questions exist
     */
    private validateNoUnansweredQuestions(task: Task, newStatus: string): void {
        // Check if trying to complete or move to review
        if (newStatus === 'done' || newStatus === 'review') {
            const unansweredQuestions = task.qaHistory?.filter((qa: any) => !qa.answer) || [];
            
            if (unansweredQuestions.length > 0) {
                const questionsList = unansweredQuestions.map((qa: any, idx: number) => 
                    `${idx + 1}. [${qa.category}] ${qa.text}`
                ).join('\n');
                
                throw new Error(
                    `Cannot complete task - ${unansweredQuestions.length} unanswered question(s) pending:\n\n` +
                    questionsList + '\n\n' +
                    `⚠️ AI must WAIT for user answers before proceeding.\n` +
                    `User will respond via the Auxly task panel.`
                );
            }
        }
    }

    /**
     * RESTRICTION #7: Validate file scope (for file change logging)
     */
    private validateFileScope(filePath: string): void {
        // Check forbidden paths
        for (const forbidden of this.FORBIDDEN_PATHS) {
            if (forbidden.includes('*')) {
                // Wildcard pattern
                const pattern = forbidden.replace(/\*/g, '.*');
                if (new RegExp(pattern).test(filePath)) {
                    throw new Error(
                        `Cannot modify forbidden path: ${filePath}\n` +
                        `Matched forbidden pattern: ${forbidden}`
                    );
                }
            } else {
                // Direct path match
                if (filePath.includes(forbidden)) {
                    throw new Error(
                        `Cannot modify forbidden path: ${filePath}\n` +
                        `Path contains: ${forbidden}`
                    );
                }
            }
        }

        // Check critical files - require explicit approval
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || '';
        if (this.CRITICAL_FILES.includes(fileName)) {
            console.warn(
                `[LocalStorage] ⚠️ CRITICAL FILE MODIFIED: ${filePath}\n` +
                `This change should be reviewed carefully.`
            );
        }
    }

    /**
     * Get all tasks
     */
    async getTasks(status?: string): Promise<Task[]> {
        // Reload from file to get latest changes
        this.loadTasks();

        if (!status) {
            return [...this.tasks];
        }
        return this.tasks.filter(t => t.status === status);
    }

    /**
     * Get single task by ID
     */
    async getTask(taskId: string): Promise<Task | null> {
        this.loadTasks();
        return this.tasks.find(t => t.id === taskId) || null;
    }

    /**
     * Create new task
     */
    async createTask(data: {
        title: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        category?: string;
        tags?: string[];
    }): Promise<Task> {
        this.loadTasks();

        // 🚨 CRITICAL: DUPLICATE DETECTION WITH HOLD STATUS CHECK
        // Check for similar existing tasks to prevent bypassing hold status
        const titleLower = data.title.toLowerCase();
        const descriptionLower = (data.description || '').toLowerCase();
        
        // Find similar tasks (check title and description similarity)
        const similarTasks = this.tasks.filter(task => {
            // Skip completed tasks
            if (task.status === 'done') return false;
            
            const taskTitleLower = task.title.toLowerCase();
            const taskDescLower = (task.description || '').toLowerCase();
            
            // Check for significant overlap in title (>60% match)
            const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
            const taskTitleWords = taskTitleLower.split(/\s+/).filter(w => w.length > 3);
            
            const titleOverlap = titleWords.filter(word => taskTitleLower.includes(word)).length;
            const titleSimilarity = titleWords.length > 0 ? titleOverlap / titleWords.length : 0;
            
            // Check for description overlap if description provided
            let descSimilarity = 0;
            if (descriptionLower && taskDescLower) {
                const descWords = descriptionLower.split(/\s+/).filter(w => w.length > 3);
                const descOverlap = descWords.filter(word => taskDescLower.includes(word)).length;
                descSimilarity = descWords.length > 0 ? descOverlap / descWords.length : 0;
            }
            
            // Consider similar if title has >60% match or description has >50% match
            return titleSimilarity > 0.6 || descSimilarity > 0.5;
        });
        
        // If similar tasks found, check their hold status
        if (similarTasks.length > 0) {
            const heldTasks = similarTasks.filter(t => t.availabilityStatus === 'hold');
            const availableTasks = similarTasks.filter(t => t.availabilityStatus !== 'hold');
            
            if (heldTasks.length > 0) {
                // Found similar task that is ON HOLD
                const heldTask = heldTasks[0];
                console.error(`[LocalStorage] ❌ BLOCKED: Cannot create task - Similar task #${heldTask.id} exists and is ON HOLD`);
                console.error(`[LocalStorage] ❌ Held task: "${heldTask.title}"`);
                console.error(`[LocalStorage] ❌ User must release hold on existing task first`);
                
                throw new Error(
                    `Cannot create task - Similar task already exists: #${heldTask.id} "${heldTask.title}"\n\n` +
                    `⚠️ That task is ON HOLD. Please:\n` +
                    `1. Release hold on Task #${heldTask.id}\n` +
                    `2. Work on the existing task instead of creating a new one`
                );
            }
            
            if (availableTasks.length > 0) {
                // Found similar task that is AVAILABLE
                const existingTask = availableTasks[0];
                console.error(`[LocalStorage] ❌ BLOCKED: Cannot create task - Similar task #${existingTask.id} already exists`);
                console.error(`[LocalStorage] ❌ Existing task: "${existingTask.title}"`);
                
                throw new Error(
                    `Cannot create task - Similar task already exists: #${existingTask.id} "${existingTask.title}"\n\n` +
                    `⚠️ Please work on the existing task instead of creating a duplicate.`
                );
            }
        }

        // No duplicates found - proceed with creation
        const newTask: Task = {
            id: String(this.nextId++),
            title: data.title,
            description: data.description,
            status: 'todo',
            priority: data.priority || 'medium',
            category: data.category as any,  // Cast to TaskCategory type
            tags: data.tags,
            availabilityStatus: 'available',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.saveTasks();

        // Silent: task created successfully
        return newTask;
    }

    /**
     * Update existing task
     */
    async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
        this.loadTasks();

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            // Silent: task not found
            return null;
        }

        const currentTask = this.tasks[taskIndex];

        // 🚨 CRITICAL: HOLD STATUS ENFORCEMENT (from v0.0.40)
        // Block AI from changing availabilityStatus when task is on HOLD
        if (currentTask.availabilityStatus === 'hold' && updates.availabilityStatus === 'available') {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot change availabilityStatus on Task #${taskId} - Task is ON HOLD`);
            throw new Error(`Task #${taskId} is ON HOLD. Only users can release hold status via UI.`);
        }

        // Block any status change if task is on HOLD (not just to in_progress)
        if (currentTask.availabilityStatus === 'hold' && updates.status && updates.status !== currentTask.status) {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot change status on Task #${taskId} - Task is ON HOLD`);
            throw new Error(
                `❌ BLOCKED: Task #${taskId} "${currentTask.title}" is ON HOLD.\n\n` +
                `Cannot change status from "${currentTask.status}" to "${updates.status}".\n` +
                `Only the user can release hold status via the Auxly dashboard.\n\n` +
                `AI must SKIP this task and work on available tasks only.`
            );
        }

        // Block aiWorkingOn=true if task is on HOLD
        if (currentTask.availabilityStatus === 'hold' && updates.aiWorkingOn === true) {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot set aiWorkingOn=true on Task #${taskId} - Task is ON HOLD`);
            throw new Error(
                `❌ BLOCKED: Task #${taskId} "${currentTask.title}" is ON HOLD.\n\n` +
                `Cannot start working on this task.\n` +
                `Release hold status first via Auxly dashboard.\n\n` +
                `AI must SKIP this task and work on available tasks only.`
            );
        }

        // ==========================================
        // 🚨 10 RESTRICTIONS - VALIDATION SUITE
        // ==========================================

        // RESTRICTION #2: Status Transition Rules
        if (updates.status && updates.status !== currentTask.status) {
            this.validateStatusTransition(currentTask.status, updates.status);
        }

        // RESTRICTION #3: Research Verification
        if (updates.status) {
            this.validateResearchExists(currentTask, updates.status);
            this.validateFileChangesLogged(currentTask, updates.status);
        }

        // RESTRICTION #4: Concurrent Task Limit
        if (updates.aiWorkingOn !== undefined) {
            this.validateConcurrentTaskLimit(taskId, updates.aiWorkingOn);
        }

        // RESTRICTION #6: Priority Change Restrictions
        if (updates.priority) {
            this.validatePriorityChange(currentTask, updates.priority);
        }

        // RESTRICTION #7: Tag Modification Controls
        if (updates.tags) {
            this.validateTagModifications(currentTask, updates.tags);
        }

        // RESTRICTION #8: Time-Based Restrictions
        if (updates.status) {
            this.validateTimingRules(currentTask, updates.status);
        }

        // RESTRICTION #9: Approval Workflow Enhancement
        if (updates.status) {
            this.validateApprovalRequirement(currentTask, updates.status);
        }

        // RESTRICTION #10: Task Dependency Enforcement
        if (updates.status) {
            this.validateTaskDependencies(currentTask, updates.status);
        }

        // RESTRICTION #11: No Unanswered Questions
        if (updates.status) {
            this.validateNoUnansweredQuestions(currentTask, updates.status);
        }

        // All validations passed - apply updates
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            id: taskId, // Preserve ID
            updatedAt: new Date().toISOString()
        };

        this.saveTasks();
        // Silent: task updated successfully
        return this.tasks[taskIndex];
    }

    /**
     * Delete task
     */
    async deleteTask(taskId: string): Promise<boolean> {
        this.loadTasks();

        // 🚨 RESTRICTION #1: TASK DELETION PROTECTION
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            // Silent: task not found
            return false;
        }

        // Block deletion if task has existing work
        const hasWork = (
            (task.changes && task.changes.length > 0) ||
            (task.comments && task.comments.length > 0) ||
            (task.research && task.research.length > 0) ||
            (task.qaHistory && task.qaHistory.length > 0)
        );

        if (hasWork) {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot delete Task #${taskId} - Has existing work`);
            console.error(`[LocalStorage] ❌ Task has: ${task.changes?.length || 0} changes, ${task.comments?.length || 0} comments, ${task.research?.length || 0} research`);
            throw new Error(
                `Cannot delete task with existing work.\n` +
                `Task #${taskId} has:\n` +
                `- ${task.changes?.length || 0} file changes\n` +
                `- ${task.comments?.length || 0} comments\n` +
                `- ${task.research?.length || 0} research entries\n\n` +
                `Archive the task or request user approval for deletion.`
            );
        }

        // Allow deletion if no work exists
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== taskId);

        if (this.tasks.length < initialLength) {
            this.saveTasks();
            console.log(`[LocalStorage] ✅ Task #${taskId} deleted (no existing work)`);
            return true;
        }

        return false;
    }

    /**
     * Add a question to a task
     */
    async addQuestion(taskId: string, questionData: {
        text: string;
        category: string;
        priority?: string;
        context?: string;
        options?: Array<{ label: string; recommended?: boolean }>;
    }): Promise<any> {
        this.loadTasks();

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            // Silent: task not found
            return null;
        }

        const task = this.tasks[taskIndex];

        // Generate question ID
        const questionId = `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create question object
        const question = {
            id: questionId,
            text: questionData.text,
            category: questionData.category,
            priority: questionData.priority || 'medium',
            context: questionData.context,
            options: questionData.options || [],
            askedAt: new Date().toISOString()
        };

        // Add to qaHistory
        const qaHistory = (task as any).qaHistory || [];
        qaHistory.push({ question });

        // Update task
        this.tasks[taskIndex] = {
            ...task,
            qaHistory,
            updatedAt: new Date().toISOString()
        } as Task;

        this.saveTasks();
        // Silent: question added successfully
        return question;
    }

    /**
     * Add a comment to a task
     */
    async addComment(taskId: string, commentData: {
        type: string;
        content: string;
        author: string;
        authorName: string;
        createdAt: string;
    }): Promise<any> {
        this.loadTasks();

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return null;
        }

        const task = this.tasks[taskIndex];
        const comments = (task as any).comments || [];
        
        const comment = {
            id: `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...commentData
        };

        comments.push(comment);

        this.tasks[taskIndex] = {
            ...task,
            comments,
            updatedAt: new Date().toISOString()
        } as Task;

        this.saveTasks();
        return comment;
    }

    /**
     * Get comments for a task
     */
    async getComments(taskId: string, type?: string): Promise<any[]> {
        this.loadTasks();

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return [];
        }

        const comments = (task as any).comments || [];
        
        if (type && type !== 'all') {
            return comments.filter((c: any) => c.type === type);
        }

        return comments;
    }

    /**
     * Log a file change to a task
     */
    async logChange(taskId: string, changeData: {
        filePath: string;
        changeType: string;
        description: string;
        linesAdded: number;
        linesDeleted: number;
        timestamp: string;
    }): Promise<any> {
        this.loadTasks();

        // 🚨 RESTRICTION #5: FILE SCOPE RESTRICTIONS
        this.validateFileScope(changeData.filePath);

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return null;
        }

        const task = this.tasks[taskIndex];
        const changes = (task as any).changes || [];

        const change = {
            id: `ch${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...changeData
        };

        changes.push(change);

        this.tasks[taskIndex] = {
            ...task,
            changes,
            updatedAt: new Date().toISOString()
        } as Task;

        this.saveTasks();
        return change;
    }

    /**
     * Get changelog (file changes) for a task
     */
    async getChangelog(taskId: string): Promise<any[]> {
        this.loadTasks();

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return [];
        }

        return (task as any).changes || [];
    }

    /**
     * Get questions for a task
     */
    async getQuestions(taskId: string, includeAnswered = true): Promise<any[]> {
        this.loadTasks();

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return [];
        }

        const qaHistory = (task as any).qaHistory || [];
        
        return qaHistory.map((qa: any) => ({
            id: qa.question.id,
            questionText: qa.question.text,
            category: qa.question.category,
            priority: qa.question.priority,
            context: qa.question.context,
            options: qa.question.options,
            askedAt: qa.question.askedAt,
            answer: qa.answer
        })).filter((q: any) => includeAnswered || !q.answer);
    }

    /**
     * List tasks with optional filtering
     */
    async listTasks(filters?: {
        status?: string;
        priority?: string;
        tags?: string[];
    }): Promise<Task[]> {
        this.loadTasks();

        let filtered = [...this.tasks];

        if (filters?.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }

        if (filters?.priority) {
            filtered = filtered.filter(t => t.priority === filters.priority);
        }

        if (filters?.tags && filters.tags.length > 0) {
            filtered = filtered.filter(t => 
                t.tags && filters.tags && filters.tags.some(tag => t.tags && t.tags.includes(tag))
            );
        }

        return filtered;
    }
}





















