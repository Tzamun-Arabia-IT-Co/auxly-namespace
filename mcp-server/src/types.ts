/**
 * Type Definitions for Auxly MCP Server
 */

// Task categories for classification
export type TaskCategory = 
    // Code categories (require file changes)
    | 'feature'         // New functionality
    | 'bugfix'          // Bug fixes
    | 'refactoring'     // Code improvements
    | 'integration'     // System connections
    | 'ui'              // User interface changes
    // Non-code categories (no file changes required)
    | 'research'        // Investigation, analysis
    | 'documentation'   // Writing docs
    | 'testing'         // Manual testing, QA
    | 'planning'        // Architecture, design
    | 'review'          // Code review, audit
    | 'question';       // Clarifications

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category?: TaskCategory;  // Optional for backward compatibility, but recommended
    tags?: string[];
    dependencies?: string[];
    assignedBy?: string;
    aiWorkingOn?: boolean;
    availabilityStatus?: 'available' | 'hold';
    createdAt: string;
    updatedAt: string;
    // Additional fields for tracking work and audit trail
    changes?: any[];
    comments?: any[];
    research?: any[];
    qaHistory?: any[];
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: TaskCategory;  // Optional for backward compatibility
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







