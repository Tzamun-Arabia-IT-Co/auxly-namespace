/**
 * API Type Definitions
 * TypeScript interfaces for all API requests and responses
 */

// ========================================
// Base Types
// ========================================

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
    success: boolean;
}

export interface ApiError {
    message: string;
    statusCode: number;
    details?: unknown;
}

// ========================================
// Authentication Types
// ========================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // Seconds until expiration
    user: User;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    plan: 'free' | 'pro' | 'team';
    createdAt: string;
    updatedAt: string;
}

// ========================================
// Task Types
// ========================================

export interface TaskComment {
    id: string;
    author: 'user' | 'ai';
    authorName?: string;
    content: string;
    type: 'comment' | 'reopen_reason' | 'status_change';
    createdAt: string;
}

export interface ResearchLink {
    title: string;
    url: string;
    description: string;
    source: string;
}

export interface ResearchEntry {
    content: string;
    links: ResearchLink[];
    keyInsights: string[];
    recommendation?: string;
    createdAt: string;
    createdBy: 'user' | 'ai';
}

export interface FileChange {
    filePath: string;
    changeType: 'created' | 'modified' | 'deleted';
    linesAdded?: number;
    linesRemoved?: number;
    description: string;
    timestamp: string;
}

export interface AIQuestion {
    id: string;
    text: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    context?: string;
    options?: { label: string; recommended?: boolean }[];
    askedAt: string;
}

export interface AIAnswer {
    questionId: string;
    selectedOption?: string;
    customAnswer?: string;
    answeredAt: string;
    answeredBy: 'user' | 'ai';
}

export interface TaskQA {
    question: AIQuestion;
    answer?: AIAnswer;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    dependencies?: string[];
    assignedBy?: string;
    
    // Extended fields for detailed tracking
    research?: ResearchEntry[];
    comments?: TaskComment[];
    changes?: FileChange[];
    qaHistory?: TaskQA[];
    
    // AI Agent working indicator
    aiWorkingOn?: boolean;
    
    // Task availability for AI agent
    availabilityStatus?: 'available' | 'hold';
    
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    dependencies?: string[];
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    dependencies?: string[];
    research?: ResearchEntry[];
    comments?: TaskComment[];
    changes?: FileChange[];
    availabilityStatus?: 'available' | 'hold';
    qaHistory?: TaskQA[];
    aiWorkingOn?: boolean;
}

export interface TaskListResponse {
    tasks: Task[];
    total: number;
    page?: number;
    pageSize?: number;
}

// ========================================
// Subscription Types
// ========================================

export interface Subscription {
    id: string;
    userId: string;
    plan: 'free' | 'pro' | 'team';
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
}

export interface SubscriptionResponse {
    subscription: Subscription;
}

// ========================================
// API Key Types (for future use)
// ========================================

export interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsed?: string;
}

export interface CreateApiKeyRequest {
    name: string;
}

export interface ApiKeyResponse {
    apiKey: ApiKey;
}

// ========================================
// HTTP Client Configuration
// ========================================

export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

export interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number; // Timestamp when token expires
}







