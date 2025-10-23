/**
 * Backend API Client
 * Connects to Auxly backend for task management using API Key
 */

import axios, { AxiosInstance } from 'axios';
import type {
    Task,
    CreateTaskRequest,
    UpdateTaskRequest,
    User
} from './types.js';

export class ApiClient {
    private axios: AxiosInstance;
    private apiKey: string;

    constructor(baseURL: string, apiKey: string) {
        this.apiKey = apiKey;
        this.axios = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        });
    }

    /**
     * Verify API key and get user info
     */
    async verifyApiKey(): Promise<User> {
        const response = await this.axios.get<{ user: User }>('/api-keys/verify');
        return response.data.user;
    }

    /**
     * Get all tasks
     */
    async getTasks(status?: string): Promise<Task[]> {
        const params = status ? { status } : {};
        const response = await this.axios.get<Task[]>('/tasks', { params });
        return response.data;
    }

    /**
     * Get single task by ID
     */
    async getTask(taskId: string): Promise<Task> {
        const response = await this.axios.get<Task>(`/tasks/${taskId}`);
        return response.data;
    }

    /**
     * Create new task
     */
    async createTask(task: CreateTaskRequest): Promise<Task> {
        const response = await this.axios.post<Task>('/tasks', task);
        return response.data;
    }

    /**
     * Update existing task
     */
    async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
        const response = await this.axios.put<Task>(`/tasks/${taskId}`, updates);
        return response.data;
    }

    /**
     * Delete task
     */
    async deleteTask(taskId: string): Promise<void> {
        await this.axios.delete(`/tasks/${taskId}`);
    }

    /**
     * Check if API key is configured
     */
    isAuthenticated(): boolean {
        return this.apiKey.length > 0;
    }

    /**
     * Get current API key
     */
    getApiKey(): string {
        return this.apiKey;
    }
}

