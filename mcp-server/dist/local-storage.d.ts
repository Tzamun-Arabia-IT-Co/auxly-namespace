import type { Task } from './types.js';
export interface TaskStorage {
    tasks: Task[];
    lastModified: string;
    version: string;
}
export declare class LocalTaskStorage {
    private storageFile;
    private tasks;
    private nextId;
    private readonly VALID_TRANSITIONS;
    private readonly FORBIDDEN_PATHS;
    private readonly CRITICAL_FILES;
    private readonly PROTECTED_TAGS;
    private readonly APPROVAL_REQUIRED_TAGS;
    private readonly MIN_WORK_TIME_MS;
    private readonly MAX_STALE_TIME_MS;
    constructor(workspacePath?: string);
    private loadTasks;
    private saveTasks;
    private validateStatusTransition;
    private validateResearchExists;
    private validateFileChangesLogged;
    private validateConcurrentTaskLimit;
    private validatePriorityChange;
    private validateTagModifications;
    private validateTimingRules;
    private validateApprovalRequirement;
    private validateTaskDependencies;
    private validateNoUnansweredQuestions;
    private validateFileScope;
    getTasks(status?: string): Promise<Task[]>;
    getTask(taskId: string): Promise<Task | null>;
    createTask(data: {
        title: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        tags?: string[];
    }): Promise<Task>;
    updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null>;
    deleteTask(taskId: string): Promise<boolean>;
    addQuestion(taskId: string, questionData: {
        text: string;
        category: string;
        priority?: string;
        context?: string;
        options?: Array<{
            label: string;
            recommended?: boolean;
        }>;
    }): Promise<any>;
    addComment(taskId: string, commentData: {
        type: string;
        content: string;
        author: string;
        authorName: string;
        createdAt: string;
    }): Promise<any>;
    getComments(taskId: string, type?: string): Promise<any[]>;
    logChange(taskId: string, changeData: {
        filePath: string;
        changeType: string;
        description: string;
        linesAdded: number;
        linesDeleted: number;
        timestamp: string;
    }): Promise<any>;
    getChangelog(taskId: string): Promise<any[]>;
    getQuestions(taskId: string, includeAnswered?: boolean): Promise<any[]>;
    listTasks(filters?: {
        status?: string;
        priority?: string;
        tags?: string[];
    }): Promise<Task[]>;
}
//# sourceMappingURL=local-storage.d.ts.map