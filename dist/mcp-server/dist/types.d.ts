export type TaskCategory = 'feature' | 'bugfix' | 'refactoring' | 'integration' | 'ui' | 'research' | 'documentation' | 'testing' | 'planning' | 'review' | 'question';
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category?: TaskCategory;
    tags?: string[];
    dependencies?: string[];
    assignedBy?: string;
    aiWorkingOn?: boolean;
    availabilityStatus?: 'available' | 'hold';
    createdAt: string;
    updatedAt: string;
    changes?: any[];
    comments?: any[];
    research?: any[];
    qaHistory?: any[];
}
export interface CreateTaskRequest {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: TaskCategory;
    tags?: string[];
    dependencies?: string[];
}
export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: TaskCategory;
    tags?: string[];
    dependencies?: string[];
    aiWorkingOn?: boolean;
    availabilityStatus?: 'available' | 'hold';
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
}
export interface User {
    id: string;
    email: string;
    name?: string;
    plan: 'free' | 'pro' | 'team';
    createdAt: string;
    updatedAt: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
    success: boolean;
}
//# sourceMappingURL=types.d.ts.map