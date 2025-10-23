"use strict";
/**
 * Local Storage Service
 * Handles task storage in .auxly/tasks.json (similar to Todo2 approach)
 * Fast, reliable, offline-first task management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageService = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LocalStorageService {
    constructor() {
        this.storageDir = '';
        this.tasksFile = '';
        this.tasks = [];
        this.nextId = 1;
    }
    static getInstance() {
        if (!LocalStorageService.instance) {
            LocalStorageService.instance = new LocalStorageService();
        }
        return LocalStorageService.instance;
    }
    /**
     * Initialize storage in workspace .auxly directory
     */
    async initialize() {
        console.log('🔍 LocalStorage.initialize() called');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        console.log('🔍 Workspace folders:', vscode.workspace.workspaceFolders);
        if (!workspaceFolder) {
            const errorMsg = 'No workspace folder open. Please open a folder first (File → Open Folder)';
            console.error('❌', errorMsg);
            vscode.window.showErrorMessage(errorMsg);
            throw new Error(errorMsg);
        }
        this.storageDir = path.join(workspaceFolder.uri.fsPath, '.auxly');
        this.tasksFile = path.join(this.storageDir, 'tasks.json');
        console.log('📂 Storage directory:', this.storageDir);
        console.log('📂 Tasks file:', this.tasksFile);
        // Create .auxly directory if it doesn't exist
        if (!fs.existsSync(this.storageDir)) {
            console.log('📁 Creating .auxly directory...');
            fs.mkdirSync(this.storageDir, { recursive: true });
            console.log('✅ Created .auxly directory at:', this.storageDir);
            vscode.window.showInformationMessage('✅ Created .auxly directory for task storage');
        }
        else {
            console.log('📁 .auxly directory already exists');
        }
        // Load existing tasks or create new file
        await this.loadTasks();
        console.log(`✅ Local storage initialized: ${this.tasks.length} tasks loaded`);
        vscode.window.showInformationMessage(`✅ Auxly tasks loaded: ${this.tasks.length} tasks`);
    }
    /**
     * Load tasks from file
     */
    async loadTasks() {
        try {
            if (fs.existsSync(this.tasksFile)) {
                console.log(`📂 Loading tasks from: ${this.tasksFile}`);
                const data = fs.readFileSync(this.tasksFile, 'utf-8');
                const storage = JSON.parse(data);
                this.tasks = storage.tasks || [];
                // Parse JSON string fields (from MCP) back into objects
                this.tasks = this.tasks.map(task => {
                    const parsedTask = { ...task };
                    // Parse research if it's a string
                    if (typeof task.research === 'string' && task.research) {
                        try {
                            parsedTask.research = JSON.parse(task.research);
                        }
                        catch (e) {
                            console.warn(`Failed to parse research for task ${task.id}:`, e);
                            parsedTask.research = [];
                        }
                    }
                    // Parse changes if it's a string
                    if (typeof task.changes === 'string' && task.changes) {
                        try {
                            parsedTask.changes = JSON.parse(task.changes);
                        }
                        catch (e) {
                            console.warn(`Failed to parse changes for task ${task.id}:`, e);
                            parsedTask.changes = [];
                        }
                    }
                    // Parse qaHistory if it's a string
                    if (typeof task.qaHistory === 'string' && task.qaHistory) {
                        try {
                            parsedTask.qaHistory = JSON.parse(task.qaHistory);
                        }
                        catch (e) {
                            console.warn(`Failed to parse qaHistory for task ${task.id}:`, e);
                            parsedTask.qaHistory = [];
                        }
                    }
                    // Parse comments if it's a string (CRITICAL FIX!)
                    if (typeof task.comments === 'string' && task.comments) {
                        try {
                            parsedTask.comments = JSON.parse(task.comments);
                        }
                        catch (e) {
                            console.warn(`Failed to parse comments for task ${task.id}:`, e);
                            parsedTask.comments = [];
                        }
                    }
                    // Parse tags if it's a string
                    if (typeof task.tags === 'string' && task.tags) {
                        try {
                            parsedTask.tags = JSON.parse(task.tags);
                        }
                        catch (e) {
                            console.warn(`Failed to parse tags for task ${task.id}:`, e);
                            parsedTask.tags = [];
                        }
                    }
                    // Ensure arrays default to empty arrays if undefined
                    parsedTask.research = parsedTask.research || [];
                    parsedTask.changes = parsedTask.changes || [];
                    parsedTask.qaHistory = parsedTask.qaHistory || [];
                    parsedTask.comments = parsedTask.comments || [];
                    parsedTask.tags = parsedTask.tags || [];
                    return parsedTask;
                });
                // Calculate next ID
                if (this.tasks.length > 0) {
                    const maxId = Math.max(...this.tasks.map(t => parseInt(t.id) || 0));
                    this.nextId = maxId + 1;
                }
                console.log(`✅ Loaded ${this.tasks.length} tasks from ${this.tasksFile}`);
            }
            else {
                // 🔧 FIX: Only create empty file if it truly doesn't exist
                // Don't overwrite if file exists but we failed to read it
                console.log(`📂 Tasks file doesn't exist yet: ${this.tasksFile}`);
                console.log('📂 Will create empty file ONLY if we need to save tasks later');
                console.log('⚠️ NOT creating empty file on initialization to prevent data loss');
                this.tasks = [];
                // Don't call saveTasks() here! Let it be created when first task is added
            }
        }
        catch (error) {
            console.error('❌ Error loading tasks:', error);
            console.error('❌ Will NOT overwrite existing file - keeping in-memory empty');
            this.tasks = [];
            // Don't overwrite the file if there was an error reading it!
        }
    }
    /**
     * Save tasks to file
     */
    async saveTasks() {
        try {
            // 🐛 DEBUG: Log call stack to find who's clearing tasks
            const stack = new Error().stack;
            console.log(`💾 saveTasks() called with ${this.tasks.length} tasks`);
            if (this.tasks.length === 0) {
                console.warn('⚠️ WARNING: Saving EMPTY task array!');
                console.warn('⚠️ Call stack:', stack);
            }
            // 🔧 FIX: Ensure directory exists before writing
            if (!fs.existsSync(this.storageDir)) {
                fs.mkdirSync(this.storageDir, { recursive: true });
                console.log(`📁 Created storage directory: ${this.storageDir}`);
            }
            const storage = {
                tasks: this.tasks,
                lastModified: new Date().toISOString(),
                version: '1.0.0'
            };
            fs.writeFileSync(this.tasksFile, JSON.stringify(storage, null, 2), 'utf-8');
            console.log(`✅ Saved ${this.tasks.length} tasks to ${this.tasksFile}`);
        }
        catch (error) {
            console.error('❌ Error saving tasks:', error);
            throw error;
        }
    }
    /**
     * Get all tasks
     */
    async getAllTasks() {
        // 🔧 FIX: Reload from file to get changes from MCP server
        await this.loadTasks();
        return [...this.tasks];
    }
    /**
     * Get tasks by status
     */
    async getTasksByStatus(status) {
        // 🔧 FIX: Reload from file to get changes from MCP server
        await this.loadTasks();
        if (!status) {
            return [...this.tasks];
        }
        return this.tasks.filter(t => t.status === status);
    }
    /**
     * Get single task by ID
     */
    async getTask(taskId) {
        // 🔧 FIX: Reload from file to get changes from MCP server
        await this.loadTasks();
        return this.tasks.find(t => t.id === taskId) || null;
    }
    /**
     * Create new task
     */
    async createTask(taskData) {
        const newTask = {
            id: String(this.nextId++),
            title: taskData.title || 'Untitled Task',
            description: taskData.description || '',
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            tags: taskData.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.tasks.push(newTask);
        await this.saveTasks();
        console.log(`✅ Created task: ${newTask.id} - ${newTask.title}`);
        return newTask;
    }
    /**
     * Update existing task
     */
    async updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            console.error(`❌ Task not found: ${taskId}`);
            return null;
        }
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            id: taskId, // Preserve ID
            updatedAt: new Date().toISOString()
        };
        await this.saveTasks();
        console.log(`✅ Updated task: ${taskId}`);
        return this.tasks[taskIndex];
    }
    /**
     * Delete task
     */
    async deleteTask(taskId) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        if (this.tasks.length < initialLength) {
            await this.saveTasks();
            console.log(`✅ Deleted task: ${taskId}`);
            return true;
        }
        console.error(`❌ Task not found: ${taskId}`);
        return false;
    }
    /**
     * Get tasks grouped by status (for Kanban board)
     * With custom sorting per bucket:
     * - To Do: oldest first (by createdAt)
     * - In Progress: aiWorkingOn=true first, then by time
     * - Review: oldest first (by createdAt)
     * - Done: newest first (by createdAt DESC)
     */
    async getGroupedTasks() {
        // 🔧 FIX: Reload from file to get changes from MCP server
        await this.loadTasks();
        return {
            // To Do: Sort by createdAt ascending (oldest first)
            todo: this.tasks
                .filter(t => t.status === 'todo')
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
            // In Progress: Sort by aiWorkingOn (true first), then by createdAt
            in_progress: this.tasks
                .filter(t => t.status === 'in_progress')
                .sort((a, b) => {
                // aiWorkingOn=true tasks come first
                if (a.aiWorkingOn && !b.aiWorkingOn)
                    return -1;
                if (!a.aiWorkingOn && b.aiWorkingOn)
                    return 1;
                // If both have same aiWorkingOn status, sort by time (oldest first)
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }),
            // Review: Sort by createdAt ascending (oldest first)
            review: this.tasks
                .filter(t => t.status === 'review')
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
            // Done: Sort by createdAt descending (newest first)
            done: this.tasks
                .filter(t => t.status === 'done')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        };
    }
    /**
     * Watch for external file changes (for multi-editor sync)
     */
    watchTasksFile(callback) {
        const watcher = fs.watchFile(this.tasksFile, async () => {
            console.log('📡 Tasks file changed externally, reloading...');
            await this.loadTasks();
            callback();
        });
        return {
            dispose: () => {
                fs.unwatchFile(this.tasksFile);
            }
        };
    }
    /**
     * Get storage file path (for debugging)
     */
    getStoragePath() {
        return this.tasksFile;
    }
    /**
     * Clear all tasks (for testing)
     */
    async clearAllTasks() {
        this.tasks = [];
        await this.saveTasks();
        console.log('🗑️ All tasks cleared');
    }
}
exports.LocalStorageService = LocalStorageService;
//# sourceMappingURL=local-storage.js.map