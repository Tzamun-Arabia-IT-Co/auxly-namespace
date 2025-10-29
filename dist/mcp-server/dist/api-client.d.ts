import type { Task, CreateTaskRequest, UpdateTaskRequest, User } from './types.js';
export declare class ApiClient {
    private axios;
    private apiKey;
    constructor(baseURL: string, apiKey: string);
    verifyApiKey(): Promise<User>;
    getTasks(status?: string): Promise<Task[]>;
    getTask(taskId: string): Promise<Task>;
    createTask(task: CreateTaskRequest): Promise<Task>;
    updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task>;
    deleteTask(taskId: string): Promise<void>;
    isAuthenticated(): boolean;
    getApiKey(): string;
}
//# sourceMappingURL=api-client.d.ts.map