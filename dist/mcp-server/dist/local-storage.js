import fs from 'fs';
import path from 'path';
import os from 'os';
export class LocalTaskStorage {
    storageFile;
    tasks = [];
    nextId = 1;
    VALID_TRANSITIONS = {
        'todo': ['in_progress'],
        'in_progress': ['review', 'done'],
        'review': ['done', 'in_progress'],
        'done': []
    };
    FORBIDDEN_PATHS = [
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
    CRITICAL_FILES = [
        'package-lock.json',
        '.env',
        '.env.local',
        '.env.production',
        'tsconfig.json',
        'webpack.config.js',
        'vite.config.ts',
        '.gitignore'
    ];
    PROTECTED_TAGS = [
        'security',
        'database',
        'production',
        'urgent',
        'blocked',
        'critical-bug'
    ];
    APPROVAL_REQUIRED_TAGS = [
        'database-change',
        'api-breaking',
        'security',
        'production'
    ];
    MAX_STALE_TIME_MS = 24 * 60 * 60 * 1000;
    constructor(workspacePath) {
        let workspaceRoot;
        if (workspacePath && workspacePath.trim()) {
            workspaceRoot = workspacePath;
            console.log(`[Auxly MCP] ✅ Using provided workspace: ${workspaceRoot}`);
        }
        else {
            const hardcodedPath = process.platform === 'win32' ? 'C:\\Auxly' : os.homedir();
            workspaceRoot = hardcodedPath;
            console.log(`[Auxly MCP] ⚠️ No workspace provided, using hardcoded: ${workspaceRoot}`);
        }
        const storageDir = path.join(workspaceRoot, '.auxly');
        this.storageFile = path.join(storageDir, 'tasks.json');
        console.log(`[Auxly MCP] 📁 Storage directory: ${storageDir}`);
        console.log(`[Auxly MCP] 📄 Tasks file: ${this.storageFile}`);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
            console.log(`[Auxly MCP] ✅ Created storage directory: ${storageDir}`);
        }
        this.loadTasks();
    }
    loadTasks() {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data = fs.readFileSync(this.storageFile, 'utf-8');
                const storage = JSON.parse(data);
                this.tasks = storage.tasks || [];
                if (this.tasks.length > 0) {
                    const maxId = Math.max(...this.tasks.map(t => parseInt(t.id) || 0));
                    this.nextId = maxId + 1;
                }
            }
            else {
                this.saveTasks();
            }
        }
        catch (error) {
            this.tasks = [];
        }
    }
    saveTasks() {
        try {
            const storage = {
                tasks: this.tasks,
                lastModified: new Date().toISOString(),
                version: '1.0.0'
            };
            fs.writeFileSync(this.storageFile, JSON.stringify(storage, null, 2), 'utf-8');
        }
        catch (error) {
            throw error;
        }
    }
    validateStatusTransition(currentStatus, newStatus) {
        const validNext = this.VALID_TRANSITIONS[currentStatus];
        if (!validNext || !validNext.includes(newStatus)) {
            throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}\n` +
                `Valid transitions from ${currentStatus}: ${validNext?.join(', ') || 'none'}`);
        }
    }
    validateResearchExists(task, newStatus) {
        if (newStatus === 'in_progress') {
            if (task.category === 'question') {
                return;
            }
            const comments = task.comments || [];
            const hasResearch = comments.some((c) => c.type === 'technical_research' || c.type === 'business_research');
            if (!hasResearch) {
                throw new Error(`❌ BLOCKED: Cannot start Task #${task.id} "${task.title}" without research.\n\n` +
                    `MANDATORY REQUIREMENT: Add research using auxly_add_research BEFORE starting work.\n\n` +
                    `Required research types:\n` +
                    `1. Technical Research (type: "technical_research")\n` +
                    `2. Business Research (type: "business_research")\n\n` +
                    `AI must conduct BOTH types of research before coding.\n\n` +
                    `💡 Exception: Tasks with category "question" don't require research.`);
            }
        }
    }
    validateFileChangesLogged(task, newStatus) {
        if ((newStatus === 'done' || newStatus === 'review')) {
            const nonCodeCategories = ['research', 'documentation', 'testing', 'planning', 'review', 'question'];
            const isNonCodeTask = task.category && nonCodeCategories.includes(task.category);
            const hasNonCodeTag = task.tags?.some(tag => ['test', 'research', 'documentation', 'planning', 'audit', 'review', 'analysis'].includes(tag.toLowerCase()));
            if (isNonCodeTask || hasNonCodeTag) {
                return;
            }
            const hasChanges = task.changes && task.changes.length > 0;
            if (!hasChanges) {
                throw new Error(`Cannot complete task without logging file changes.\n` +
                    `Task appears incomplete - no files modified.\n` +
                    `\n` +
                    `📌 Tip: If this is a non-code task, set category to one of:\n` +
                    `   research, documentation, testing, planning, review, or question`);
            }
        }
    }
    validateConcurrentTaskLimit(taskId, aiWorkingOn) {
        if (aiWorkingOn === true) {
            const workingTasks = this.tasks.filter(t => t.aiWorkingOn === true && t.id !== taskId);
            if (workingTasks.length > 0) {
                const existingTask = workingTasks[0];
                throw new Error(`Already working on Task #${existingTask.id} "${existingTask.title}".\n` +
                    `Complete or pause it before starting another task.`);
            }
        }
    }
    validatePriorityChange(task, newPriority) {
        if (newPriority && newPriority !== task.priority) {
            if (newPriority === 'critical') {
                throw new Error(`Cannot change priority to 'critical'.\n` +
                    `Only users can set critical priority.`);
            }
            console.warn(`[LocalStorage] ⚠️ Priority changed: ${task.priority} → ${newPriority} on Task #${task.id}`);
        }
    }
    validateTagModifications(task, newTags) {
        if (newTags && task.tags) {
            const removedTags = task.tags.filter(t => !newTags.includes(t));
            const protectedRemoved = removedTags.filter(t => this.PROTECTED_TAGS.includes(t));
            if (protectedRemoved.length > 0) {
                throw new Error(`Cannot remove protected tags: ${protectedRemoved.join(', ')}\n` +
                    `These tags are critical for task categorization.`);
            }
        }
    }
    validateTimingRules(task, newStatus) {
        const now = Date.now();
        const updatedAt = new Date(task.updatedAt).getTime();
        const timeElapsed = now - updatedAt;
        if (task.status === 'in_progress' && timeElapsed > this.MAX_STALE_TIME_MS) {
            console.warn(`[LocalStorage] ⚠️ Task #${task.id} is stale (no update for ${Math.round(timeElapsed / 1000 / 60 / 60)} hours)`);
        }
    }
    validateApprovalRequirement(task, newStatus) {
        if (newStatus === 'in_progress') {
            const requiresApproval = task.tags?.some(tag => this.APPROVAL_REQUIRED_TAGS.includes(tag));
            if (requiresApproval) {
                const hasApproval = task.qaHistory?.some((qa) => qa.category === 'APPROVAL REQUEST' && qa.answer);
                if (!hasApproval) {
                    throw new Error(`This task requires approval before starting (tags: ${task.tags?.join(', ')}).\n` +
                        `Use auxly_ask_question with category: APPROVAL REQUEST first.`);
                }
            }
        }
    }
    validateTaskDependencies(task, newStatus) {
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
                throw new Error(`Cannot start task - complete dependencies first:\n${depTasks}`);
            }
        }
    }
    validateNoUnansweredQuestions(task, newStatus) {
        if (newStatus === 'done' || newStatus === 'review') {
            const unansweredQuestions = task.qaHistory?.filter((qa) => !qa.answer) || [];
            if (unansweredQuestions.length > 0) {
                const questionsList = unansweredQuestions.map((qa, idx) => `${idx + 1}. [${qa.category}] ${qa.text}`).join('\n');
                throw new Error(`Cannot complete task - ${unansweredQuestions.length} unanswered question(s) pending:\n\n` +
                    questionsList + '\n\n' +
                    `⚠️ AI must WAIT for user answers before proceeding.\n` +
                    `User will respond via the Auxly task panel.`);
            }
        }
    }
    validateFileScope(filePath) {
        for (const forbidden of this.FORBIDDEN_PATHS) {
            if (forbidden.includes('*')) {
                const pattern = forbidden.replace(/\*/g, '.*');
                if (new RegExp(pattern).test(filePath)) {
                    throw new Error(`Cannot modify forbidden path: ${filePath}\n` +
                        `Matched forbidden pattern: ${forbidden}`);
                }
            }
            else {
                if (filePath.includes(forbidden)) {
                    throw new Error(`Cannot modify forbidden path: ${filePath}\n` +
                        `Path contains: ${forbidden}`);
                }
            }
        }
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || '';
        if (this.CRITICAL_FILES.includes(fileName)) {
            console.warn(`[LocalStorage] ⚠️ CRITICAL FILE MODIFIED: ${filePath}\n` +
                `This change should be reviewed carefully.`);
        }
    }
    async getTasks(status) {
        this.loadTasks();
        if (!status) {
            return [...this.tasks];
        }
        return this.tasks.filter(t => t.status === status);
    }
    async getTask(taskId) {
        this.loadTasks();
        return this.tasks.find(t => t.id === taskId) || null;
    }
    async createTask(data) {
        this.loadTasks();
        const titleLower = data.title.toLowerCase();
        const descriptionLower = (data.description || '').toLowerCase();
        const similarTasks = this.tasks.filter(task => {
            if (task.status === 'done')
                return false;
            const taskTitleLower = task.title.toLowerCase();
            const taskDescLower = (task.description || '').toLowerCase();
            const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
            const taskTitleWords = taskTitleLower.split(/\s+/).filter(w => w.length > 3);
            const titleOverlap = titleWords.filter(word => taskTitleLower.includes(word)).length;
            const titleSimilarity = titleWords.length > 0 ? titleOverlap / titleWords.length : 0;
            let descSimilarity = 0;
            if (descriptionLower && taskDescLower) {
                const descWords = descriptionLower.split(/\s+/).filter(w => w.length > 3);
                const descOverlap = descWords.filter(word => taskDescLower.includes(word)).length;
                descSimilarity = descWords.length > 0 ? descOverlap / descWords.length : 0;
            }
            return titleSimilarity > 0.6 || descSimilarity > 0.5;
        });
        if (similarTasks.length > 0) {
            const heldTasks = similarTasks.filter(t => t.availabilityStatus === 'hold');
            const availableTasks = similarTasks.filter(t => t.availabilityStatus !== 'hold');
            if (heldTasks.length > 0) {
                const heldTask = heldTasks[0];
                console.error(`[LocalStorage] ❌ BLOCKED: Cannot create task - Similar task #${heldTask.id} exists and is ON HOLD`);
                console.error(`[LocalStorage] ❌ Held task: "${heldTask.title}"`);
                console.error(`[LocalStorage] ❌ User must release hold on existing task first`);
                throw new Error(`Cannot create task - Similar task already exists: #${heldTask.id} "${heldTask.title}"\n\n` +
                    `⚠️ That task is ON HOLD. Please:\n` +
                    `1. Release hold on Task #${heldTask.id}\n` +
                    `2. Work on the existing task instead of creating a new one`);
            }
            if (availableTasks.length > 0) {
                const existingTask = availableTasks[0];
                console.error(`[LocalStorage] ❌ BLOCKED: Cannot create task - Similar task #${existingTask.id} already exists`);
                console.error(`[LocalStorage] ❌ Existing task: "${existingTask.title}"`);
                throw new Error(`Cannot create task - Similar task already exists: #${existingTask.id} "${existingTask.title}"\n\n` +
                    `⚠️ Please work on the existing task instead of creating a duplicate.`);
            }
        }
        const newTask = {
            id: String(this.nextId++),
            title: data.title,
            description: data.description,
            status: 'todo',
            priority: data.priority || 'medium',
            category: data.category,
            tags: data.tags,
            availabilityStatus: 'available',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.tasks.push(newTask);
        this.saveTasks();
        return newTask;
    }
    async updateTask(taskId, updates) {
        this.loadTasks();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return null;
        }
        const currentTask = this.tasks[taskIndex];
        if (currentTask.availabilityStatus === 'hold' && updates.availabilityStatus === 'available') {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot change availabilityStatus on Task #${taskId} - Task is ON HOLD`);
            throw new Error(`Task #${taskId} is ON HOLD. Only users can release hold status via UI.`);
        }
        if (currentTask.availabilityStatus === 'hold' && updates.status && updates.status !== currentTask.status) {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot change status on Task #${taskId} - Task is ON HOLD`);
            throw new Error(`❌ BLOCKED: Task #${taskId} "${currentTask.title}" is ON HOLD.\n\n` +
                `Cannot change status from "${currentTask.status}" to "${updates.status}".\n` +
                `Only the user can release hold status via the Auxly dashboard.\n\n` +
                `AI must SKIP this task and work on available tasks only.`);
        }
        if (currentTask.availabilityStatus === 'hold' && updates.aiWorkingOn === true) {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot set aiWorkingOn=true on Task #${taskId} - Task is ON HOLD`);
            throw new Error(`❌ BLOCKED: Task #${taskId} "${currentTask.title}" is ON HOLD.\n\n` +
                `Cannot start working on this task.\n` +
                `Release hold status first via Auxly dashboard.\n\n` +
                `AI must SKIP this task and work on available tasks only.`);
        }
        if (updates.status && updates.status !== currentTask.status) {
            this.validateStatusTransition(currentTask.status, updates.status);
        }
        if (updates.status) {
            this.validateResearchExists(currentTask, updates.status);
            this.validateFileChangesLogged(currentTask, updates.status);
        }
        if (updates.aiWorkingOn !== undefined) {
            this.validateConcurrentTaskLimit(taskId, updates.aiWorkingOn);
        }
        if (updates.priority) {
            this.validatePriorityChange(currentTask, updates.priority);
        }
        if (updates.tags) {
            this.validateTagModifications(currentTask, updates.tags);
        }
        if (updates.status) {
            this.validateTimingRules(currentTask, updates.status);
        }
        if (updates.status) {
            this.validateApprovalRequirement(currentTask, updates.status);
        }
        if (updates.status) {
            this.validateTaskDependencies(currentTask, updates.status);
        }
        if (updates.status) {
            this.validateNoUnansweredQuestions(currentTask, updates.status);
        }
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updates,
            id: taskId,
            updatedAt: new Date().toISOString()
        };
        this.saveTasks();
        return this.tasks[taskIndex];
    }
    async deleteTask(taskId) {
        this.loadTasks();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return false;
        }
        const hasWork = ((task.changes && task.changes.length > 0) ||
            (task.comments && task.comments.length > 0) ||
            (task.research && task.research.length > 0) ||
            (task.qaHistory && task.qaHistory.length > 0));
        if (hasWork) {
            console.error(`[LocalStorage] ❌ BLOCKED: Cannot delete Task #${taskId} - Has existing work`);
            console.error(`[LocalStorage] ❌ Task has: ${task.changes?.length || 0} changes, ${task.comments?.length || 0} comments, ${task.research?.length || 0} research`);
            throw new Error(`Cannot delete task with existing work.\n` +
                `Task #${taskId} has:\n` +
                `- ${task.changes?.length || 0} file changes\n` +
                `- ${task.comments?.length || 0} comments\n` +
                `- ${task.research?.length || 0} research entries\n\n` +
                `Archive the task or request user approval for deletion.`);
        }
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        if (this.tasks.length < initialLength) {
            this.saveTasks();
            console.log(`[LocalStorage] ✅ Task #${taskId} deleted (no existing work)`);
            return true;
        }
        return false;
    }
    async addQuestion(taskId, questionData) {
        this.loadTasks();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return null;
        }
        const task = this.tasks[taskIndex];
        const questionId = `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const question = {
            id: questionId,
            text: questionData.text,
            category: questionData.category,
            priority: questionData.priority || 'medium',
            context: questionData.context,
            options: questionData.options || [],
            askedAt: new Date().toISOString()
        };
        const qaHistory = task.qaHistory || [];
        qaHistory.push({ question });
        this.tasks[taskIndex] = {
            ...task,
            qaHistory,
            updatedAt: new Date().toISOString()
        };
        this.saveTasks();
        return question;
    }
    async addComment(taskId, commentData) {
        this.loadTasks();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return null;
        }
        const task = this.tasks[taskIndex];
        const comments = task.comments || [];
        const comment = {
            id: `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...commentData
        };
        comments.push(comment);
        this.tasks[taskIndex] = {
            ...task,
            comments,
            updatedAt: new Date().toISOString()
        };
        this.saveTasks();
        return comment;
    }
    async getComments(taskId, type) {
        this.loadTasks();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return [];
        }
        const comments = task.comments || [];
        if (type && type !== 'all') {
            return comments.filter((c) => c.type === type);
        }
        return comments;
    }
    async logChange(taskId, changeData) {
        this.loadTasks();
        this.validateFileScope(changeData.filePath);
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            return null;
        }
        const task = this.tasks[taskIndex];
        const changes = task.changes || [];
        const change = {
            id: `ch${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...changeData
        };
        changes.push(change);
        this.tasks[taskIndex] = {
            ...task,
            changes,
            updatedAt: new Date().toISOString()
        };
        this.saveTasks();
        return change;
    }
    async getChangelog(taskId) {
        this.loadTasks();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return [];
        }
        return task.changes || [];
    }
    async getQuestions(taskId, includeAnswered = true) {
        this.loadTasks();
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            return [];
        }
        const qaHistory = task.qaHistory || [];
        return qaHistory.map((qa) => ({
            id: qa.question.id,
            questionText: qa.question.text,
            category: qa.question.category,
            priority: qa.question.priority,
            context: qa.question.context,
            options: qa.question.options,
            askedAt: qa.question.askedAt,
            answer: qa.answer
        })).filter((q) => includeAnswered || !q.answer);
    }
    async listTasks(filters) {
        this.loadTasks();
        let filtered = [...this.tasks];
        if (filters?.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }
        if (filters?.priority) {
            filtered = filtered.filter(t => t.priority === filters.priority);
        }
        if (filters?.tags && filters.tags.length > 0) {
            filtered = filtered.filter(t => t.tags && filters.tags && filters.tags.some(tag => t.tags && t.tags.includes(tag)));
        }
        return filtered;
    }
}
//# sourceMappingURL=local-storage.js.map