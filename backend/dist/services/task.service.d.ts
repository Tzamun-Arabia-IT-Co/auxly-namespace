export interface Task {
    id: number;
    user_id: number;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    created_at: Date;
    updated_at: Date;
}
export interface CreateTaskData {
    user_id: number;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
}
export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Create a new task
 */
export declare function createTask(data: CreateTaskData): Promise<Task>;
/**
 * Get all tasks for a user, optionally filtered by status
 */
export declare function getTasks(userId: number, status?: string): Promise<Task[]>;
/**
 * Get a specific task by ID
 */
export declare function getTaskById(taskId: number, userId: number): Promise<Task | null>;
/**
 * Update a task
 */
export declare function updateTask(taskId: number, userId: number, updates: UpdateTaskData): Promise<Task | null>;
/**
 * Delete a task
 */
export declare function deleteTask(taskId: number, userId: number): Promise<boolean>;
//# sourceMappingURL=task.service.d.ts.map