"use strict";
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
exports.TaskPanelProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const extension_1 = require("../extension");
const packageJson = require('../../package.json');
/**
 * WebView Panel Provider for Auxly Task Management
 * Todo2-style Kanban board + AI Agent Questions/Approval System
 */
class TaskPanelProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    show() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (this.panel) {
            this.panel.reveal(column);
            // 🔄 Reload tasks when panel is revealed
            console.log('🔄 Panel revealed - loading tasks from storage');
            this.initializeTasksAsync();
            // 🔧 FIX: Send auth state to webview on reveal to update UI
            const authService = (0, extension_1.getAuthService)();
            if (authService) {
                this.updateAuthState(authService.getAuthState());
            }
            return;
        }
        this.panel = vscode.window.createWebviewPanel('auxlyTaskPanel', 'Auxly - Task Management', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'resources')
            ]
        });
        this.panel.webview.html = this.getHtmlContent(this.panel.webview);
        this.panel.webview.onDidReceiveMessage(message => this.handleMessage(message), undefined, []);
        this.panel.onDidDispose(() => {
            this.panel = undefined;
            // Notify TaskService that webview is hidden
            // Panel is now hidden - no action needed
        }, null, []);
        // 🔄 Initialize tasks asynchronously (don't block webview creation)
        console.log('🔄 Webview created - initializing tasks');
        this.initializeTasksAsync();
    }
    /**
     * Show forced API key modal (non-dismissible)
     * Used on extension activation when no API key is found
     */
    showForcedApiKeyModal() {
        if (!this.panel) {
            // If panel doesn't exist, create it first
            this.show();
            // Wait a bit for panel to be ready, then send command
            setTimeout(() => {
                if (this.panel) {
                    this.panel.webview.postMessage({
                        command: 'showForcedApiKeyModal'
                    });
                }
            }, 100);
        }
        else {
            // Panel exists, send command immediately
            this.panel.webview.postMessage({
                command: 'showForcedApiKeyModal'
            });
        }
    }
    /**
     * Initialize tasks asynchronously (loads existing tasks)
     * Separated from show() to avoid blocking webview creation
     */
    async initializeTasksAsync() {
        try {
            const taskService = (0, extension_1.getTaskService)();
            // 🔧 FIX: Use fetchTasks() instead of forceFreshFetch()
            // fetchTasks() loads existing tasks without clearing storage first!
            console.log('📋 Loading existing tasks from storage...');
            const tasks = await taskService.fetchTasks();
            console.log(`✅ Loaded ${tasks ? Object.values(tasks).flat().length : 0} tasks`);
            // Send tasks to webview
            if (tasks) {
                this.updateTasks(tasks);
            }
            // Send current auth state to webview
            const authService = (0, extension_1.getAuthService)();
            this.updateAuthState(authService.getAuthState());
        }
        catch (error) {
            console.error('Failed to initialize tasks:', error);
        }
    }
    /**
     * Update authentication state in webview
     */
    updateAuthState(state) {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'authStateChanged',
                data: state
            });
        }
    }
    /**
     * Update tasks in webview
     */
    updateTasks(tasks) {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'tasksLoaded',
                data: tasks
            });
            // Auto-check for unanswered questions after tasks load
            this.checkForUnansweredQuestions(tasks);
            // Also send trial info whenever tasks are loaded
            this.sendTrialInfo();
        }
    }
    checkForUnansweredQuestions(groupedTasks) {
        try {
            // Get all tasks from all groups
            const allTasks = [
                ...(groupedTasks.todo || []),
                ...(groupedTasks.in_progress || []),
                ...(groupedTasks.review || []),
                ...(groupedTasks.done || [])
            ];
            // Find first task with unanswered question
            for (const task of allTasks) {
                if (task.qaHistory && task.qaHistory.length > 0) {
                    // Check if there's an unanswered question (no answer property)
                    const unansweredQA = task.qaHistory.find((qa) => !qa.answer);
                    if (unansweredQA && unansweredQA.question) {
                        console.log(`🤖 Found unanswered question in Task #${task.id} - Auto-showing popup!`);
                        // Auto-show the question after a brief delay to let UI settle
                        setTimeout(() => {
                            const queueInfo = this.calculateQueueInfo(task.qaHistory || []);
                            this.sendQuestionToWebview(task.id, {
                                id: unansweredQA.question.id,
                                text: unansweredQA.question.text,
                                category: unansweredQA.question.category || 'QUESTION',
                                priority: unansweredQA.question.priority || 'medium',
                                context: unansweredQA.question.context,
                                options: unansweredQA.question.options || [],
                                queueInfo: queueInfo
                            });
                        }, 1500); // 1.5 second delay to let dashboard fully render
                        break; // Only show one question at a time
                    }
                }
            }
        }
        catch (error) {
            console.error('Error checking for unanswered questions:', error);
        }
    }
    calculateQueueInfo(qaHistory) {
        const totalQuestions = qaHistory.length;
        const answeredCount = qaHistory.filter((qa) => qa.answer).length;
        return {
            current: answeredCount + 1,
            total: totalQuestions
        };
    }
    /**
     * Update loading state in webview
     */
    updateLoadingState(state) {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'setLoading',
                data: state
            });
        }
    }
    async handleMessage(message) {
        console.log('💬 Webview message received:', message.command);
        switch (message.command) {
            case 'connect':
                await this.handleConnect(message.apiKey);
                break;
            case 'disconnect':
                await this.handleDisconnect();
                break;
            case 'openExternalUrl':
                if (message.url) {
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;
            case 'getTasks':
                console.log('📥 getTasks command received in handler');
                await this.fetchTasks();
                break;
            case 'answerQuestion':
                await this.answerAgentQuestion(message.data);
                break;
            case 'answerAIQuestion':
                await this.handleAIQuestionAnswer(message.questionId, message.answer, message.taskId, message.qaData);
                break;
            case 'skipAIQuestion':
                await this.handleAIQuestionSkip(message.questionId);
                break;
            case 'moveTaskToDone':
                await this.moveTaskToDone(message.taskId);
                break;
            case 'updateTaskAvailability':
                await this.updateTaskAvailability(message.taskId, message.availabilityStatus);
                break;
            case 'reopenTask':
                await this.reopenTask(message.taskId, message.reason);
                break;
            case 'reopenTaskWithComment':
                await this.reopenTaskWithComment(message.taskId, message.reason);
                break;
            case 'requestCommentInput':
                await this.handleRequestCommentInput(message.taskId);
                break;
            case 'requestReopenReason':
                await this.handleRequestReopenReason(message.taskId);
                break;
            case 'requestStatusChange':
                await this.handleRequestStatusChange(message.taskId, message.currentStatus);
                break;
            case 'addComment':
                await this.handleAddComment(message.taskId, message.comment);
                break;
            case 'changeTaskStatus':
                await this.handleChangeTaskStatus(message.taskId, message.newStatus);
                break;
            case 'updateTaskStatus':
                await this.updateTaskStatus(message.taskId, message.status);
                break;
            case 'deleteTask':
                await this.deleteTask(message.taskId, message.taskTitle);
                break;
            case 'showInfo':
                vscode.window.showInformationMessage(message.message || message.text);
                break;
            case 'showWarning':
                vscode.window.showWarningMessage(message.message);
                break;
            case 'showError':
                vscode.window.showErrorMessage(message.message);
                break;
            case 'openFile':
                await this.handleOpenFile(message.filePath);
                break;
            case 'restartMCP':
                await this.handleRestartMCP(message);
                break;
            case 'checkMCPHealth':
                await this.handleCheckMCPHealth();
                break;
            case 'getCursorProcessTree':
                await this.handleGetCursorProcessTree();
                break;
            case 'getTrialInfo':
                await this.sendTrialInfo();
                break;
        }
    }
    async handleOpenFile(filePath) {
        try {
            // Resolve file path (handle both absolute and relative paths)
            let uri;
            if (path.isAbsolute(filePath)) {
                uri = vscode.Uri.file(filePath);
            }
            else {
                // Relative to workspace root
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    vscode.window.showErrorMessage('No workspace folder open');
                    return;
                }
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const fullPath = path.join(workspaceRoot, filePath);
                uri = vscode.Uri.file(fullPath);
            }
            // Check if file exists
            try {
                await vscode.workspace.fs.stat(uri);
            }
            catch (err) {
                vscode.window.showWarningMessage(`File not found: ${filePath}`);
                return;
            }
            // Open the file in editor
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document, {
                preview: false, // Open in persistent editor
                viewColumn: vscode.ViewColumn.One
            });
            console.log(`✅ Opened file: ${filePath}`);
        }
        catch (error) {
            console.error('Failed to open file:', error);
            vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
        }
    }
    async handleConnect(apiKey) {
        if (apiKey) {
            // API key provided from webview modal - use it directly
            const authService = (0, extension_1.getAuthService)();
            try {
                await authService.connectWithApiKey(apiKey);
                // Success - send success message to webview
                if (this.panel) {
                    this.panel.webview.postMessage({
                        command: 'connectResult',
                        success: true
                    });
                }
            }
            catch (error) {
                // Failure - send error message to webview
                if (this.panel) {
                    this.panel.webview.postMessage({
                        command: 'connectResult',
                        success: false,
                        error: error.message || 'Failed to connect with API key'
                    });
                }
            }
        }
        else {
            // Fallback to command (will prompt with showInputBox)
            vscode.commands.executeCommand('auxly.connect');
        }
    }
    async handleDisconnect() {
        await vscode.commands.executeCommand('auxly.disconnect');
        // 🔧 FIX: After disconnect, show forced API key modal
        console.log('🔒 API disconnected - showing forced API key modal');
        setTimeout(() => {
            this.showForcedApiKeyModal();
        }, 500);
    }
    async fetchTasks() {
        try {
            console.log('📋 TaskPanelProvider.fetchTasks() called');
            const taskService = (0, extension_1.getTaskService)();
            console.log('📋 TaskService obtained:', !!taskService);
            const result = await taskService.fetchTasks();
            console.log('📋 Fetch result:', result ? `${Object.keys(result).length} columns` : 'null');
            // 🔧 FIX: Send fetched tasks to webview
            if (result) {
                console.log('✅ Sending tasks to webview after fetch');
                this.updateTasks(result);
            }
            else {
                console.warn('⚠️ No tasks returned from fetch');
            }
        }
        catch (error) {
            console.error('❌ Failed to fetch tasks:', error);
            vscode.window.showErrorMessage('Failed to fetch tasks: ' + error.message);
        }
    }
    async updateTaskStatus(taskId, status) {
        try {
            const taskService = (0, extension_1.getTaskService)();
            await taskService.updateTask(taskId, { status: status });
        }
        catch (error) {
            console.error('Failed to update task:', error);
        }
    }
    async deleteTask(taskId, taskTitle) {
        try {
            const taskService = (0, extension_1.getTaskService)();
            await taskService.deleteTask(taskId, taskTitle);
        }
        catch (error) {
            console.error('Failed to delete task:', error);
        }
    }
    async moveTaskToDone(taskId) {
        try {
            const taskService = (0, extension_1.getTaskService)();
            await taskService.updateTask(taskId, { status: 'done' });
            // Refresh tasks to show updated status
            await this.fetchTasks();
        }
        catch (error) {
            console.error('Failed to move task:', error);
        }
    }
    async updateTaskAvailability(taskId, availabilityStatus) {
        try {
            console.log(`⏸️ [BACKEND] updateTaskAvailability called`);
            console.log(`⏸️ [BACKEND] Task ID: ${taskId}`);
            console.log(`⏸️ [BACKEND] New availability: ${availabilityStatus}`);
            const taskService = (0, extension_1.getTaskService)();
            const result = await taskService.updateTask(taskId, { availabilityStatus });
            console.log(`⏸️ [BACKEND] Update result:`, result);
            // Refresh tasks to show updated status
            await this.fetchTasks();
            console.log(`⏸️ [BACKEND] Tasks refreshed`);
            vscode.window.showInformationMessage(availabilityStatus === 'hold'
                ? `⏸️ Task #${taskId} is now ON HOLD - AI agent will skip it`
                : `✅ Task #${taskId} is now AVAILABLE - AI agent can work on it`);
        }
        catch (error) {
            console.error('❌ [BACKEND] Failed to update task availability:', error);
            vscode.window.showErrorMessage('Failed to update task availability');
        }
    }
    async reopenTask(taskId, reason) {
        try {
            const taskService = (0, extension_1.getTaskService)();
            await taskService.updateTask(taskId, { status: 'in_progress' });
            // Refresh tasks to show updated status
            await this.fetchTasks();
        }
        catch (error) {
            console.error('Failed to reopen task:', error);
        }
    }
    async reopenTaskWithComment(taskId, reason) {
        try {
            const taskService = (0, extension_1.getTaskService)();
            await taskService.reopenTaskWithReason(taskId, reason);
            // 🚀 SMART NOTIFICATION: Show modal with Copy Prompt button
            console.log(`🔄 Task #${taskId} reopened with reason: "${reason}"`);
            // Truncate very long reasons for display
            const displayReason = reason.length > 100 ? reason.substring(0, 97) + '...' : reason;
            // Generate prompt for user to paste in chat
            const wakeUpPrompt = `Task #${taskId} was reopened. Reason: ${reason}. Please continue work.`;
            const action = await vscode.window.showInformationMessage(`🔄 Task #${taskId} reopened!\n\n` +
                `Reason: ${displayReason}\n\n` +
                `Task is now "In Progress". Click "Copy Prompt" to copy a message, then paste it in chat to wake up the AI agent.`, { modal: true }, '📋 Copy Prompt', 'Cancel');
            if (action === '📋 Copy Prompt') {
                // Copy to clipboard
                await vscode.env.clipboard.writeText(wakeUpPrompt);
                vscode.window.showInformationMessage(`✅ Copied! Now paste in chat:\n"${wakeUpPrompt}"`);
                console.log(`📋 Reopen prompt copied to clipboard: "${wakeUpPrompt}"`);
            }
            // Refresh tasks to show updated status
            await this.fetchTasks();
        }
        catch (error) {
            console.error('Failed to reopen task with comment:', error);
            vscode.window.showErrorMessage('Failed to reopen task: ' + error.message);
        }
    }
    async handleRequestCommentInput(taskId) {
        const comment = await vscode.window.showInputBox({
            prompt: 'Enter your comment',
            placeHolder: 'Type your comment here...',
            ignoreFocusOut: true
        });
        if (comment && comment.trim()) {
            await this.handleAddComment(taskId, comment.trim());
        }
    }
    async handleRequestReopenReason(taskId) {
        const reason = await vscode.window.showInputBox({
            prompt: 'Why are you reopening this task?',
            value: 'Needs more work',
            ignoreFocusOut: true
        });
        if (reason && reason.trim()) {
            await this.reopenTaskWithComment(taskId, reason.trim());
        }
    }
    async handleRequestStatusChange(taskId, currentStatus) {
        const statusOptions = [
            { label: '📋 Todo', value: 'todo' },
            { label: '🔄 In Progress', value: 'in_progress' },
            { label: '👀 Review', value: 'review' },
            { label: '✅ Done', value: 'done' }
        ].filter(opt => opt.value !== currentStatus);
        const selected = await vscode.window.showQuickPick(statusOptions.map(opt => opt.label), {
            placeHolder: 'Select new status',
            ignoreFocusOut: true
        });
        if (selected) {
            const newStatus = statusOptions.find(opt => opt.label === selected)?.value;
            if (newStatus) {
                await this.handleChangeTaskStatus(taskId, newStatus);
            }
        }
    }
    async handleAddComment(taskId, comment) {
        try {
            if (!comment || !comment.trim()) {
                vscode.window.showWarningMessage('Comment cannot be empty');
                return;
            }
            const taskService = (0, extension_1.getTaskService)();
            // Get current task to append to comments array
            const tasks = await taskService.fetchTasks(false);
            if (!tasks) {
                vscode.window.showErrorMessage('Could not fetch tasks');
                return;
            }
            const allTasks = [...(tasks.todo || []), ...(tasks.in_progress || []), ...(tasks.review || []), ...(tasks.done || [])];
            const task = allTasks.find(t => t.id === taskId);
            if (!task) {
                vscode.window.showErrorMessage('Task not found');
                return;
            }
            const comments = task.comments || [];
            comments.push({
                id: `c${Date.now()}`,
                author: 'user',
                authorName: 'User',
                content: comment.trim(),
                type: 'comment',
                createdAt: new Date().toISOString()
            });
            await taskService.updateTask(taskId, { comments });
            vscode.window.showInformationMessage('✅ Comment added successfully');
            // Refresh tasks to show updated comment
            await this.fetchTasks();
        }
        catch (error) {
            console.error('Failed to add comment:', error);
            vscode.window.showErrorMessage('Failed to add comment: ' + error.message);
        }
    }
    async handleChangeTaskStatus(taskId, newStatus) {
        try {
            if (!['todo', 'in_progress', 'review', 'done'].includes(newStatus)) {
                vscode.window.showErrorMessage('Invalid status');
                return;
            }
            const taskService = (0, extension_1.getTaskService)();
            await taskService.updateTask(taskId, { status: newStatus });
            vscode.window.showInformationMessage(`✅ Task status changed to: ${newStatus.replace('_', ' ').toUpperCase()}`);
            // Refresh tasks to show updated status
            await this.fetchTasks();
        }
        catch (error) {
            console.error('Failed to change task status:', error);
            vscode.window.showErrorMessage('Failed to change status: ' + error.message);
        }
    }
    // Remove old mock implementation and keep only these new methods
    async answerAgentQuestion(data) {
        try {
            console.log('Answered question:', data);
            vscode.window.showInformationMessage(`✓ Answer sent: ${data.answer}`);
        }
        catch (error) {
            console.error('Failed to answer question:', error);
        }
    }
    async handleAIQuestionAnswer(questionId, answer, taskId, qaData) {
        try {
            console.log(`AI Question answered: ${questionId} - ${answer}`);
            // If taskId and qaData are provided, save Q&A to task
            if (taskId && qaData) {
                const taskService = (0, extension_1.getTaskService)();
                const localStorage = taskService.localStorage;
                const tasks = await localStorage.getAllTasks();
                const task = tasks.find((t) => t.id === taskId);
                if (task) {
                    // Find and UPDATE the existing question with the answer
                    const qaHistory = task.qaHistory || [];
                    const questionIndex = qaHistory.findIndex((qa) => qa.question && qa.question.id === questionId);
                    let updatedQA;
                    if (questionIndex >= 0) {
                        // Update existing question with answer
                        updatedQA = [...qaHistory];
                        updatedQA[questionIndex] = {
                            ...updatedQA[questionIndex],
                            answer: qaData.answer
                        };
                        console.log(`✅ Updated existing question ${questionId} with answer`);
                    }
                    else {
                        // Question not found, add as new entry
                        updatedQA = [...qaHistory, qaData];
                        console.log(`✅ Added new Q&A entry for ${questionId}`);
                    }
                    await taskService.updateTask(taskId, {
                        qaHistory: updatedQA
                    });
                    // 🧠 SMART WAKE-UP LOGIC: Check if this was the last unanswered question
                    const totalQuestions = updatedQA.length;
                    const answeredQuestions = updatedQA.filter((qa) => qa.answer !== undefined && qa.answer !== null).length;
                    const remainingQuestions = totalQuestions - answeredQuestions;
                    console.log(`📊 Question stats for Task #${taskId}: ${answeredQuestions}/${totalQuestions} answered, ${remainingQuestions} remaining`);
                    if (remainingQuestions === 0 && totalQuestions > 0) {
                        // 🎉 This was the LAST question! Show copy prompt modal
                        console.log(`🎉 All ${totalQuestions} question(s) answered for Task #${taskId}! Showing copy prompt...`);
                        // Generate prompt for user to paste in chat
                        const wakeUpPrompt = `I answered all ${totalQuestions} question(s) for Task #${taskId}. Please continue with the implementation.`;
                        // Show modal with Copy Prompt button
                        const action = await vscode.window.showInformationMessage(`✅ All questions answered for Task #${taskId}!\n\n` +
                            `Click "Copy Prompt" to copy a message, then paste it in chat to wake up the AI agent.`, { modal: true }, '📋 Copy Prompt', 'Cancel');
                        if (action === '📋 Copy Prompt') {
                            // Copy to clipboard
                            await vscode.env.clipboard.writeText(wakeUpPrompt);
                            vscode.window.showInformationMessage(`✅ Copied! Now paste in chat:\n"${wakeUpPrompt}"`);
                            console.log(`📋 Prompt copied to clipboard: "${wakeUpPrompt}"`);
                        }
                    }
                    else if (remainingQuestions > 0) {
                        // Still questions remaining - show quiet notification
                        console.log(`⏳ ${remainingQuestions} question(s) remaining for Task #${taskId} - not notifying AI yet`);
                        vscode.window.showInformationMessage(`✅ Answer recorded (${remainingQuestions} more question(s) pending)`);
                    }
                    else {
                        // No questions at all - standard notification
                        console.log(`✅ Q&A saved to task #${taskId}`);
                        vscode.window.showInformationMessage(`✅ Answer recorded for Task #${taskId}`);
                    }
                    // Refresh tasks to show updated Q&A
                    await this.fetchTasks();
                }
                else {
                    console.warn(`Task #${taskId} not found`);
                    vscode.window.showWarningMessage(`Task #${taskId} not found`);
                }
            }
            else {
                vscode.window.showInformationMessage(`✅ Answer recorded: "${answer}"`);
            }
        }
        catch (error) {
            console.error('Failed to handle AI question answer:', error);
            vscode.window.showErrorMessage('Failed to save answer: ' + error.message);
        }
    }
    async handleAIQuestionSkip(questionId) {
        try {
            console.log(`AI Question skipped: ${questionId}`);
            vscode.window.showInformationMessage('Question skipped');
        }
        catch (error) {
            console.error('Failed to handle AI question skip:', error);
        }
    }
    // Public method to show AI question (called when question is added via MCP)
    showAIQuestion(taskId, question) {
        // Auto-open dashboard if not open
        if (!this.panel) {
            this.show();
            // Wait a moment for panel to initialize
            setTimeout(() => {
                this.sendQuestionToWebview(taskId, question);
            }, 500);
        }
        else {
            this.sendQuestionToWebview(taskId, question);
        }
    }
    sendQuestionToWebview(taskId, question) {
        if (!this.panel) {
            return;
        }
        console.log(`🤖 Showing AI question for Task #${taskId}`);
        this.panel.webview.postMessage({
            command: 'showAIQuestion',
            question: {
                ...question,
                taskId: taskId // Ensure task ID is included
            }
        });
    }
    updateMCPStatus(status) {
        if (!this.panel) {
            return;
        }
        console.log('📊 Sending MCP status to webview:', status);
        this.panel.webview.postMessage({
            command: 'mcpStatusUpdate',
            data: {
                isHealthy: status.isHealthy,
                error: status.error
            }
        });
    }
    async sendTrialInfo() {
        if (!this.panel) {
            return;
        }
        try {
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(require('../config/local-config')));
            const configService = LocalConfigService.getInstance();
            const trialInfo = await configService.getTrialInfo();
            if (trialInfo) {
                console.log('📊 Sending trial info to webview:', trialInfo);
                this.panel.webview.postMessage({
                    command: 'trialInfoUpdated',
                    data: {
                        status: trialInfo.status,
                        daysRemaining: trialInfo.daysRemaining,
                        endDate: trialInfo.endDate.toISOString()
                    }
                });
            }
        }
        catch (error) {
            console.error('❌ Failed to get trial info:', error);
        }
    }
    async handleRestartMCP(message) {
        const isSilent = message?.silent === true;
        console.log(`🔄 Restart MCP ${isSilent ? '(auto/silent)' : '(manual)'} triggered from webview`);
        try {
            await vscode.commands.executeCommand('auxly.restartMCP', { silent: isSilent });
            // Notify webview of successful restart
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: 'mcpRestartSuccess'
                });
            }
        }
        catch (error) {
            console.error('❌ Failed to restart MCP:', error);
            // Only show error message for manual restarts
            if (!isSilent) {
                vscode.window.showErrorMessage(`Failed to restart MCP server: ${error}`);
            }
            // Notify webview of failed restart
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: 'mcpRestartFailed',
                    error: error.message
                });
            }
        }
    }
    async handleGetCursorProcessTree() {
        console.log('[Auxly MCP Backend] 📋 Getting Cursor process tree...');
        try {
            // Get current process (Cursor) and all child processes
            const processTree = await this.getProcessTree(process.pid);
            console.log(`[Auxly MCP Backend] 📊 Found ${processTree.length} processes in tree`);
            // Search for Auxly MCP server process
            const mcpProcesses = processTree.filter(proc => {
                const cmdLine = proc.commandLine || '';
                return cmdLine.includes('node') &&
                    (cmdLine.includes('auxly') || cmdLine.includes('mcp-server'));
            });
            console.log(`[Auxly MCP Backend] 🔍 Found ${mcpProcesses.length} Auxly MCP processes`);
            // Send result back to webview
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: 'cursorProcessTree',
                    processTree: processTree,
                    mcpProcessCount: mcpProcesses.length
                });
            }
        }
        catch (error) {
            console.error('[Auxly MCP Backend] ❌ Failed to get process tree:', error);
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: 'cursorProcessTree',
                    processTree: [],
                    mcpProcessCount: 0,
                    error: String(error)
                });
            }
        }
    }
    async getProcessTree(pid) {
        // Use Windows wmic command to get all processes
        const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
        const execAsync = promisify(exec);
        try {
            // Get all processes with PID, PPID, and CommandLine
            const { stdout } = await execAsync('wmic process get ProcessId,ParentProcessId,CommandLine /format:csv', { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
            );
            // Parse CSV output
            const lines = stdout.split('\n').filter(line => line.trim());
            const processes = [];
            for (let i = 1; i < lines.length; i++) { // Skip header
                const parts = lines[i].split(',');
                if (parts.length >= 4) {
                    const commandLine = parts[1] || '';
                    const ppid = parseInt(parts[2]) || 0;
                    const processId = parseInt(parts[3]) || 0;
                    if (processId > 0) {
                        processes.push({
                            pid: processId,
                            ppid: ppid,
                            commandLine: commandLine
                        });
                    }
                }
            }
            // Now filter to only processes in our tree (children of Cursor)
            const cursorPid = process.pid;
            const treeProcesses = [];
            const toCheck = [cursorPid];
            const checked = new Set();
            while (toCheck.length > 0) {
                const currentPid = toCheck.pop();
                if (checked.has(currentPid))
                    continue;
                checked.add(currentPid);
                // Find all children of this process
                for (const proc of processes) {
                    if (proc.ppid === currentPid) {
                        treeProcesses.push(proc);
                        toCheck.push(proc.pid);
                    }
                }
            }
            return treeProcesses;
        }
        catch (error) {
            console.error('[Auxly MCP Backend] Failed to get process tree:', error);
            return [];
        }
    }
    async handleCheckMCPHealth() {
        console.log('[Auxly MCP] 🔍 Health check requested from webview');
        try {
            // Check if the user has ENABLED or DISABLED the MCP in Cursor settings
            const cursorAPI = vscode.cursor;
            if (!cursorAPI || !cursorAPI.mcp) {
                console.log('[Auxly MCP] ⚠️ Cursor MCP API not available');
                this.sendMCPHealthStatus(false, 'Cursor MCP API not available');
                return;
            }
            // FINAL SOLUTION: Extension-registered MCP servers are NOT accessible via workspace config API
            // The API returns empty {} even though the server exists in Cursor settings
            // User confirmed the MCP is resilient (survives node.exe kill - Cursor auto-manages it)
            // Therefore: If the extension is active, the MCP is registered with Cursor
            console.log('[Auxly MCP] ✅ Extension is active');
            console.log('[Auxly MCP] ✅ MCP is registered with Cursor (extension-auxly)');
            console.log('[Auxly MCP] ✅ Cursor manages MCP process lifecycle automatically');
            console.log('[Auxly MCP] ℹ️ Note: Manual enable/disable toggle cannot be detected via API');
            console.log('[Auxly MCP] ✅ Status: Registered');
            // Report as healthy (registered) - if extension is running, MCP is registered
            this.sendMCPHealthStatus(true);
        }
        catch (error) {
            console.error('[Auxly MCP] ❌ Health check failed:', error);
            this.sendMCPHealthStatus(false, error instanceof Error ? error.message : String(error));
        }
    }
    sendMCPHealthStatus(isHealthy, error) {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'mcpHealthStatus',
                data: {
                    isHealthy,
                    error,
                    lastCheck: new Date().toISOString()
                }
            });
        }
    }
    getHtmlContent(webview) {
        const nonce = this.getNonce();
        // Get logo URI directly from extension root (not dist)
        const auxlyLogoUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABV8AAAV0CAMAAAD3lp3XAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAwBQTFRFk9XmH6zOJ7TMd2KqKprTKrjMXMfZYZC6K5jTq9nrKaXRcXKw7uz0Iq7OKL7KXJa8Qa7ERq3ESavDaIW2LbzIc26uKrXNP7DF5fT4SqrEKqXRktLJKrzKO7PGI7DNbbDKqt3TM7rIJKjQb3ayJabQedHescTbZom4IqrOXpW8Kr7JOrTGkKnLe5XAyOrymYm/qZrJsuPsK6PRVp6/3dfqbXyzd2SrdWisNLnIdWqtUKXCX5O7KZrTYo+6WJy+U6HAObbHxujhkJbDcHWxLqHRu7HUTqjD8vr7fcbiVKDAXJe9Q63EKb7JaoC1KKbRX5S8bnmyzMTfZYy5J77JZYu4TKnDdmasc3CvObXHbXuzNrfHZ4a3LrvJ2eHtydfnbsWz9/X6IrDOiXa1MbvIKLXNK7vLXrrdMa2TZ4i3bH20I7HNOajV2ezzcY27JKjPPLLGnb7Wc73ZaYO2xMvhLKHRLqHSbnqygKDFPLbUQrPVRqrYUKTBKpnTpqHLdGyuNbjHVLfLH63OLJ3SeGGqZoq4YZG7wrzaf4y9Lp7S2PH1K6PSN8HMsK/SfnKx5ePw1c7kU67baoK1HaWJgG6wNr7OXqfEeX22RcLRgGuvOJ/WaJzAbpS9o6/QMa7Ss6fPNLjQLZ/SKbrLJrLNJrPNLaDSKb3KLaLRK7fMKrbMLZ7SJqbQK5vTKL3KLKPRK53TIqnPI6nPKrnLLqLSIarPKbjMKrfMLKDSIavOI6/NJ6fQT6bCLKHSV52/K57TK5zTKbzLUqPBK7jLIKvOY425JqjPIKvPKLvKU6LBLKTRW5m9UqTBK7nLXpa8K73JdWesSKzEd2WrLJ7ST6fCU6LAVp/ATqfDIKzNIq3OY465WZu+eGGrKb3Ja3+0KLvLIavPJbHNJbPNaoG1SKzDVKC/W5q+VrynLZ/TLqLRKrfNJqfQIqnOLLjMJ6bQKbvKPrHFj4C6eGKqLJ7TQq7ET6fDSLafU6PBS6rDKb/JUKbCuOPaLaHRYpC6K7fNKrvLgM29////sB6R3AAAAQB0Uk5T////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AFP3ByUAAIGFSURBVHja7L17nJZlvf87HqIZGPGAyYSoSxE0xDnoZGGopD49g5YxUqISrHHU2ZSYIBFLBDTHRtQccJWCZSxQsRKPZNrBIE3LNMuyXFlaVpa1WjIsK6dWv9Xs55nz4Tnc93Nf131f3+/1/rz23q+9X/uf35oH36/3ut73dd9lXYy5v/b6+rZUamNNZs3H9WyPzFp//vPW3mX/f9WmUqn6+nb+XMyRlfEnYO6uvj6Vqq1pXv2Od/wgs7POyvxfZ531bG7ADl5zBrVtgJbBV8ZGrKl+aYar06dPX7068/+Y/o4+vp71bHbF+dq3DRnOglkGXxnrIWvbp06+IYPV1at72NqD11IB27OODGWb+Nsy+Mq8XeXa1Mk3vOUtb8laax9azfC112VTa4Esg6/MO2vNoPXm1XPnvqV7q1cXAWxJfO05mK1t47iAwVfmy9rbVnXMHZNBax9ei/M1AmC7HzVI1fNnZ/CV6WfrzWMym9u7PIA1zNfs8FgGX5kHbB3Aa1wC23dWwHksg69M3ZqWrrpmzClj+pYMX7uPCtoq+TUYfGV6xDV18ikDbC1NYE3xNfvwFicFDL4yFVt76zVjJo0ZsrlJCmzPSUEKi2XwlQk/Fbj15lPGnNK9woBdHUPhGm6xIJbBVyYWrqsmTTqlf24JbM8jBY3kLgZfmbxl4dq9XIB1hK+trRtqOYpl8JWJ2oJbb540qQBfky5cQ84JkFgGX5mUVX7qmtmTZpvnqy3AZiSWk1gGX5n7a1p68uyPf3z27AG+BgVscnzNPhW7lp+OwVfm9ObfenOWrbNL4WuygG1t5piAwVfmsLpeM/ucc84JBljn+NrauiEFYRl8ZS6u/dabM2zNzp7A2uVrhrAbOYhl8JW5tqUnv/j2t789D2BlHBD0PhIL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yEdiPiAwU7jQV08EtlILXzfAVx/19SNRBDaxwoW+eiOwtUr46vF7tr3la1ZfYxLY/2e0cKGvCCwfioGvAvS1sMDe7mThQl89EtgaBBa+CtZXgYULffVIYOsRWPgqU18PPji+AwKDhQt9RWAlbi189WmTbxvMV0GFC331SmAbtfC1Br56tKpfHdzLV2GFC331TGCbtQC2Hr56pK97HXxwAIF1r3ChrwgsAgtfHdfX884LxFfnChf66pvAqrkk66nAesnXyXsNB6yQwoW+eiewKS18rYWv/uirGYGNu3Chr14KrA6++vmebR/5mtXXAb4KKlzoq4cCW3scAgtfpelrQIF1qnChrz4KbOUeCCx8laavEgsX+uqnwHICC1/F6au8woW++imw7Vr46uN7tv3j6+SvnnfeeRILF/rqqcDWaDkgSMFX/fqaoeowvsooXOirrwJbj8DCVzn62sdXYYWrDn31VWA7diGw8FWMvh5s8IAgtsK1XsEf37a+ahVYNZdkN8BXD/Q1D2DdLlzoq8cC26zlBLYRvurXV6MCG1PhQl/9FlglfG2Gr7r1da+cfHW/cKGvPgusnkuyjfBVs772MDWMwN7uROFCX/0W2BQCC18l6Ot5xg8IYilc6CsCqwOw9fBVs74WFFhnCxf66rvA1mrhaw181ayv550nsXChr74LbKUWvnomsD7xtWqvr+blq9OFC31FYBFY+Oq8vn71vPMkFi70FYFtb9UisO3wVau+lsTXxAsX+orA6nnLy65a+KpVX4sC1snChb4isNm3vGgR2Er4qlRfLQms3cKFviKw2TUr4atXAusPX7v19asCCxf6isBm14jAwlfH9fWr8goX+orA6hJYn15T6A1fJ0fga6KFC31FYHvWpuURAo/es+0LX6/txau4woW+IrC9a9qAwMJXNzcqKF9dK1zoKwLbt5QWvvojsJ7wtbofr8IKF/qKwA4IrJrC1Qhfdenrfw7hq5zChb4isAOr3aWEr83wVZW+DsKrqMKFviKwg1aJwMJXF/X1+b2CAzaJwvVonsJVjb4isAgsfHVcX/fay4rA7m63cF04Cn1FYAevXou/tq6Fr5r0dThgEy1cXwlauNBXBHboarQAtga+atLXyAKbQOFCXxHY4VurRmDr4asmfd1LYOFCXxHY4WtGYOGrg/q6l7jChb4isCPXqEZg2+GrIn0V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';
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Auxly - Task Management</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro', system-ui, sans-serif;
            background: #0d0d0d;
            color: #e1e4e8;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Header */
        .header {
            background: #1a1a1a;
            border-bottom: 1px solid #2a2a2a;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-logo {
            width: 24px;
            height: 24px;
            object-fit: contain;
        }

        .header-title {
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 6px 12px;
            background: #252525;
            border-radius: 8px;
            font-size: 12px;
        }

        .api-status {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #8b949e;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #f85149; /* Red when not connected, updated to green when connected */
        }

        .plan-badge {
            background: #7c3aed;
            color: #ffffff;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }

        /* Trial Status Badge - Matching Change Status button design with light yellow */
        .trial-status {
            display: flex !important;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            background: rgba(251, 191, 36, 0.1);
            color: #fcd34d;
            font-size: 11px;
            font-weight: 600;
            cursor: default;
            transition: all 0.2s;
        }

        .trial-status:hover {
            background: rgba(251, 191, 36, 0.2);
            border-color: #fcd34d;
            transform: translateY(-1px);
        }

        .trial-text {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.3px;
            color: #fcd34d;
        }

        @keyframes pulse-warning {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.05);
                opacity: 0.9;
            }
        }

        .header-actions {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .connect-btn {
            background: #252525;
            color: #58a6ff;
            border: 1px solid #3a3a3a;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: inherit;
        }

        .connect-btn:hover {
            background: #3a3a3a;
            border-color: #58a6ff;
            color: #ffffff;
        }

        .reset-api-btn {
            background: #252525;
            color: #ff7b7b;
            border: 1px solid #3a3a3a;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }

        .reset-api-btn:hover {
            background: #3a3a3a;
            border-color: #ff7b7b;
            color: #ffffff;
        }

        .done-toggle-btn {
            background: #252525;
            color: #8b949e;
            border: 1px solid #3a3a3a;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: inherit;
        }

        .done-toggle-btn:hover {
            background: #3a3a3a;
            border-color: #58a6ff;
            color: #ffffff;
        }

        .done-count {
            background: #238636;
            color: #ffffff;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
        }

        /* Loading Overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(13, 13, 13, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-overlay.active {
            display: flex;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #2a2a2a;
            border-top: 4px solid #58a6ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* AI Questions Panel - now defined as modal overlay below */
        /* (OLD PANEL STYLES REMOVED - NOW USING CENTERED MODAL) */

        /* Rest of CSS same as before - task cards, columns, etc. */
        .kanban-container {
            flex: 1;
            padding: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .kanban-board {
            display: grid;
            gap: 16px;
            height: 100%;
            transition: grid-template-columns 0.3s ease;
        }

        .kanban-board.show-done {
            grid-template-columns: repeat(4, 1fr);
        }

        .kanban-board:not(.show-done) {
            grid-template-columns: repeat(3, 1fr);
        }

        .column {
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
        }

        /* Column Background Colors */
        .column[data-status="todo"] {
            background: linear-gradient(135deg, #1a1d2e 0%, #1a1a1a 100%);
            border-color: rgba(147, 197, 253, 0.15);
        }

        .column[data-status="in_progress"] {
            background: linear-gradient(135deg, #2e1a1e 0%, #1a1a1a 100%);
            border-color: rgba(251, 146, 60, 0.15);
        }

        .column[data-status="review"] {
            background: linear-gradient(135deg, #2e2a1a 0%, #1a1a1a 100%);
            border-color: rgba(250, 204, 21, 0.15);
        }

        .column[data-status="done"] {
            background: linear-gradient(135deg, #1a2e1f 0%, #1a1a1a 100%);
            border-color: rgba(74, 222, 128, 0.15);
        }

        .column.done-column {
            display: none;
        }

        .kanban-board.show-done .column.done-column {
            display: flex;
        }

        .column-header {
            padding: 14px 16px;
            border-bottom: 1px solid #2a2a2a;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }

        .column-title {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .column-count {
            background: #252525;
            color: #8b949e;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
        }

        .column-content {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }

        .column-content::-webkit-scrollbar {
            width: 6px;
        }

        .column-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .column-content::-webkit-scrollbar-thumb {
            background: #2a2a2a;
            border-radius: 3px;
        }

        /* Task Card */
        .task-card {
            background: #252525;
            border: 1px solid #3a3a3a;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 10px;
            transition: all 0.2s;
            position: relative;
            cursor: pointer;
        }

        .task-card:hover {
            background: #2f2f2f;
            border-color: #58a6ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        /* AI Working On Task Indicator */
        .task-card.ai-working {
            border: 2px solid transparent;
            background: linear-gradient(#252525, #252525) padding-box,
                        linear-gradient(45deg, #7c3aed, #58a6ff, #7c3aed) border-box;
            animation: gradientWave 3s ease infinite;
        }

        @keyframes gradientWave {
            0%, 100% {
                border-image-source: linear-gradient(45deg, #7c3aed, #58a6ff, #7c3aed);
            }
            50% {
                border-image-source: linear-gradient(45deg, #58a6ff, #7c3aed, #58a6ff);
            }
        }

        .ai-working-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
            animation: pulse 2s infinite;
        }

        .ai-working-badge::before {
            content: '🤖';
            animation: bounce 1s infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }

        .task-number {
            font-size: 11px;
            color: #6e7681;
            font-weight: 700;
            margin-bottom: 6px;
            font-family: monospace;
        }

        .task-title {
            font-size: 13px;
            color: #ffffff;
            margin-bottom: 10px;
            line-height: 1.5;
            font-weight: 600;
        }

        .task-meta {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 10px;
        }

        .task-badge {
            font-size: 10px;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge-high {
            background: #da3633;
            color: #ffffff;
        }

        .badge-medium {
            background: #d29922;
            color: #000000;
        }

        .badge-low {
            background: #3fb950;
            color: #000000;
        }

        .badge-critical {
            background: #ff0000;
            color: #ffffff;
        }

        /* Task Tags */
        .task-tags {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            margin-top: 8px;
        }

        .task-tag {
            background: #238636;
            color: #ffffff;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .task-tag.reopen {
            background: #d29922;
            color: #000000;
        }

        /* Task Actions (for Review tasks) */
        .task-actions {
            display: flex;
            gap: 6px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #3a3a3a;
        }

        .task-action-btn {
            flex: 1;
            padding: 6px 10px;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }

        .btn-done {
            background: #238636;
            color: #ffffff;
        }

        .btn-done:hover {
            background: #2ea043;
            transform: translateY(-1px);
        }

        .btn-reopen {
            background: #252525;
            color: #58a6ff;
            border: 1px solid #3a3a3a;
        }

        .btn-reopen:hover {
            background: #3a3a3a;
            border-color: #58a6ff;
        }

        /* Change Status Button */
        .change-status-btn {
            width: 100%;
            padding: 6px 10px;
            margin-top: 8px;
            border: 1px solid #7c3aed;
            border-radius: 6px;
            background: rgba(124, 58, 237, 0.1);
            color: #b794f6;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }

        .change-status-btn:hover {
            background: rgba(124, 58, 237, 0.2);
            border-color: #9d76ed;
            transform: translateY(-1px);
        }

        /* Hold Status Button Styles */
        .hold-status-btn {
            width: 100%;
            padding: 6px 10px;
            margin-top: 8px;
            border: 1px solid;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }

        .hold-status-btn.available {
            background: rgba(34, 197, 94, 0.1);
            border-color: #22c55e;
            color: #4ade80;
        }

        .hold-status-btn.available:hover {
            background: rgba(34, 197, 94, 0.2);
            border-color: #4ade80;
            transform: translateY(-1px);
        }

        .hold-status-btn.on-hold {
            background: rgba(251, 191, 36, 0.1);
            border-color: #fbbf24;
            color: #fcd34d;
        }

        .hold-status-btn.on-hold:hover {
            background: rgba(251, 191, 36, 0.2);
            border-color: #fcd34d;
            transform: translateY(-1px);
        }

        /* Hold Indicator Badge */
        .hold-indicator {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 4px 8px;
            background: rgba(251, 191, 36, 0.2);
            border: 1px solid #fbbf24;
            border-radius: 4px;
            color: #fcd34d;
            font-size: 10px;
            font-weight: 600;
            z-index: 10;
        }

        /* Task Card On Hold */
        .task-card.task-on-hold {
            opacity: 0.7;
            border-left: 3px solid #fbbf24 !important;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #484f58;
        }

        .empty-icon {
            font-size: 32px;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        .empty-text {
            font-size: 13px;
        }

        /* Task Detail Modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        }

        .modal-overlay.active {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal-content {
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            border-radius: 16px;
            max-width: 700px;
            width: 90%;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid #2a2a2a;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .modal-header-left {
            flex: 1;
        }

        .modal-task-number {
            font-size: 11px;
            color: #6e7681;
            font-weight: 700;
            font-family: monospace;
            margin-bottom: 6px;
        }

        .modal-task-title {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .modal-close-btn {
            background: transparent;
            border: none;
            color: #8b949e;
            font-size: 24px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: all 0.2s;
            line-height: 1;
        }

        .modal-close-btn:hover {
            background: #252525;
            color: #ffffff;
        }

        /* Modal Tabs */
        .modal-tabs {
            display: flex;
            border-bottom: 1px solid #2a2a2a;
            padding: 0 24px;
            gap: 4px;
        }

        .modal-tab {
            padding: 12px 20px;
            background: transparent;
            border: none;
            color: #8b949e;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
            font-family: inherit;
        }

        .modal-tab:hover {
            color: #e1e4e8;
            background: rgba(255, 255, 255, 0.03);
        }

        .modal-tab.active {
            color: #58a6ff;
            border-bottom-color: #58a6ff;
        }

        .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
        }

        .modal-body::-webkit-scrollbar {
            width: 8px;
        }

        .modal-body::-webkit-scrollbar-track {
            background: transparent;
        }

        .modal-body::-webkit-scrollbar-thumb {
            background: #2a2a2a;
            border-radius: 4px;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .modal-section {
            margin-bottom: 20px;
        }

        .modal-section-title {
            font-size: 12px;
            color: #6e7681;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .modal-section-content {
            color: #e1e4e8;
            font-size: 14px;
            line-height: 1.6;
        }

        .modal-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .modal-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }

        /* Comments Tab */
        .comment-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .comment-item {
            background: #252525;
            border: 1px solid #3a3a3a;
            border-radius: 8px;
            padding: 12px 16px;
        }

        .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .comment-author {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
        }

        .comment-author.ai {
            color: #7c3aed;
        }

        .comment-author.user {
            color: #58a6ff;
        }

        .comment-date {
            font-size: 11px;
            color: #6e7681;
        }

        .comment-content {
            color: #e1e4e8;
            font-size: 13px;
            line-height: 1.6;
        }

        /* AI Comment Formatting */
        .ai-comment {
            background: linear-gradient(135deg, #1a1a2e 0%, #16151a 100%);
            border-left: 3px solid #7c3aed;
        }

        .formatted-ai-content .ai-comment-header {
            font-weight: 700;
            font-size: 14px;
            color: #7c3aed;
            margin: 16px 0 8px 0;
            padding: 8px 12px;
            background: rgba(124, 58, 237, 0.1);
            border-radius: 6px;
            border-left: 3px solid #7c3aed;
        }

        .formatted-ai-content .ai-comment-section-title {
            font-weight: 600;
            font-size: 13px;
            color: #58a6ff;
            margin: 12px 0 6px 0;
            padding-left: 4px;
        }

        .formatted-ai-content .ai-comment-list {
            margin: 8px 0 12px 20px;
            padding: 0;
            list-style: none;
        }

        .formatted-ai-content .ai-comment-list li {
            position: relative;
            padding-left: 24px;
            margin-bottom: 6px;
            color: #e1e4e8;
            line-height: 1.6;
        }

        .formatted-ai-content .ai-comment-list li:before {
            content: "•";
            position: absolute;
            left: 8px;
            color: #58a6ff;
            font-weight: bold;
        }

        .formatted-ai-content .ai-comment-point {
            color: #e1e4e8;
            margin: 6px 0;
            padding-left: 12px;
            line-height: 1.6;
        }

        .formatted-ai-content p {
            margin: 8px 0;
            color: #c9d1d9;
            line-height: 1.7;
        }

        .formatted-ai-content p:first-child {
            margin-top: 0;
        }

        .user-comment {
            background: rgba(88, 166, 255, 0.05);
            border-left: 3px solid #58a6ff;
        }

        /* Research Tab */
        .research-entry {
            background: #252525;
            border: 1px solid #3a3a3a;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .research-content {
            color: #e1e4e8;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .research-links {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }

        .research-link {
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            padding: 8px 12px;
            text-decoration: none;
            color: #58a6ff;
            font-size: 12px;
            transition: all 0.2s;
        }

        .research-link:hover {
            border-color: #58a6ff;
            background: #252525;
        }

        /* Changes Tab */
        .change-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .change-item {
            background: #252525;
            border: 1px solid #3a3a3a;
            border-radius: 8px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .change-icon {
            font-size: 20px;
            flex-shrink: 0;
        }

        .change-info {
            flex: 1;
            min-width: 0;
        }

        .change-file-container {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
        }

        .change-file-icon {
            font-size: 14px;
            flex-shrink: 0;
        }

        .change-file-link {
            color: #58a6ff;
            text-decoration: none;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: 600;
            border-bottom: 1px solid transparent;
            transition: all 0.2s;
            cursor: pointer;
            word-break: break-all;
        }

        .change-file-link:hover {
            color: #79c0ff;
            border-bottom-color: #79c0ff;
            text-decoration: none;
        }

        .change-file-link:active {
            color: #a5d6ff;
        }

        .change-desc {
            color: #c9d1d9;
            font-size: 12px;
            line-height: 1.5;
            margin-top: 4px;
        }

        .change-timestamp {
            color: #6e7681;
            font-size: 11px;
            margin-top: 6px;
        }

        .change-stats {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            flex-shrink: 0;
        }

        /* Q&A Tab */
        .qa-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .qa-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid #2a2a2a;
        }

        .qa-copy-prompt-btn {
            background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .qa-copy-prompt-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }

        .qa-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .qa-item {
            background: #252525;
            border: 1px solid #3a3a3a;
            border-radius: 8px;
            padding: 16px;
        }

        .qa-question {
            margin-bottom: 12px;
        }

        .qa-question-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .qa-priority-badge {
            font-size: 12px;
        }

        .qa-category {
            font-size: 10px;
            color: #58a6ff;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .qa-question-text {
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 6px;
        }

        .qa-question-context {
            color: #8b949e;
            font-size: 12px;
            padding: 8px;
            background: rgba(88, 166, 255, 0.05);
            border-left: 2px solid #58a6ff;
            border-radius: 4px;
        }

        .qa-answer {
            background: rgba(88, 166, 255, 0.05);
            border: 1px solid rgba(88, 166, 255, 0.2);
            border-radius: 6px;
            padding: 12px;
            margin-top: 8px;
        }

        .qa-answer-header {
            font-size: 11px;
            color: #58a6ff;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .qa-answer-text {
            color: #e1e4e8;
            font-size: 13px;
        }

        .qa-timestamp {
            font-size: 10px;
            color: #6e7681;
            margin-top: 8px;
        }

        .empty-state {
            text-align: center;
            color: #6e7681;
            font-size: 13px;
            padding: 32px;
        }

        .change-icon {
            font-size: 16px;
        }

        .change-info {
            flex: 1;
        }

        .change-file {
            font-size: 13px;
            font-weight: 600;
            color: #e1e4e8;
            font-family: monospace;
        }

        .change-desc {
            font-size: 12px;
            color: #8b949e;
            margin-top: 4px;
        }

        .change-stats {
            font-size: 11px;
            color: #6e7681;
        }

        .add-button {
            background: #238636;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 16px;
            transition: all 0.2s;
        }

        .add-button:hover {
            background: #2ea043;
        }

        /* AI Questions Modal Overlay */
        .ai-questions-panel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 10000 !important;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0s 0.3s;
        }

        .ai-questions-panel.active {
            opacity: 1;
            visibility: visible;
            transition: opacity 0.3s ease, visibility 0s 0s;
        }

        @keyframes fadeIn {
            to {
                opacity: 1;
            }
        }

        /* AI Modal Container */
        .ai-modal-container {
            position: relative !important;
            background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
            border: 1px solid rgba(88, 166, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
            max-width: 500px;
            width: 85%;
            max-height: 85vh;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden;
            animation: slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideInScale {
            0% {
                transform: scale(0.8);
                opacity: 0;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .ai-panel-header {
            background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
        }

        .ai-panel-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
        }

        .ai-icon {
            font-size: 20px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }

        .ai-queue-counter {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 700;
            margin-left: 6px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .ai-panel-close {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.2s;
        }

        .ai-panel-close:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.4);
            transform: translateY(-1px);
        }

        /* Audio Unlock Banner */
        .audio-unlock-banner {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 10px 18px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideDownFade 0.4s ease-out;
            flex-shrink: 0;
        }

        @keyframes slideDownFade {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .audio-icon {
            font-size: 18px;
            animation: audioIconPulse 1.5s infinite;
        }

        @keyframes audioIconPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }

        .audio-message {
            font-size: 12px;
            font-weight: 600;
            color: #ffffff;
            flex: 1;
        }

        .ai-modal-content {
            padding: 16px 18px;
            overflow-y: auto;
            flex: 1;
            min-height: 0;
        }

        .ai-question-card {
            background: transparent;
        }

        .ai-question-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
        }

        .ai-priority-emoji {
            font-size: 14px;
        }

        .ai-category-badge {
            font-size: 9px;
            font-weight: 700;
            color: #58a6ff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .ai-question-text {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .ai-question-context {
            font-size: 12px;
            color: #a8b1bd;
            margin-bottom: 12px;
            line-height: 1.5;
            padding: 8px 10px;
            background: rgba(88, 166, 255, 0.05);
            border-left: 2px solid #58a6ff;
            border-radius: 4px;
        }
        
        .context-header {
            font-weight: 700;
            color: #58a6ff;
            margin-bottom: 6px;
        }
        
        .context-summary,
        .context-full {
            color: #a8b1bd;
            line-height: 1.6;
        }
        
        .context-toggle-btn {
            margin-top: 8px;
            padding: 4px 10px;
            background: rgba(88, 166, 255, 0.1);
            border: 1px solid rgba(88, 166, 255, 0.3);
            border-radius: 4px;
            color: #58a6ff;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .context-toggle-btn:hover {
            background: rgba(88, 166, 255, 0.2);
            border-color: #58a6ff;
        }

        .ai-options-label {
            font-size: 10px;
            color: #8b949e;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .ai-options-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 12px;
        }

        .ai-option-btn {
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid rgba(255, 255, 255, 0.1);
            color: #e1e4e8;
            padding: 10px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            position: relative;
        }

        .ai-option-btn:hover {
            border-color: #58a6ff;
            background: rgba(88, 166, 255, 0.1);
        }

        .ai-option-btn.selected {
            border-color: #58a6ff;
            background: rgba(88, 166, 255, 0.2);
            color: #ffffff;
        }

        .ai-option-btn.recommended {
            border-color: #3fb950;
            background: rgba(63, 185, 80, 0.1);
        }

        .ai-option-btn.recommended::before {
            content: "⭐";
            position: absolute;
            top: 4px;
            right: 4px;
            font-size: 12px;
        }

        .ai-option-btn.recommended:hover {
            border-color: #3fb950;
            background: rgba(63, 185, 80, 0.2);
        }

        .ai-option-btn.other {
            border-style: dashed;
            border-color: #8b949e;
            grid-column: span 2;
        }

        .ai-option-btn.other:hover {
            border-color: #a8b1bd;
            background: rgba(139, 148, 158, 0.1);
        }

        .ai-answer-input {
            width: 100%;
            background: #1a1a1a;
            border: 2px solid #3a3a3a;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            font-family: inherit;
            color: #e1e4e8;
            margin-bottom: 10px;
            transition: border-color 0.2s;
            display: none;
        }

        .ai-answer-input.active {
            display: block;
        }

        .ai-answer-input:focus {
            outline: none;
            border-color: #58a6ff;
        }

        .ai-answer-input::placeholder {
            color: #6e7681;
        }

        .ai-other-input-label {
            font-size: 11px;
            color: #8b949e;
            margin-bottom: 8px;
            display: none;
        }

        .ai-other-input-label.active {
            display: block;
        }

        /* Input Modal Styles */
        .input-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 10000 !important;
            animation: fadeIn 0.2s ease;
        }

        .input-modal-container {
            background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
            border: 1px solid rgba(88, 166, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            max-width: 450px;
            width: 90%;
            max-height: 90vh;
            overflow: auto;
            animation: slideInScale 0.3s ease;
        }

        .input-modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .input-modal-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #e1e4e8;
        }

        .input-modal-close {
            background: none;
            border: none;
            color: #8b949e;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .input-modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #e1e4e8;
        }

        .input-modal-body {
            padding: 24px;
        }

        .input-modal-field {
            width: 100%;
            background: #0d1117;
            border: 2px solid #30363d;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-family: inherit;
            color: #e1e4e8;
            transition: border-color 0.2s;
        }

        .input-modal-field:focus {
            outline: none;
            border-color: #58a6ff;
        }

        .input-modal-field::placeholder {
            color: #6e7681;
        }

        .input-modal-textarea {
            width: 100%;
            background: #0d1117;
            border: 2px solid #30363d;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-family: inherit;
            color: #e1e4e8;
            transition: border-color 0.2s;
            resize: vertical;
            min-height: 80px;
        }

        .input-modal-textarea:focus {
            outline: none;
            border-color: #58a6ff;
        }

        .input-modal-textarea::placeholder {
            color: #6e7681;
        }

        .input-modal-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .input-modal-btn-primary {
            background: linear-gradient(135deg, #238636 0%, #2ea043 100%);
            color: #ffffff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .input-modal-btn-primary:hover {
            background: linear-gradient(135deg, #2ea043 0%, #3fb950 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(46, 160, 67, 0.3);
        }

        .input-modal-btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: #e1e4e8;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .input-modal-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        /* Status Options Grid */
        .status-options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .status-option {
            background: #0d1117;
            border: 2px solid #30363d;
            border-radius: 8px;
            padding: 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: #e1e4e8;
        }

        .status-option:hover {
            border-color: #58a6ff;
            background: rgba(88, 166, 255, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(88, 166, 255, 0.2);
        }

        .status-icon {
            font-size: 24px;
        }

        .ai-modal-footer {
            padding: 12px 18px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            flex-shrink: 0;
        }

        .ai-submit-btn {
            background: linear-gradient(135deg, #238636 0%, #2ea043 100%);
            color: #ffffff;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            opacity: 0.5;
            pointer-events: none;
        }

        .ai-submit-btn.enabled {
            opacity: 1;
            pointer-events: auto;
        }

        .ai-submit-btn.enabled:hover {
            background: linear-gradient(135deg, #2ea043 0%, #238636 100%);
        }

        .ai-skip-btn {
            background: transparent;
            color: #8b949e;
            border: 2px solid rgba(139, 148, 158, 0.3);
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .ai-skip-btn:hover {
            background: rgba(139, 148, 158, 0.1);
            border-color: rgba(139, 148, 158, 0.5);
            color: #e1e4e8;
        }

        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid #2a2a2a;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .modal-action-btn {
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-family: inherit;
        }

        .btn-delete {
            background: #252525;
            color: #f85149;
            border: 1px solid #3a3a3a;
        }

        .btn-delete:hover {
            background: #3a3a3a;
            border-color: #f85149;
        }

        .btn-edit {
            background: linear-gradient(135deg, #58a6ff, #7c3aed);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(88, 166, 255, 0.3);
        }

        .btn-edit:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(88, 166, 255, 0.4);
        }

        /* Footer Styles - Ultra Compact */
        .footer {
            background: #1a1a1a;
            border-top: 1px solid #2a2a2a;
            padding: 4px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            font-size: 10px;
            gap: 12px;
            min-height: 32px;
        }

        .footer-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }

        .footer-center {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1.5;
        }

        .footer-center-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
        }

        .footer-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
            gap: 2px;
            flex: 1;
        }

        .mcp-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .mcp-status-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
            transition: all 0.3s ease;
        }

        .mcp-status.healthy .mcp-status-indicator {
            background: #3fb950;
            box-shadow: 0 0 6px rgba(63, 185, 80, 0.5);
            animation: blink-indicator 2s ease-in-out infinite;
        }

        .mcp-status.unhealthy .mcp-status-indicator {
            background: #f85149;
            box-shadow: 0 0 6px rgba(248, 81, 73, 0.5);
        }

        @keyframes blink-indicator {
            0%, 100% {
                opacity: 1;
                box-shadow: 0 0 8px rgba(63, 185, 80, 0.5);
            }
            50% {
                opacity: 0.4;
                box-shadow: 0 0 4px rgba(63, 185, 80, 0.3);
            }
        }

        .mcp-status-info {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }

        .mcp-status-text {
            color: #e1e4e8;
            font-weight: 600;
            font-size: 10px;
        }

        .mcp-status-timestamp {
            color: #8b949e;
            font-size: 8px;
            font-weight: 400;
        }

        .mcp-status-pid {
            display: none; /* Hidden to save space */
        }

        .mcp-status-workspace {
            display: none; /* Hidden to save space */
        }

        .made-in-sa {
            color: #8b949e;
            font-size: 9px;
            font-weight: 400;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            letter-spacing: 0.1px;
            white-space: nowrap;
            line-height: 1.2;
        }

        .copyright-text {
            color: #6e7681;
            font-size: 9px;
            font-weight: 400;
            white-space: nowrap;
            opacity: 0.85;
            line-height: 1.2;
        }

        .mcp-restart-btn {
            background: #252525;
            color: #e1e4e8;
            border: 1px solid #3a3a3a;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .mcp-restart-btn:hover {
            background: #3a3a3a;
            border-color: #58a6ff;
            color: #58a6ff;
        }

        .version-text {
            color: #6e7681;
            font-size: 9px;
            font-weight: 400;
            opacity: 0.85;
            line-height: 1.2;
        }

        .footer-right {
            display: flex;
            align-items: center;
            gap: 16px;
            color: #6e7681;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
    </div>

    <!-- Task Detail Modal -->
    <div class="modal-overlay" id="taskDetailModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-header-left">
                    <div class="modal-task-number" id="modalTaskNumber">#1</div>
                    <div class="modal-task-title" id="modalTaskTitle">Task Title</div>
                </div>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            
            <!-- Tabs -->
            <div class="modal-tabs">
                <button class="modal-tab active" data-tab="description">📋 Description</button>
                <!-- HIDDEN: Research tab removed - research content shown in Comments & Research tab -->
                <!-- <button class="modal-tab" data-tab="research">🔬 Research</button> -->
                <button class="modal-tab" data-tab="comments">💬 Comments & Research</button>
                <button class="modal-tab" data-tab="qa">🤖 Q&A</button>
                <button class="modal-tab" data-tab="changes">📝 Changes</button>
            </div>
            
            <div class="modal-body" id="modalBody">
                <!-- Description Tab -->
                <div class="tab-content active" id="tab-description"></div>
                
                <!-- Research Tab -->
                <div class="tab-content" id="tab-research"></div>
                
                <!-- Comments Tab -->
                <div class="tab-content" id="tab-comments"></div>
                
                <!-- Q&A Tab -->
                <div class="tab-content" id="tab-qa">
                    <div class="qa-container">
                        <div class="qa-header">
                            <h3 style="font-size: 14px; color: #e1e4e8; margin-bottom: 12px;">🤖 AI Agent Questions & Answers</h3>
                            <button class="qa-copy-prompt-btn" id="qaCopyPromptBtn" style="display: none;">
                                📋 Copy as Prompt for AI
                            </button>
                        </div>
                        <div class="qa-list" id="qaList">
                            <div class="empty-state">No questions yet. AI will ask clarifying questions as needed.</div>
                        </div>
                    </div>
                </div>
                
                <!-- Changes Tab -->
                <div class="tab-content" id="tab-changes"></div>
            </div>
            
            <div class="modal-footer">
                <button class="modal-action-btn btn-delete" id="modalDeleteBtn">🗑️ Delete</button>
                <button class="modal-action-btn btn-edit" id="modalEditBtn">✏️ Edit Status</button>
            </div>
        </div>
    </div>

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <img src="${auxlyLogoUri}" class="header-logo" alt="Auxly Logo" />
            <div class="header-title">Auxly - AI Task Management</div>
            <!-- Trial Status Badge - REMOVED PER USER REQUEST -->
            <!-- <div class="trial-status" id="trialStatusBadge">
                <span>🎉</span>
                <span class="trial-text" id="trialText">Trial ends in 30 days</span>
            </div> -->
            <div class="user-info" id="userInfoSection" style="display: none;">
                <span class="plan-badge" id="planBadge">PRO PLAN</span>
            </div>
            <button class="connect-btn" id="connectButton" style="display: flex;">
                🔗 Connect API
            </button>
        </div>
        <div class="header-actions">
            <button class="reset-api-btn" id="disconnectButton" style="display: none;">
                Reset API
            </button>
            <button class="done-toggle-btn" id="toggleDoneButton">
                <span id="doneToggleText">View Done</span>
                <span class="done-count" id="doneCountBadge">0</span>
            </button>
        </div>
    </div>

      <!-- AI Questions Modal -->
      <div class="ai-questions-panel" id="aiQuestionsPanel">
        <div class="ai-modal-container">
          <div class="ai-panel-header">
            <div class="ai-panel-title">
              <span class="ai-icon">🤖</span>
              <span>AI Agent has questions for you</span>
              <span class="ai-queue-counter" id="aiQueueCounter">1/1</span>
              <span class="ai-task-id" id="aiTaskId" style="margin-left: 8px; padding: 3px 8px; background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 10px; font-weight: 700;"></span>
            </div>
            <button class="ai-panel-close" id="aiPanelCloseBtn">✕ Dismiss</button>
          </div>
          
          <!-- Audio Unlock Banner (shown when audio is locked) -->
          <div class="audio-unlock-banner" id="audioUnlockBanner" style="display: none;">
            <span class="audio-icon">🔊</span>
            <span class="audio-message">Click anywhere to unlock audio alerts</span>
          </div>
          
          <div class="ai-modal-content" id="aiQuestionContent">
            <!-- Questions will be dynamically inserted here -->
          </div>
        </div>
      </div>

      <!-- API Key Input Modal -->
      <div class="input-modal-overlay" id="apiKeyModal" style="display: none;">
        <div class="input-modal-container">
          <div class="input-modal-header">
            <h3>🔑 Connect with API Key</h3>
            <button class="input-modal-close" id="apiKeyModalClose">×</button>
          </div>
          <div class="input-modal-body">
            <!-- 6-Month Free Offer Badge -->
            <div style="margin-bottom: 16px; padding: 12px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1)); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; text-align: center;">
              <div style="font-size: 14px; font-weight: 700; color: #fbbf24; margin-bottom: 4px;">⏰ LIMITED TIME OFFER</div>
              <div style="font-size: 12px; color: #d1d5db;">Get <strong style="color: #fbbf24;">6 Months FREE</strong> Pro Plan when you sign up!</div>
            </div>
            
            <p style="margin-bottom: 16px; color: #8b949e;">Enter your Auxly API key to connect your account:</p>
            <input type="password" id="apiKeyInput" class="input-modal-field" placeholder="auxly_xxxxxxxxxxxxx..." />
            
            <!-- Sign Up Link -->
            <div style="margin-top: 16px; padding: 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; text-align: center;">
              <div style="font-size: 13px; color: #d1d5db; margin-bottom: 8px;">Don't have an API key?</div>
              <button id="apiKeySignupBtn" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 6px; color: white; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s;">
                🚀 Sign Up Free & Get Your API Key
              </button>
            </div>
          </div>
          <div class="input-modal-footer">
            <button class="input-modal-btn-secondary" id="apiKeyModalCancel">Cancel</button>
            <button class="input-modal-btn-primary" id="apiKeyModalSubmit">Connect</button>
          </div>
        </div>
      </div>

      <!-- Add Comment Modal -->
      <div class="input-modal-overlay" id="commentModal" style="display: none;">
        <div class="input-modal-container">
          <div class="input-modal-header">
            <h3>💬 Add Comment</h3>
            <button class="input-modal-close" id="commentModalClose">×</button>
          </div>
          <div class="input-modal-body">
            <p style="margin-bottom: 16px; color: #8b949e;">Add a comment to this task:</p>
            <textarea id="commentInput" class="input-modal-textarea" placeholder="Enter your comment..." rows="4"></textarea>
          </div>
          <div class="input-modal-footer">
            <button class="input-modal-btn-secondary" id="commentModalCancel">Cancel</button>
            <button class="input-modal-btn-primary" id="commentModalSubmit">Add Comment</button>
          </div>
        </div>
      </div>

      <!-- Change Status Modal -->
      <div class="input-modal-overlay" id="statusModal" style="display: none;">
        <div class="input-modal-container">
          <div class="input-modal-header">
            <h3>✏️ Change Task Status</h3>
            <button class="input-modal-close" id="statusModalClose">×</button>
          </div>
          <div class="input-modal-body">
            <p style="margin-bottom: 16px; color: #8b949e;">Select new status:</p>
            <div class="status-options" id="statusOptions">
              <button class="status-option" data-status="todo">
                <span class="status-icon">📋</span>
                <span>To Do</span>
              </button>
              <button class="status-option" data-status="in_progress">
                <span class="status-icon">🚀</span>
                <span>In Progress</span>
              </button>
              <button class="status-option" data-status="review">
                <span class="status-icon">👀</span>
                <span>Review</span>
              </button>
              <button class="status-option" data-status="done">
                <span class="status-icon">✅</span>
                <span>Done</span>
              </button>
            </div>
          </div>
          <div class="input-modal-footer">
            <button class="input-modal-btn-secondary" id="statusModalCancel">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Reopen Reason Modal -->
      <div class="input-modal-overlay" id="reopenModal" style="display: none !important;">
        <div class="input-modal-container">
          <div class="input-modal-header">
            <h3>🔄 Reopen Task</h3>
            <button class="input-modal-close" id="reopenModalClose">×</button>
          </div>
          <div class="input-modal-body">
            <p style="margin-bottom: 16px; color: #8b949e;">Why are you reopening this task?</p>
            <textarea id="reopenReasonInput" class="input-modal-textarea" placeholder="Enter reason for reopening..." rows="3"></textarea>
          </div>
          <div class="input-modal-footer">
            <button class="input-modal-btn-secondary" id="reopenModalCancel">Cancel</button>
            <button class="input-modal-btn-primary" id="reopenModalSubmit">Reopen Task</button>
          </div>
        </div>
      </div>

    <!-- Kanban Board -->
    <div class="kanban-container">
        <div class="kanban-board" id="kanbanBoard">
            <!-- To Do Column -->
            <div class="column" data-status="todo">
                <div class="column-header">
                    <span class="column-title">
                        📋 To Do
                        <span class="column-count" id="todoCount">0</span>
                    </span>
                </div>
                <div class="column-content" id="todoColumn"></div>
            </div>

            <!-- In Progress Column -->
            <div class="column" data-status="in_progress">
                <div class="column-header">
                    <span class="column-title">
                        🚀 In Progress
                        <span class="column-count" id="inProgressCount">0</span>
                    </span>
                </div>
                <div class="column-content" id="inProgressColumn"></div>
            </div>

            <!-- Review Column -->
            <div class="column" data-status="review">
                <div class="column-header">
                    <span class="column-title">
                        👁️ Review
                        <span class="column-count" id="reviewCount">0</span>
                    </span>
                </div>
                <div class="column-content" id="reviewColumn"></div>
            </div>

            <!-- Done Column -->
            <div class="column done-column" data-status="done">
                <div class="column-header">
                    <span class="column-title">
                        ✅ Done
                        <span class="column-count" id="doneCount">0</span>
                    </span>
                </div>
                <div class="column-content" id="doneColumn"></div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-left">
        <div class="mcp-status healthy" id="mcpStatus">
            <div class="mcp-status-indicator"></div>
            <div class="mcp-status-info">
                <div class="mcp-status-text" id="mcpStatusText">MCP Server: Registered</div>
                    <div class="mcp-status-timestamp" id="mcpStatusTimestamp">Last check: --:--:--</div>
            </div>
            </div>
            <div class="mcp-status-workspace" id="mcpStatusWorkspace" title="Current workspace path">Path: Loading...</div>
        </div>
        <div class="footer-center">
            <div class="footer-center-content">
                <span class="made-in-sa">Made in Saudi Arabia with ❤️ for developers</span>
                <span class="copyright-text">© 2025 Tzamun Arabia IT Co.</span>
            </div>
        </div>
        <div class="footer-right">
            <button class="mcp-restart-btn" id="mcpRestartBtn" title="Restart MCP Server">
                Restart MCP
            </button>
            <span class="version-text">v${packageJson.version}</span>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let tasks = {};
        let allTasks = [];
        let showDone = false;
        
        // API Key forced mode flag
        window.isApiKeyForced = false;
        
        // Notification sound state
        let notificationIntervalId = null;
        
        // Global AudioContext (created once, reused)
        let audioContext = null;
        let audioUnlocked = false;
        
        // Initialize AudioContext
        function initAudioContext() {
            if (audioContext) return audioContext;
            
            try {
                if (!window.AudioContext && !window.webkitAudioContext) {
                    console.warn('❌ AudioContext not available in this environment');
                    return null;
                }
                
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('✅ AudioContext created, state:', audioContext.state);
                
                // Add user interaction unlock (required for autoplay policy)
                const unlockAudio = async () => {
                    if (!audioUnlocked && audioContext && audioContext.state === 'suspended') {
                        console.log('🔓 User interaction detected - unlocking audio...');
                        try {
                            await audioContext.resume();
                            audioUnlocked = true;
                            console.log('✅ AudioContext unlocked! State:', audioContext.state);
                            
                            // Hide the audio unlock banner
                            const banner = document.getElementById('audioUnlockBanner');
                            if (banner) {
                                banner.style.display = 'none';
                                console.log('✅ Audio unlock banner hidden');
                            }
                        } catch (error) {
                            console.error('❌ Failed to unlock audio:', error);
                        }
                    }
                };
                
                // Unlock on first click or keypress anywhere in webview
                document.addEventListener('click', unlockAudio, { once: true });
                document.addEventListener('keypress', unlockAudio, { once: true });
                
                return audioContext;
            } catch (error) {
                console.error('❌ Failed to create AudioContext:', error);
                return null;
            }
        }
        
        // Enhanced creative notification sound using Web Audio API
        async function playNotificationSound() {
            try {
                console.log('🔊 Attempting to play notification sound...');
                
                // Initialize AudioContext if needed
                const ctx = audioContext || initAudioContext();
                if (!ctx) {
                    console.warn('❌ AudioContext not available');
                    return;
                }
                
                console.log('📊 AudioContext state:', ctx.state, '| Unlocked:', audioUnlocked);
                
                // Try to resume if suspended
                if (ctx.state === 'suspended') {
                    console.log('⏸️ AudioContext suspended - attempting resume...');
                    try {
                        await ctx.resume();
                        console.log('✅ AudioContext resumed, state:', ctx.state);
                    } catch (error) {
                        console.error('❌ Resume failed:', error);
                        console.warn('💡 TIP: Click anywhere in the Auxly panel first to unlock audio');
                        return;
                    }
                }
                
                // Create oscillator and gain
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                // Create a creative three-tone ascending chime (600Hz → 800Hz → 1000Hz)
                oscillator.frequency.setValueAtTime(600, ctx.currentTime);
                oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.2);
                
                // Smooth volume envelope (increased volume for better audibility)
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.5);
                
                console.log('🔔 Creative notification sound played (three-tone chime)');
            } catch (error) {
                console.error('❌ Failed to play notification sound:', error);
                console.error('Error details:', error.message, error.stack);
            }
        }
        
        // Start repeating notification sound every 15 seconds
        function startNotificationLoop() {
            // Stop any existing loop first
            stopNotificationLoop();
            
            // Play immediately
            playNotificationSound();
            
            // Then repeat every 15 seconds (15000ms)
            notificationIntervalId = setInterval(() => {
                console.log('⏰ 15 seconds elapsed - repeating notification sound');
                playNotificationSound();
            }, 15000);
            
            console.log('🔁 Notification loop started (repeats every 15 seconds)');
        }
        
        // Stop repeating notification sound
        function stopNotificationLoop() {
            if (notificationIntervalId !== null) {
                clearInterval(notificationIntervalId);
                notificationIntervalId = null;
                console.log('⏹️ Notification loop stopped');
            }
        }
        
        // Request initial tasks
        window.addEventListener('DOMContentLoaded', () => {
            // Initialize AudioContext on page load
            initAudioContext();
            console.log('🎵 AudioContext initialized - click anywhere to unlock audio');
            
            vscode.postMessage({ command: 'getTasks' });
            vscode.postMessage({ command: 'getTrialInfo' });
            vscode.postMessage({ command: 'getWorkspacePath' });
        });

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'tasksLoaded':
                    tasks = message.data;
                    
                    // 🔧 Parse JSON string fields (from MCP) back into objects
                    const parseTask = (task) => {
                        const parsed = {...task};
                        
                        // Parse research if it's a string
                        if (typeof task.research === 'string' && task.research) {
                            try {
                                parsed.research = JSON.parse(task.research);
                            } catch (e) {
                                console.warn(\`Failed to parse research for task \${task.id}:\`, e);
                                parsed.research = [];
                            }
                        }
                        
                        // Parse changes if it's a string
                        if (typeof task.changes === 'string' && task.changes) {
                            try {
                                parsed.changes = JSON.parse(task.changes);
                            } catch (e) {
                                console.warn(\`Failed to parse changes for task \${task.id}:\`, e);
                                parsed.changes = [];
                            }
                        }
                        
                        // Parse qaHistory if it's a string
                        if (typeof task.qaHistory === 'string' && task.qaHistory) {
                            try {
                                parsed.qaHistory = JSON.parse(task.qaHistory);
                            } catch (e) {
                                console.warn(\`Failed to parse qaHistory for task \${task.id}:\`, e);
                                parsed.qaHistory = [];
                            }
                        }
                        
                        // Parse comments if it's a string (CRITICAL FIX!)
                        if (typeof task.comments === 'string' && task.comments) {
                            try {
                                parsed.comments = JSON.parse(task.comments);
                            } catch (e) {
                                console.warn(\`Failed to parse comments for task \${task.id}:\`, e);
                                parsed.comments = [];
                            }
                        }
                        
                        // Parse tags if it's a string
                        if (typeof task.tags === 'string' && task.tags) {
                            try {
                                parsed.tags = JSON.parse(task.tags);
                            } catch (e) {
                                console.warn(\`Failed to parse tags for task \${task.id}:\`, e);
                                parsed.tags = [];
                            }
                        }
                        
                        // Ensure arrays default to empty arrays if undefined
                        parsed.research = parsed.research || [];
                        parsed.changes = parsed.changes || [];
                        parsed.qaHistory = parsed.qaHistory || [];
                        parsed.comments = parsed.comments || [];
                        parsed.tags = parsed.tags || [];
                        
                        return parsed;
                    };
                    
                    allTasks = [
                        ...(tasks.todo || []).map(t => parseTask({...t, status: 'todo'})),
                        ...(tasks.in_progress || []).map(t => parseTask({...t, status: 'in_progress'})),
                        ...(tasks.review || []).map(t => parseTask({...t, status: 'review'})),
                        ...(tasks.done || []).map(t => parseTask({...t, status: 'done'}))
                    ];
                    renderKanbanBoard();
                    break;
                case 'authStateChanged':
                    updateAuthUI(message.data);
                    // Fetch tasks when user successfully authenticates
                    if (message.data.isAuthenticated) {
                        console.log('✅ User authenticated, fetching tasks...');
                        vscode.postMessage({ command: 'getTasks' });
                    }
                    break;
                case 'showForcedApiKeyModal':
                    // Show non-dismissible API key modal
                    console.log('🔒 Showing forced API key modal');
                    window.isApiKeyForced = true;
                    openApiKeyModal();
                    break;
                case 'connectResult':
                    // Handle API key connection result
                    const submitBtn = document.querySelector('#apiKeyModal .primary-button');
                    const errorDiv = document.getElementById('apiKeyError');
                    const input = document.getElementById('apiKeyInput');
                    
                    if (message.success) {
                        // Success - close modal and reset forced mode
                        console.log('✅ API key connected successfully');
                        window.isApiKeyForced = false;
                        closeApiKeyModal();
                        
                        // Reset button state
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Connect';
                        }
                        
                        // Clear input
                        if (input) {
                            input.value = '';
                        }
                    } else {
                        // Failure - show error and re-enable button
                        console.error('❌ API key connection failed:', message.error);
                        
                        if (errorDiv) {
                            errorDiv.textContent = message.error || 'Invalid API key. Please try again.';
                            errorDiv.style.display = 'block';
                        }
                        
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Connect';
                        }
                    }
                    break;
                case 'setLoading':
                    updateLoadingState(message.data);
                    break;
                case 'showAIQuestion':
                    // 🚀 AUTO-POPUP: Automatically show modal when AI has a question
                    console.log('🤖 AI Question received - Auto-showing modal:', message.question);
                    showAIQuestion(message.question);
                    break;
                case 'mcpStatusUpdate':
                    updateMCPStatus(message.data);
                    break;
                case 'trialInfoUpdated':
                    updateTrialStatusUI(message.data);
                    break;
                case 'workspacePath':
                    const mcpStatusWorkspace = document.getElementById('mcpStatusWorkspace');
                    if (mcpStatusWorkspace && message.path) {
                        // Show only the last part of the path
                        const pathParts = message.path.split(/[\\/\\\\]/);
                        const lastPart = pathParts[pathParts.length - 1] || message.path;
                        mcpStatusWorkspace.textContent = \`Path: \${lastPart}\`;
                        mcpStatusWorkspace.title = message.path; // Full path on hover
                    }
                    break;
            }
        });

        function updateLoadingState(state) {
            const overlay = document.getElementById('loadingOverlay');
            if (state.isLoading) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }

        function updateAuthUI(authState) {
            const planBadgeElement = document.getElementById('planBadge');
            const connectButton = document.getElementById('connectButton');
            const disconnectButton = document.getElementById('disconnectButton');
            const userInfoSection = document.getElementById('userInfoSection');
            const trialBadge = document.getElementById('trialStatusBadge');
            
            if (authState.isAuthenticated && authState.user) {
                // User is connected - show plan badge and reset button, hide trial
                if (userInfoSection) userInfoSection.style.display = 'flex';
                if (connectButton) connectButton.style.display = 'none';
                if (disconnectButton) disconnectButton.style.display = 'block';
                if (trialBadge) trialBadge.style.display = 'none'; // Hide trial when connected
                
                if (planBadgeElement) {
                    planBadgeElement.textContent = authState.user.plan.toUpperCase() + ' PLAN';
                    switch (authState.user.plan) {
                        case 'free':
                            planBadgeElement.style.background = '#6e7681';
                            break;
                        case 'pro':
                            planBadgeElement.style.background = '#7c3aed';
                            break;
                        case 'team':
                            planBadgeElement.style.background = '#f97316';
                            break;
                    }
                }
            } else {
                // User is not connected - hide plan, show connect button, HIDE TRIAL (per user request)
                if (userInfoSection) userInfoSection.style.display = 'none';
                if (connectButton) connectButton.style.display = 'flex';
                if (disconnectButton) disconnectButton.style.display = 'none';
                // 🔧 FIX: Trial badge removed per user request
                if (trialBadge) {
                    trialBadge.style.display = 'none'; // Hide trial badge
                }
            }
        }

        function updateTrialStatusUI(trialInfo) {
            const trialBadge = document.getElementById('trialStatusBadge');
            const trialText = document.getElementById('trialText');
            
            // 🔧 FIX: Trial badge removed per user request - always hide
            if (trialBadge) {
                trialBadge.style.display = 'none';
            }
            
            console.log(\`✅ Trial status updated: \${trialInfo?.status || 'unknown'}, \${trialInfo?.daysRemaining || 0} days remaining (badge hidden per user request)\`);
        }

        function renderKanbanBoard() {
            const doneCount = tasks.done?.length || 0;
            document.getElementById('doneCountBadge').textContent = doneCount;
            
            renderColumn('todo', 'todoColumn', 'todoCount');
            renderColumn('in_progress', 'inProgressColumn', 'inProgressCount');
            renderColumn('review', 'reviewColumn', 'reviewCount');
            renderColumn('done', 'doneColumn', 'doneCount');
        }

        function renderColumn(status, columnId, countId) {
            const column = document.getElementById(columnId);
            const columnTasks = tasks[status] || [];
            
            document.getElementById(countId).textContent = columnTasks.length;

            if (columnTasks.length === 0) {
                column.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <div class="empty-text">No tasks</div>
                    </div>
                \`;
                return;
            }

            column.innerHTML = columnTasks.map(task => {
                // AI Working indicator
                const aiWorkingClass = task.aiWorkingOn ? 'ai-working' : '';
                const aiWorkingBadge = task.aiWorkingOn ? \`
                    <div class="ai-working-badge">AI Working</div>
                \` : '';

                // Show tags if present
                const tagsHtml = task.tags && task.tags.length > 0 ? \`
                    <div class="task-tags">
                        \${task.tags.map(tag => \`<span class="task-tag">\${tag}</span>\`).join('')}
                    </div>
                \` : '';

                // Review tasks get Done and Reopen buttons
                const reviewActions = task.status === 'review' ? \`
                    <div class="task-actions">
                        <button class="task-action-btn btn-done" data-action="done" data-task-id="\${task.id}">
                            ✅ Done
                        </button>
                        <button class="task-action-btn btn-reopen" data-action="reopen" data-task-id="\${task.id}">
                            🔄 Reopen
                        </button>
                    </div>
                \` : '';

                // Done tasks get only Reopen button
                const doneActions = task.status === 'done' ? \`
                    <div class="task-actions">
                        <button class="task-action-btn btn-reopen" data-action="reopen" data-task-id="\${task.id}">
                            🔄 Reopen
                        </button>
                    </div>
                \` : '';

                // Hold Status Toggle Button (only for 'todo' tasks)
                const holdStatusBtn = task.status === 'todo' ? \`
                    <button class="hold-status-btn \${task.availabilityStatus === 'hold' ? 'on-hold' : 'available'}" 
                            data-action="toggle-hold" 
                            data-task-id="\${task.id}" 
                            data-current-status="\${task.availabilityStatus || 'available'}"
                            title="Toggle task availability for AI agent">
                        \${task.availabilityStatus === 'hold' ? '⏸️ On Hold' : '✅ Available'}
                    </button>
                \` : '';

                // Change Status button (NOT for 'todo' tasks - they have Hold toggle instead)
                const changeStatusBtn = task.status !== 'todo' ? \`
                    <button class="change-status-btn" data-action="change-status" data-task-id="\${task.id}" data-status="\${task.status}" title="Change Status">
                        📊 Change Status
                    </button>
                \` : '';

                // Hold Indicator Badge (only for held tasks)
                const holdIndicator = task.availabilityStatus === 'hold' ? \`
                    <div class="hold-indicator">⏸️ HOLD</div>
                \` : '';

                // Add hold class to task card if on hold
                const holdClass = task.availabilityStatus === 'hold' ? 'task-on-hold' : '';

                return \`
                    <div class="task-card \${aiWorkingClass} \${holdClass}" data-task-id="\${task.id}">
                        \${aiWorkingBadge}
                        \${holdIndicator}
                        <div class="task-number">#\${task.id}</div>
                        <div class="task-title">\${task.title}</div>
                        <div class="task-meta">
                            <span class="task-badge badge-\${task.priority}">\${task.priority}</span>
                        </div>
                        \${tagsHtml}
                        \${holdStatusBtn}
                        \${changeStatusBtn}
                        \${reviewActions}
                        \${doneActions}
                    </div>
                \`;
            }).join('');

            // Add click handlers to task cards
            const taskCards = column.querySelectorAll('.task-card');
            taskCards.forEach(card => {
                card.addEventListener('click', (event) => {
                    // Don't open modal if clicking a button
                    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
                        return;
                    }
                    const taskId = card.getAttribute('data-task-id');
                    showTaskDetail(taskId);
                });
            });

            // Add event delegation for action buttons
            const actionButtons = column.querySelectorAll('[data-action]');
            actionButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const action = button.getAttribute('data-action');
                    const taskId = button.getAttribute('data-task-id');
                    const status = button.getAttribute('data-status');
                    
                    console.log('🎯 Button clicked:', action, 'for task:', taskId);
                    
                    if (action === 'done') {
                        markTaskDone(taskId);
                    } else if (action === 'reopen') {
                        reopenTaskWithReason(taskId);
                    } else if (action === 'change-status') {
                        changeTaskStatus(taskId, status);
                    } else if (action === 'toggle-hold') {
                        const currentStatus = button.getAttribute('data-current-status');
                        toggleHoldStatus(taskId, currentStatus);
                    }
                });
            });
        }

        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.modal-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabName);
            });

            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('active', content.id === \`tab-\${tabName}\`);
            });
        }

        // Helper function to calculate relative time (e.g., "2 hours ago", "3 days ago")
        function getRelativeTime(date) {
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            const diffWeek = Math.floor(diffDay / 7);
            const diffMonth = Math.floor(diffDay / 30);
            const diffYear = Math.floor(diffDay / 365);

            if (diffSec < 10) return 'just now';
            if (diffSec < 60) return \`\${diffSec} seconds ago\`;
            if (diffMin === 1) return '1 minute ago';
            if (diffMin < 60) return \`\${diffMin} minutes ago\`;
            if (diffHour === 1) return '1 hour ago';
            if (diffHour < 24) return \`\${diffHour} hours ago\`;
            if (diffDay === 1) return 'yesterday';
            if (diffDay < 7) return \`\${diffDay} days ago\`;
            if (diffWeek === 1) return '1 week ago';
            if (diffWeek < 4) return \`\${diffWeek} weeks ago\`;
            if (diffMonth === 1) return '1 month ago';
            if (diffMonth < 12) return \`\${diffMonth} months ago\`;
            if (diffYear === 1) return '1 year ago';
            return \`\${diffYear} years ago\`;
        }

        // Helper function to safely format dates with relative time + absolute on hover
        function formatDate(dateValue) {
            if (!dateValue) {
                return '<span style="color: #6e7681;">Not available</span>';
            }
            
            try {
                const date = new Date(dateValue);
                // Check if date is valid
                if (isNaN(date.getTime())) {
                    return '<span style="color: #6e7681;">Not available</span>';
                }
                
                const relativeTime = getRelativeTime(date);
                const absoluteTime = date.toLocaleString();
                
                // Return relative time with absolute time on hover
                return \`<span title="\${absoluteTime}" style="cursor: help; border-bottom: 1px dotted #58a6ff;">\${relativeTime}</span>\`;
            } catch (error) {
                console.warn('Failed to parse date:', dateValue, error);
                return '<span style="color: #6e7681;">Not available</span>';
            }
        }

        function showTaskDetail(taskId) {
            const task = allTasks.find(t => t.id === taskId);
            if (!task) return;

            // Update modal header
            document.getElementById('modalTaskNumber').textContent = \`#\${task.id}\`;
            document.getElementById('modalTaskTitle').textContent = task.title;

            // Populate Description Tab
            const descTab = document.getElementById('tab-description');
            descTab.innerHTML = \`
                <div class="modal-section">
                    <div class="modal-section-title">Status & Priority</div>
                    <div class="modal-badges">
                        <span class="modal-badge task-badge badge-\${task.priority}">\${task.priority.toUpperCase()}</span>
                        <span class="modal-badge task-badge badge-\${task.status}">\${task.status.replace('_', ' ').toUpperCase()}</span>
                        \${task.tags ? task.tags.map(tag => \`<span class="modal-badge" style="background: #238636; color: #fff;">\${tag}</span>\`).join('') : ''}
                    </div>
                </div>

                <div class="modal-section">
                    <div class="modal-section-title">Full Task Scope</div>
                    <div class="modal-section-content" style="line-height: 1.8;">
                        \${task.description ? task.description
                            .replace(/\\n/g, '<br>')
                            .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
                            .replace(/- (.+?)(<br>|$)/g, '<div style="margin-left: 20px; margin-bottom: 8px;">• $1</div>')
                            .replace(/(🎯|📋|🚫|🔧|📁|🧪|⚠️|📚)/g, '<span style="font-size: 16px; margin-right: 6px;">$1</span>')
                         : '<em style="color: #6e7681;">No description provided. This is where the AI writes the full task scope including objectives, requirements, and acceptance criteria.</em>'}
                    </div>
                </div>

                <div class="modal-section">
                    <div class="modal-section-title">Dates</div>
                    <div class="modal-section-content">
                        <div style="margin-bottom: 6px;"><strong>Created:</strong> \${formatDate(task.created_at || task.createdAt)}</div>
                        <div><strong>Updated:</strong> \${formatDate(task.updated_at || task.updatedAt)}</div>
                    </div>
                </div>
            \`;

            // Populate Research Tab with dual research types
            const researchTab = document.getElementById('tab-research');
            const research = task.research || [];
            
            // Group research by type (technical vs business)
            const technicalResearch = research.filter(r => !r.type || r.type === 'technical');
            const businessResearch = research.filter(r => r.type === 'business');
            
            const renderResearchSection = (entries, title, icon, color, emptyMsg) => {
                if (entries.length === 0) {
                    return \`
                        <div class="research-section-empty" style="padding: 16px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed #3a3a3a;">
                            <div style="color: #6e7681; font-size: 13px; text-align: center;">
                                \${icon} \${emptyMsg}
                            </div>
                        </div>
                    \`;
                }
                
                return entries.map((entry, idx) => \`
                    <div class="research-entry" style="margin-bottom: 16px; padding: 16px; background: rgba(255,255,255,0.03); border-left: 3px solid \${color}; border-radius: 6px;">
                        <div style="font-weight: 600; color: \${color}; font-size: 14px; margin-bottom: 12px;">
                            \${icon} Entry #\${idx + 1}
                        </div>
                        
                        \${entry.source ? \`
                            <div style="margin-bottom: 10px;">
                                <strong style="color: \${color};">🔍 Source:</strong>
                                <div style="color: #e1e4e8; margin-top: 4px; font-size: 13px;">\${entry.source}</div>
                            </div>
                        \` : ''}
                        
                        \${entry.summary ? \`
                            <div style="margin-bottom: 10px;">
                                <strong style="color: \${color};">📝 Summary:</strong>
                                <div style="color: #e1e4e8; margin-top: 4px; font-size: 13px; line-height: 1.6;">\${entry.summary}</div>
                            </div>
                        \` : ''}
                        
                        \${entry.relevance ? \`
                            <div style="margin-bottom: 10px;">
                                <strong style="color: \${color};">🎯 Relevance:</strong>
                                <div style="color: #e1e4e8; margin-top: 4px; font-size: 13px; line-height: 1.6;">\${entry.relevance}</div>
                            </div>
                        \` : ''}
                        
                        \${entry.codeSnippet ? \`
                            <div style="margin-bottom: 10px;">
                                <strong style="color: \${color};">💻 Code Snippet:</strong>
                                <pre style="background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; margin-top: 6px; overflow-x: auto; font-size: 12px; color: #e1e4e8; font-family: 'Courier New', monospace;">\${entry.codeSnippet}</pre>
                            </div>
                        \` : ''}
                        
                        \${entry.timestamp ? \`
                            <div style="font-size: 11px; color: #6e7681; margin-top: 8px;">
                                ⏰ \${new Date(entry.timestamp).toLocaleString()}
                            </div>
                        \` : ''}
                    </div>
                \`).join('');
            };
            
            if (research.length === 0) {
                researchTab.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">🔬</div>
                        <div class="empty-text">No research yet. AI will add both Technical and Business research here.</div>
                    </div>
                \`;
            } else {
                researchTab.innerHTML = \`
                    <div class="dual-research-container">
                        <!-- Technical Research Section -->
                        <div class="research-section" style="margin-bottom: 24px;">
                            <div class="research-section-header" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(88, 166, 255, 0.05) 100%); border-left: 4px solid #58a6ff; border-radius: 8px; margin-bottom: 16px;">
                                <div style="font-size: 24px;">💻</div>
                                <div>
                                    <div style="font-weight: 700; font-size: 16px; color: #58a6ff;">Technical Research</div>
                                    <div style="font-size: 12px; color: #8b949e;">Architecture, implementation, code patterns, technical constraints</div>
                                </div>
                                <div style="margin-left: auto; background: rgba(88, 166, 255, 0.2); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #58a6ff;">
                                    \${technicalResearch.length} \${technicalResearch.length === 1 ? 'entry' : 'entries'}
                                </div>
                            </div>
                            \${renderResearchSection(technicalResearch, 'Technical Research', '💻', '#58a6ff', 'No technical research yet')}
                        </div>
                        
                        <!-- Business Research Section -->
                        <div class="research-section">
                            <div class="research-section-header" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: linear-gradient(135deg, rgba(163, 122, 255, 0.15) 0%, rgba(163, 122, 255, 0.05) 100%); border-left: 4px solid #a37aff; border-radius: 8px; margin-bottom: 16px;">
                                <div style="font-size: 24px;">📊</div>
                                <div>
                                    <div style="font-weight: 700; font-size: 16px; color: #a37aff;">Business Research</div>
                                    <div style="font-size: 12px; color: #8b949e;">Market analysis, user needs, business value, ROI considerations</div>
                                </div>
                                <div style="margin-left: auto; background: rgba(163, 122, 255, 0.2); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #a37aff;">
                                    \${businessResearch.length} \${businessResearch.length === 1 ? 'entry' : 'entries'}
                                </div>
                            </div>
                            \${renderResearchSection(businessResearch, 'Business Research', '📊', '#a37aff', 'No business research yet')}
                        </div>
                    </div>
                \`;
            }

            // Populate Comments Tab
            const commentsTab = document.getElementById('tab-comments');
            const comments = task.comments || [];
            
            // Always show inline comment box
            const commentsHTML = \`
                <div class="inline-comment-box" style="margin-bottom: 16px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid #3a3a3a; border-radius: 8px;">
                    <textarea id="inlineCommentInput" placeholder="Add a comment..." style="width: 100%; min-height: 80px; background: #0d1117; border: 2px solid #30363d; border-radius: 6px; padding: 10px; color: #e1e4e8; font-size: 13px; font-family: inherit; resize: vertical; margin-bottom: 10px;"></textarea>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button id="inlineCommentSubmit" style="background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">💬 Add Comment</button>
                    </div>
                </div>
            \`;
            
            if (comments.length === 0) {
                commentsTab.innerHTML = commentsHTML + \`
                    <div class="empty-state">
                        <div class="empty-icon">💬</div>
                        <div class="empty-text">No comments yet. Start the discussion!</div>
                    </div>
                \`;
            } else {
                // Format comments with improved readability for AI comments
                const formatComment = (content, isAI) => {
                    if (!isAI) return content; // Keep user comments simple
                    
                    // Smart formatting for AI comments
                    let formatted = content;
                    
                    // Convert **bold sections** to actual headers
                    formatted = formatted.replace(/\\*\\*([^*]+)\\*\\*/g, '<div class="ai-comment-header">$1</div>');
                    
                    // Convert - bullet points to proper lists
                    const lines = formatted.split(/\\n+/);
                    let inList = false;
                    const formattedLines = [];
                    
                    for (let line of lines) {
                        line = line.trim();
                        if (!line) continue;
                        
                        if (line.startsWith('- ')) {
                            if (!inList) {
                                formattedLines.push('<ul class="ai-comment-list">');
                                inList = true;
                            }
                            formattedLines.push(\`<li>\${line.substring(2)}</li>\`);
                        } else {
                            if (inList) {
                                formattedLines.push('</ul>');
                                inList = false;
                            }
                            
                            // Check if it's a header (contains emoji + colon or starts with emoji)
                            if (/^[🎯📋🚫🔧📁🧪⚠️📚✅❌🔍💡📊⏰🤖👤✨🎉🚀💪📈]/.test(line) || line.includes(':**')) {
                                formattedLines.push(\`<div class="ai-comment-section-title">\${line}</div>\`);
                            } else if (line.startsWith('[') || line.match(/^\\d+\\./)) {
                                // Numbered or bracketed items
                                formattedLines.push(\`<div class="ai-comment-point">\${line}</div>\`);
                            } else {
                                formattedLines.push(\`<p>\${line}</p>\`);
                            }
                        }
                    }
                    
                    if (inList) {
                        formattedLines.push('</ul>');
                    }
                    
                    return formattedLines.join('');
                };
                
                commentsTab.innerHTML = commentsHTML + \`
                    <div class="comment-list">
                        \${comments.map(comment => \`
                            <div class="comment-item \${comment.author === 'ai' ? 'ai-comment' : 'user-comment'}">
                                <div class="comment-header">
                                    <div class="comment-author \${comment.author}">
                                        \${comment.author === 'ai' ? '🤖' : '👤'} 
                                        \${comment.authorName || (comment.author === 'ai' ? 'AI Agent' : 'User')}
                                        \${comment.type === 'reopen_reason' ? '<span style="color: #d29922; font-size: 11px; margin-left: 8px;">REOPENED</span>' : ''}
                                    </div>
                                    <div class="comment-date">\${new Date(comment.createdAt).toLocaleString()}</div>
                                </div>
                                <div class="comment-content formatted-ai-content">
                                    \${formatComment(comment.content, comment.author === 'ai')}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                \`;
            }
            
            // Attach inline comment submit handler
            setTimeout(() => {
                const submitBtn = document.getElementById('inlineCommentSubmit');
                if (submitBtn) {
                    submitBtn.addEventListener('click', () => {
                        const input = document.getElementById('inlineCommentInput');
                        const comment = input.value.trim();
                        if (comment) {
                            vscode.postMessage({
                                command: 'addComment',
                                taskId: window.currentModalTaskId,
                                comment: comment
                            });
                            input.value = ''; // Clear after sending
                        }
                    });
                }
            }, 100);

            // Populate Q&A Tab
            const qaTab = document.getElementById('tab-qa');
            const qaList = document.getElementById('qaList');
            const qaCopyBtn = document.getElementById('qaCopyPromptBtn');
            const qaHistory = task.qaHistory || [];
            
            if (qaHistory.length === 0) {
                qaList.innerHTML = \`
                    <div class="empty-state">No questions yet. AI will ask clarifying questions as needed.</div>
                \`;
                if (qaCopyBtn) qaCopyBtn.style.display = 'none';
            } else {
                qaList.innerHTML = qaHistory.map((qa, index) => {
                    const q = qa.question;
                    const a = qa.answer;
                    const priorityEmojis = {
                        critical: '🔴',
                        high: '🟠',
                        medium: '🟡',
                        low: '⚪'
                    };
                    
                    return \`
                        <div class="qa-item">
                            <div class="qa-question">
                                <div class="qa-question-header">
                                    <span class="qa-priority-badge">\${priorityEmojis[q.priority || 'medium']}</span>
                                    <span class="qa-category">\${q.category || 'QUESTION'}</span>
                                </div>
                                <div class="qa-question-text">\${q.text}</div>
                                \${q.context ? \`<div class="qa-question-context">💡 \${q.context}</div>\` : ''}
                                <div class="qa-timestamp">Asked: \${new Date(q.askedAt).toLocaleString()}</div>
                            </div>
                            \${a ? \`
                                <div class="qa-answer">
                                    <div class="qa-answer-header">✅ Answer</div>
                                    <div class="qa-answer-text">\${a.customAnswer || a.selectedOption || 'No answer provided'}</div>
                                    <div class="qa-timestamp">Answered: \${new Date(a.answeredAt).toLocaleString()}</div>
                                </div>
                            \` : \`
                                <div class="qa-answer" style="border-color: rgba(242, 201, 76, 0.3); background: rgba(242, 201, 76, 0.05);">
                                    <div class="qa-answer-header" style="color: #f2c94c;">⏳ Awaiting Answer</div>
                                </div>
                            \`}
                        </div>
                    \`;
                }).join('');
                if (qaCopyBtn) qaCopyBtn.style.display = 'block';
            }

            // Populate Changes Tab
            const changesTab = document.getElementById('tab-changes');
            const changes = task.changes || [];
            if (changes.length === 0) {
                changesTab.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">No changes tracked yet. File modifications will appear here.</div>
                    </div>
                \`;
            } else {
                changesTab.innerHTML = \`
                    <div class="change-list">
                        \${changes.map((change, idx) => \`
                            <div class="change-item">
                                <div class="change-icon">
                                    \${change.changeType === 'created' ? '✨' : change.changeType === 'modified' ? '✏️' : '🗑️'}
                                </div>
                                <div class="change-info">
                                    <div class="change-file-container">
                                        <span class="change-file-icon">📄</span>
                                        <a href="#" class="change-file-link" data-file-path="\${change.filePath}" title="Click to open file">
                                            \${change.filePath}
                                        </a>
                                    </div>
                                    <div class="change-desc">\${change.description}</div>
                                    \${change.timestamp ? \`<div class="change-timestamp">⏰ \${new Date(change.timestamp).toLocaleString()}</div>\` : ''}
                                </div>
                                <div class="change-stats">
                                    \${change.linesAdded !== undefined ? \`<span style="color: #3fb950;">+\${change.linesAdded}</span> \` : ''}
                                    \${change.linesDeleted !== undefined ? \`<span style="color: #f85149;">-\${change.linesDeleted}</span>\` : ''}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                \`;
                
                // Attach click handlers to file links
                setTimeout(() => {
                    const fileLinks = changesTab.querySelectorAll('.change-file-link');
                    fileLinks.forEach(link => {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            const filePath = link.getAttribute('data-file-path');
                            vscode.postMessage({
                                command: 'openFile',
                                filePath: filePath
                            });
                        });
                    });
                }, 100);
            }

            // Reset to description tab
            switchTab('description');

            // Show modal
            document.getElementById('taskDetailModal').classList.add('active');

            // Store current task ID for actions
            window.currentModalTaskId = taskId;

            // Add event listener for Add Comment button
            const addCommentBtn = document.getElementById('addCommentBtn');
            if (addCommentBtn) {
                addCommentBtn.addEventListener('click', addComment);
            }

            // Add event listener for Copy QA Prompt button (already declared above)
            // qaCopyBtn is already declared at the top of this function
            if (qaCopyBtn) {
                qaCopyBtn.addEventListener('click', copyQAPrompt);
            }
        }

        // API Key Modal Functions
        function openApiKeyModal() {
            const modal = document.getElementById('apiKeyModal');
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                const input = document.getElementById('apiKeyInput');
                if (input) {
                    input.value = '';
                    setTimeout(() => input.focus(), 100);
                }
                
                // 🔧 FIX: Hide cancel button and close button in forced mode
                const cancelBtn = document.getElementById('apiKeyModalCancel');
                const closeBtn = document.getElementById('apiKeyModalClose');
                if (window.isApiKeyForced) {
                    if (cancelBtn) cancelBtn.style.display = 'none';
                    if (closeBtn) closeBtn.style.display = 'none';
                } else {
                    if (cancelBtn) cancelBtn.style.display = '';
                    if (closeBtn) closeBtn.style.display = '';
                }
            }
        }

        function closeApiKeyModal() {
            // Prevent closing if in forced mode
            if (window.isApiKeyForced) {
                console.log('🔒 Cannot close API key modal - forced mode active');
                return;
            }
            
            const modal = document.getElementById('apiKeyModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
            }
        }

        function submitApiKey() {
            const input = document.getElementById('apiKeyInput');
            const apiKey = input.value.trim();
            const submitBtn = document.querySelector('#apiKeyModal .primary-button');
            const errorDiv = document.getElementById('apiKeyError');
            
            if (!apiKey) {
                if (errorDiv) {
                    errorDiv.textContent = 'Please enter an API key';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            // Clear previous errors
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            }
            
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Connecting...';
            }
            
            // Don't close modal yet - wait for verification result
            vscode.postMessage({
                command: 'connect',
                apiKey: apiKey
            });
        }

        // Comment Modal Functions
        function openCommentModal(taskId) {
            window.currentModalTaskId = taskId;
            const modal = document.getElementById('commentModal');
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                const input = document.getElementById('commentInput');
                if (input) {
                    input.value = '';
                    setTimeout(() => input.focus(), 100);
                }
            }
        }

        function closeCommentModal() {
            const modal = document.getElementById('commentModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
            }
        }

        function submitComment() {
            const input = document.getElementById('commentInput');
            const comment = input.value.trim();
            
            if (!comment || !window.currentModalTaskId) {
                return;
            }
            
            closeCommentModal();
            vscode.postMessage({
                command: 'addComment',
                taskId: window.currentModalTaskId,
                comment: comment
            });
        }

        // Status Change Modal Functions
        function openStatusModal(taskId) {
            console.log('📊 openStatusModal called for task:', taskId);
            window.currentModalTaskId = taskId;
            const modal = document.getElementById('statusModal');
            if (modal) {
                console.log('✅ Status modal found, opening...');
                modal.style.setProperty('display', 'flex', 'important');
            } else {
                console.error('❌ Status modal not found!');
            }
        }

        function closeStatusModal() {
            const modal = document.getElementById('statusModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
            }
        }

        function submitStatusChange(newStatus) {
            console.log('📤 submitStatusChange called with:', newStatus, 'for task:', window.currentModalTaskId);
            
            if (!window.currentModalTaskId) {
                console.error('❌ No task ID set!');
                return;
            }
            
            closeStatusModal();
            console.log('📨 Sending changeTaskStatus message...');
            vscode.postMessage({
                command: 'changeTaskStatus',
                taskId: window.currentModalTaskId,
                newStatus: newStatus
            });
            
            // Refresh tasks after status change
            setTimeout(() => {
                console.log('🔄 Refreshing tasks...');
                vscode.postMessage({ command: 'getTasks' });
            }, 300);
        }

        // Reopen Modal Functions
        function openReopenModal(taskId) {
            console.log('📂 openReopenModal called for task:', taskId);
            window.currentReopenTaskId = taskId;
            const modal = document.getElementById('reopenModal');
            if (modal) {
                // Remove !important and set display
                modal.style.setProperty('display', 'flex', 'important');
                const input = document.getElementById('reopenReasonInput');
                if (input) {
                    input.value = '';
                    setTimeout(() => input.focus(), 100);
                }
                console.log('✅ Reopen modal opened');
            }
        }

        function closeReopenModal() {
            console.log('🔒 closeReopenModal called');
            const modal = document.getElementById('reopenModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                console.log('✅ Reopen modal closed');
            }
        }

        function submitReopen() {
            const input = document.getElementById('reopenReasonInput');
            const reason = input.value.trim();
            
            if (!window.currentReopenTaskId) {
                return;
            }
            
            closeReopenModal();
            vscode.postMessage({
                command: 'reopenTask',
                taskId: window.currentReopenTaskId,
                reason: reason || 'No reason provided'
            });
        }

        function addComment() {
            console.log('🔹 addComment() called');
            console.log('🔹 currentModalTaskId:', window.currentModalTaskId);
            
            if (!window.currentModalTaskId) {
                console.error('No task selected');
                return;
            }

            // Open comment modal
            console.log('🔹 Opening comment modal');
            openCommentModal(window.currentModalTaskId);
        }

        function copyQAPrompt() {
            if (!window.currentModalTaskId) {
                console.error('No task selected');
                vscode.postMessage({ command: 'showError', message: 'No task selected' });
                return;
            }

            const task = allTasks.find(t => t.id === window.currentModalTaskId);
            if (!task || !task.qaHistory || task.qaHistory.length === 0) {
                console.error('No Q&A to copy');
                vscode.postMessage({ command: 'showError', message: 'No Q&A to copy' });
                return;
            }

            // Generate formatted prompt
            let prompt = \`📋 Task #\${task.id}: \${task.title}\\n\\n\`;
            prompt += \`🤖 AI Agent Questions & Answers\\n\`;
            prompt += \`Generated: \${new Date().toLocaleString()}\\n\`;
            prompt += \`\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n\`;

            task.qaHistory.forEach((qa, index) => {
                const q = qa.question;
                const a = qa.answer;
                
                prompt += \`Question #\${index + 1}\\n\`;
                prompt += \`Priority: \${q.priority?.toUpperCase() || 'MEDIUM'}\\n\`;
                prompt += \`Category: \${q.category || 'CLARIFICATION NEEDED'}\\n\`;
                prompt += \`\\n📝 \${q.text}\\n\`;
                
                if (q.context) {
                    prompt += \`\\n💡 Context: \${q.context}\\n\`;
                }
                
                if (a) {
                    prompt += \`\\n✅ Answer: \${a.customAnswer || a.selectedOption || 'No answer provided'}\\n\`;
                    prompt += \`Answered by: \${a.answeredBy === 'user' ? 'User' : 'AI'} at \${new Date(a.answeredAt).toLocaleString()}\\n\`;
                } else {
                    prompt += \`\\n⏳ Status: Awaiting answer\\n\`;
                }
                
                prompt += \`\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n\`;
            });

            prompt += \`\\n📌 Please review these questions and answers for Task #\${task.id}.\\n\`;
            prompt += \`Verify the answers align with project requirements and best practices.\\n\`;

            // Copy to clipboard
            navigator.clipboard.writeText(prompt).then(() => {
                vscode.postMessage({ command: 'showInfo', message: '✅ Q&A prompt copied to clipboard!' });
            }).catch(err => {
                console.error('Failed to copy:', err);
                vscode.postMessage({ command: 'showError', message: '❌ Failed to copy to clipboard' });
            });
        }

        // AI Questions Panel Functions
        let currentAIQuestion = null;
        let aiQuestionQueue = [];
        let currentQuestionIndex = 0;
        let currentQuestionTaskId = null; // Track which task the question belongs to
        let answeredQuestions = new Set(); // Track answered questions to prevent duplicates

        function showAIQuestion(question) {
            console.log('🎯 showAIQuestion function called with:', question);
            
            // Check if this question was already answered (prevent duplicates)
            if (question.id && answeredQuestions.has(question.id)) {
                console.log('⚠️ Question already answered, skipping:', question.id);
                return;
            }
            
            // Start notification sound loop (repeats every 15 seconds)
            startNotificationLoop();
            
            const panel = document.getElementById('aiQuestionsPanel');
            const content = document.getElementById('aiQuestionContent');
            const counter = document.getElementById('aiQueueCounter');
            const banner = document.getElementById('audioUnlockBanner');
            
            console.log('📦 Panel:', panel, 'Content:', content, 'Counter:', counter, 'Banner:', banner);
            
            if (!panel || !content) {
                console.error('❌ Panel or content not found!');
                return;
            }

            // Show/hide audio unlock banner based on audio lock status
            if (banner) {
                if (!audioUnlocked) {
                    banner.style.display = 'flex';
                    console.log('🔊 Audio is locked - showing unlock banner');
                } else {
                    banner.style.display = 'none';
                    console.log('✅ Audio already unlocked - hiding banner');
                }
            }

            currentAIQuestion = question;
            currentQuestionTaskId = question.taskId; // Store the task ID
            
            // Update queue counter
            if (counter && question.queueInfo) {
                counter.textContent = \`\${question.queueInfo.current}/\${question.queueInfo.total}\`;
            }
            
            // Update task ID display
            const taskIdElement = document.getElementById('aiTaskId');
            if (taskIdElement && question.taskId) {
                taskIdElement.textContent = \`Task #\${question.taskId}\`;
                taskIdElement.style.display = 'inline-block';
            } else if (taskIdElement) {
                taskIdElement.style.display = 'none';
            }

            // Determine priority emoji
            const priorityEmojis = {
                critical: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '⚪'
            };
            const priorityEmoji = priorityEmojis[question.priority || 'medium'];

            // Build options HTML
            let optionsHTML = '';
            if (question.options && question.options.length > 0) {
                optionsHTML = \`
                    <div class="ai-options-label">Select an approach:</div>
                    <div class="ai-options-grid" id="aiOptionsGrid">
                        \${question.options.map((option, idx) => \`
                            <button 
                                class="ai-option-btn \${option.recommended ? 'recommended' : ''}" 
                                data-option-idx="\${idx}"
                                data-question-id="\${question.id}"
                            >
                                \${option.label}
                            </button>
                        \`).join('')}
                        <button 
                            class="ai-option-btn other" 
                            data-option-idx="other"
                            data-question-id="\${question.id}"
                        >
                            ✏️ Other (custom input)
                        </button>
                    </div>
                \`;
            }

            // Create context HTML with collapsible summary/details
            let contextHTML = '';
            if (question.context) {
                const contextText = question.context;
                const isLongContext = contextText.length > 200;
                
                if (isLongContext) {
                    // Get first 200 chars as summary
                    const summary = contextText.substring(0, 200) + '...';
                    contextHTML = \`
                        <div class="ai-question-context">
                            <div class="context-header">💡 Context:</div>
                            <div class="context-summary" id="contextSummary">\${summary}</div>
                            <div class="context-full" id="contextFull" style="display: none;">
                                \${contextText.replace(/\\n/g, '<br>')}
                            </div>
                            <button class="context-toggle-btn" id="contextToggleBtn">
                                📖 Show Full Details
                            </button>
                        </div>
                    \`;
                } else {
                    // Short context - show directly
                    contextHTML = \`<div class="ai-question-context">💡 \${contextText.replace(/\\n/g, '<br>')}</div>\`;
                }
            }

            content.innerHTML = \`
                <div class="ai-question-card">
                    <div class="ai-question-header">
                        <span class="ai-priority-emoji">\${priorityEmoji}</span>
                        <span class="ai-category-badge">\${question.category || 'CLARIFICATION NEEDED'}</span>
                    </div>
                    <div class="ai-question-text">\${question.text || question.question}</div>
                    \${contextHTML}
                    \${optionsHTML}
                    <div class="ai-other-input-label" id="aiOtherInputLabel">Please describe your preferred approach:</div>
                    <textarea 
                        class="ai-answer-input" 
                        id="aiAnswerInput"
                        placeholder="Describe your preferred approach..."
                        rows="3"
                    ></textarea>
                </div>
            \`;
            
            // Create footer separately
            const modalContainer = panel.querySelector('.ai-modal-container');
            let footer = modalContainer.querySelector('.ai-modal-footer');
            if (!footer) {
                footer = document.createElement('div');
                footer.className = 'ai-modal-footer';
                modalContainer.appendChild(footer);
            }
            footer.innerHTML = \`
                <button class="ai-skip-btn" id="aiSkipBtn">Skip for Now</button>
                <button class="ai-submit-btn" id="aiSubmitBtn">
                    Submit Answer →
                </button>
            \`;

            // Add event delegation for option buttons
            const optionsGrid = document.getElementById('aiOptionsGrid');
            if (optionsGrid) {
                optionsGrid.addEventListener('click', (e) => {
                    const target = e.target;
                    if (target.classList.contains('ai-option-btn')) {
                        const questionId = target.getAttribute('data-question-id');
                        const optionIdx = target.getAttribute('data-option-idx');
                        selectAIOption(questionId, optionIdx);
                    }
                });
            }

            // Add event listeners for footer buttons
            const skipBtn = document.getElementById('aiSkipBtn');
            const submitBtn = document.getElementById('aiSubmitBtn');
            
            if (skipBtn) {
                skipBtn.addEventListener('click', () => skipAIQuestion(question.id));
            }
            
            if (submitBtn) {
                submitBtn.addEventListener('click', () => submitAIAnswer(question.id));
            }
            
            // Add event listener for context toggle button
            const contextToggleBtn = document.getElementById('contextToggleBtn');
            if (contextToggleBtn) {
                contextToggleBtn.addEventListener('click', toggleContextDetails);
            }

            // Show panel by adding active class (uses visibility instead of display)
            panel.classList.add('active');
            console.log('✅ Panel active class added! Panel classes:', panel.classList);
            console.log('📏 Panel computed visibility:', window.getComputedStyle(panel).visibility);
            console.log('📏 Panel computed display:', window.getComputedStyle(panel).display);
        }

        function selectAIOption(questionId, optionIdx) {
            // Remove selection from all options
            document.querySelectorAll('.ai-option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });

            // Add selection to clicked option
            const clickedBtn = document.querySelector(\`[data-option-idx="\${optionIdx}"]\`);
            if (clickedBtn) {
                clickedBtn.classList.add('selected');
            }

            const otherInput = document.getElementById('aiAnswerInput');
            const otherLabel = document.getElementById('aiOtherInputLabel');
            const submitBtn = document.getElementById('aiSubmitBtn');

            if (optionIdx === 'other') {
                // Show custom input for "Other"
                if (otherInput) otherInput.classList.add('active');
                if (otherLabel) otherLabel.classList.add('active');
                if (submitBtn) submitBtn.classList.remove('enabled');
            } else {
                // Hide custom input for predefined options
                if (otherInput) {
                    otherInput.classList.remove('active');
                    otherInput.value = '';
                }
                if (otherLabel) otherLabel.classList.remove('active');
                if (submitBtn) submitBtn.classList.add('enabled');
            }

            // Store selected option
            if (currentAIQuestion) {
                currentAIQuestion.selectedOption = optionIdx;
            }
        }

        // Enable submit button when typing in "Other" input
        document.addEventListener('input', (e) => {
            if (e.target && e.target.id === 'aiAnswerInput') {
                const submitBtn = document.getElementById('aiSubmitBtn');
                if (submitBtn && e.target.value.trim()) {
                    submitBtn.classList.add('enabled');
                } else if (submitBtn) {
                    submitBtn.classList.remove('enabled');
                }
            }
        });

        function submitAIAnswer(questionId) {
            if (!currentAIQuestion) return;

            let answer = '';
            let isCustomAnswer = false;
            
            if (currentAIQuestion.selectedOption === 'other') {
                // Get custom input
                const input = document.getElementById('aiAnswerInput');
                if (!input || !input.value.trim()) {
                    console.error('Please provide your custom approach');
                    vscode.postMessage({ command: 'showWarning', message: 'Please provide your custom approach' });
                    return;
                }
                answer = input.value.trim();
                isCustomAnswer = true;
            } else if (currentAIQuestion.selectedOption !== undefined) {
                // Get selected option
                const option = currentAIQuestion.options[currentAIQuestion.selectedOption];
                answer = option ? (option.value || option.label) : '';
            }

            if (!answer) {
                console.error('Please select an option or provide your answer');
                vscode.postMessage({ command: 'showWarning', message: 'Please select an option or provide your answer' });
                return;
            }

            // Send answer to extension with Q&A data to save to task
            vscode.postMessage({ 
                command: 'answerAIQuestion', 
                questionId: questionId,
                taskId: currentQuestionTaskId,
                answer: answer,
                optionIndex: currentAIQuestion.selectedOption,
                qaData: {
                    question: {
                        id: currentAIQuestion.id,
                        text: currentAIQuestion.text || currentAIQuestion.question,
                        category: currentAIQuestion.category || 'CLARIFICATION NEEDED',
                        priority: currentAIQuestion.priority || 'medium',
                        context: currentAIQuestion.context,
                        options: currentAIQuestion.options,
                        askedAt: new Date().toISOString()
                    },
                    answer: {
                        questionId: questionId,
                        selectedOption: isCustomAnswer ? undefined : answer,
                        customAnswer: isCustomAnswer ? answer : undefined,
                        answeredAt: new Date().toISOString(),
                        answeredBy: 'user'
                    }
                }
            });
            
            // Mark question as answered to prevent duplicates
            if (questionId) {
                answeredQuestions.add(questionId);
                console.log('✅ Question marked as answered:', questionId);
            }

            closeAIPanel();
        }

        function skipAIQuestion(questionId) {
            vscode.postMessage({
                command: 'skipAIQuestion',
                questionId: questionId
            });
            
            // Mark question as skipped to prevent re-showing
            if (questionId) {
                answeredQuestions.add(questionId);
                console.log('⏭️ Question marked as skipped:', questionId);
            }
            
            closeAIPanel();
        }

        function closeAIPanel() {
            // Stop notification sound loop
            stopNotificationLoop();
            
            const panel = document.getElementById('aiQuestionsPanel');
            if (panel) {
                // Hide by removing active class (uses visibility, not display)
                panel.classList.remove('active');
            }
        }
        
        // Toggle context details (summary vs full)
        function toggleContextDetails() {
            const summary = document.getElementById('contextSummary');
            const full = document.getElementById('contextFull');
            const btn = document.getElementById('contextToggleBtn');
            
            if (summary && full && btn) {
                const isShowingFull = full.style.display !== 'none';
                
                if (isShowingFull) {
                    // Show summary
                    summary.style.display = 'block';
                    full.style.display = 'none';
                    btn.textContent = '📖 Show Full Details';
                } else {
                    // Show full
                    summary.style.display = 'none';
                    full.style.display = 'block';
                    btn.textContent = '📕 Show Less';
                }
            }
        }
        
        // Make toggle function globally available
        window.toggleContextDetails = toggleContextDetails;

        // Test function to trigger AI question (for demonstration)
        function triggerTestAIQuestion() {
            console.log('🔧 triggerTestAIQuestion called');
            const panel = document.getElementById('aiQuestionsPanel');
            console.log('📦 Panel element:', panel);
            
            const question = {
                id: 'test-1',
                priority: 'critical',
                category: 'Technical Decision',
                text: 'Which authentication method should I implement?',
                context: 'For the user login system, I need to know your preferred authentication approach.',
                queueInfo: { current: 1, total: 3 },
                options: [
                    { label: 'JWT Tokens', value: 'jwt', recommended: true },
                    { label: 'OAuth 2.0', value: 'oauth' },
                    { label: 'Session-based', value: 'session' },
                    { label: 'API Keys', value: 'apikey' }
                ]
            };
            
            console.log('❓ Question:', question);
            showAIQuestion(question);
            console.log('✅ showAIQuestion called');
        }

        function closeTaskDetail() {
            document.getElementById('taskDetailModal').classList.remove('active');
            window.currentModalTaskId = null;
        }

        function markTaskDone(taskId) {
            console.log('✅ markTaskDone() called for task:', taskId);
            vscode.postMessage({ 
                command: 'moveTaskToDone', 
                taskId: taskId
            });
            
            // Refresh tasks to show updated status
            setTimeout(() => {
                console.log('🔄 Refreshing tasks after markTaskDone');
                vscode.postMessage({ command: 'getTasks' });
            }, 300);
        }

        function reopenTaskWithReason(taskId) {
            console.log('🔄 reopenTaskWithReason() called for task:', taskId);
            // Open reopen modal
            openReopenModal(taskId);
        }

        // Keep old function for backward compatibility
        function reopenTask(taskId) {
            reopenTaskWithReason(taskId);
        }

        function changeTaskStatus(taskId, currentStatus) {
            console.log('📊 changeTaskStatus() called for task:', taskId, 'current status:', currentStatus);
            // Open status modal
            openStatusModal(taskId);
        }

        function toggleHoldStatus(taskId, currentStatus) {
            console.log('⏸️ toggleHoldStatus() called for task:', taskId, 'current:', currentStatus);
            
            const newStatus = currentStatus === 'hold' ? 'available' : 'hold';
            
            console.log('📤 Sending updateTaskAvailability command for:', newStatus);
            console.log('📤 Payload:', { command: 'updateTaskAvailability', taskId, availabilityStatus: newStatus });
            
            // Send command to backend - confirmation will be handled there
            vscode.postMessage({
                command: 'updateTaskAvailability',
                taskId: taskId,
                availabilityStatus: newStatus
            });
            
            console.log('📨 Message sent successfully');
        }

        function toggleDoneColumn() {
            showDone = !showDone;
            const board = document.getElementById('kanbanBoard');
            const toggleText = document.getElementById('doneToggleText');
            
            if (showDone) {
                board.classList.add('show-done');
                toggleText.textContent = 'Hide Done';
            } else {
                board.classList.remove('show-done');
                toggleText.textContent = 'View Done';
            }
        }
        
        // Initialize event listeners immediately (webview DOM is already loaded)
        function initializeEventListeners() {
            const toggleBtn = document.getElementById('toggleDoneButton');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', toggleDoneColumn);
            }
            
            const connectBtn = document.getElementById('connectButton');
            if (connectBtn) {
                connectBtn.addEventListener('click', () => {
                    console.log('Connect button clicked');
                    openApiKeyModal();
                });
            }
            
            const disconnectBtn = document.getElementById('disconnectButton');
            if (disconnectBtn) {
                disconnectBtn.addEventListener('click', () => {
                    console.log('Disconnect button clicked');
                    vscode.postMessage({ command: 'disconnect' });
                });
            }

            // AI questions will auto-popup when added to tasks via MCP

            // Modal event listeners
            const modalCloseBtn = document.getElementById('modalCloseBtn');
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', closeTaskDetail);
            }

            const modalOverlay = document.getElementById('taskDetailModal');
            if (modalOverlay) {
                modalOverlay.addEventListener('click', (e) => {
                    if (e.target === modalOverlay) {
                        closeTaskDetail();
                    }
                });
            }

            // Tab switching listeners
            document.querySelectorAll('.modal-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    if (tabName) {
                        switchTab(tabName);
                    }
                });
            });

            // ESC key to close task detail modal (will be handled by new ESC handler below)

            const modalDeleteBtn = document.getElementById('modalDeleteBtn');
            if (modalDeleteBtn) {
                modalDeleteBtn.addEventListener('click', () => {
                    if (window.currentModalTaskId) {
                        const task = allTasks.find(t => t.id === window.currentModalTaskId);
                        if (task) {
                            // Request confirmation from backend
                            vscode.postMessage({ 
                                command: 'deleteTask', 
                                taskId: window.currentModalTaskId,
                                taskTitle: task.title
                            });
                            closeTaskDetail();
                        }
                    }
                });
            }

            const modalEditBtn = document.getElementById('modalEditBtn');
            if (modalEditBtn) {
                modalEditBtn.addEventListener('click', () => {
                    if (window.currentModalTaskId) {
                        const task = allTasks.find(t => t.id === window.currentModalTaskId);
                        if (task) {
                            // Open status modal (from inside task detail modal)
                            openStatusModal(window.currentModalTaskId);
                        }
                    }
                });
            }

            // AI Panel close button
            const aiPanelCloseBtn = document.getElementById('aiPanelCloseBtn');
            if (aiPanelCloseBtn) {
                aiPanelCloseBtn.addEventListener('click', closeAIPanel);
            }

            // API Key Modal Listeners
            const apiKeyModalClose = document.getElementById('apiKeyModalClose');
            const apiKeyModalCancel = document.getElementById('apiKeyModalCancel');
            const apiKeyModalSubmit = document.getElementById('apiKeyModalSubmit');
            const apiKeyModal = document.getElementById('apiKeyModal');
            
            if (apiKeyModalClose) {
                apiKeyModalClose.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Only allow closing if not in forced mode
                    if (!window.isApiKeyForced) {
                    closeApiKeyModal();
                    }
                });
            }
            if (apiKeyModalCancel) {
                apiKeyModalCancel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Only allow closing if not in forced mode
                    if (!window.isApiKeyForced) {
                    closeApiKeyModal();
                    }
                });
            }
            if (apiKeyModalSubmit) {
                apiKeyModalSubmit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    submitApiKey();
                });
            }
            
            // Click outside to close
            if (apiKeyModal) {
                apiKeyModal.addEventListener('click', (e) => {
                    if (e.target === apiKeyModal) {
                        // Only allow closing if not in forced mode
                        if (!window.isApiKeyForced) {
                        closeApiKeyModal();
                        }
                    }
                });
            }

            // API Key input - Enter key
            const apiKeyInput = document.getElementById('apiKeyInput');
            if (apiKeyInput) {
                apiKeyInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submitApiKey();
                    }
                });
            }
            
            // API Key signup button - open signup page
            const apiKeySignupBtn = document.getElementById('apiKeySignupBtn');
            if (apiKeySignupBtn) {
                apiKeySignupBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    vscode.postMessage({ 
                        command: 'openExternalUrl', 
                        url: 'https://auxly.tzamun.com'
                    });
                });
            }

            // Comment Modal Listeners
            const commentModalClose = document.getElementById('commentModalClose');
            const commentModalCancel = document.getElementById('commentModalCancel');
            const commentModalSubmit = document.getElementById('commentModalSubmit');
            const commentModal = document.getElementById('commentModal');
            
            if (commentModalClose) {
                commentModalClose.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeCommentModal();
                });
            }
            if (commentModalCancel) {
                commentModalCancel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeCommentModal();
                });
            }
            if (commentModalSubmit) {
                commentModalSubmit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    submitComment();
                });
            }
            
            // Click outside to close
            if (commentModal) {
                commentModal.addEventListener('click', (e) => {
                    if (e.target === commentModal) {
                        closeCommentModal();
                    }
                });
            }

            // Status Modal Listeners
            const statusModalClose = document.getElementById('statusModalClose');
            const statusModalCancel = document.getElementById('statusModalCancel');
            const statusModal = document.getElementById('statusModal');
            
            if (statusModalClose) {
                statusModalClose.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeStatusModal();
                });
            }
            if (statusModalCancel) {
                statusModalCancel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeStatusModal();
                });
            }
            
            // Click outside to close
            if (statusModal) {
                statusModal.addEventListener('click', (e) => {
                    if (e.target === statusModal) {
                        closeStatusModal();
                    }
                });
            }

            // Status options - event delegation
            const statusOptions = document.getElementById('statusOptions');
            if (statusOptions) {
                statusOptions.addEventListener('click', (e) => {
                    const button = e.target.closest('.status-option');
                    if (button) {
                        const status = button.getAttribute('data-status');
                        if (status) {
                            submitStatusChange(status);
                        }
                    }
                });
            }

            // Reopen Modal Listeners
            const reopenModalClose = document.getElementById('reopenModalClose');
            const reopenModalCancel = document.getElementById('reopenModalCancel');
            const reopenModalSubmit = document.getElementById('reopenModalSubmit');
            const reopenModal = document.getElementById('reopenModal');
            
            console.log('🔧 Reopen modal elements:', {
                close: !!reopenModalClose,
                cancel: !!reopenModalCancel,
                submit: !!reopenModalSubmit,
                modal: !!reopenModal
            });
            
            if (reopenModalClose) {
                reopenModalClose.addEventListener('click', (e) => {
                    console.log('✅ Close button clicked');
                    e.stopPropagation();
                    closeReopenModal();
                });
            }
            if (reopenModalCancel) {
                reopenModalCancel.addEventListener('click', (e) => {
                    console.log('✅ Cancel button clicked');
                    e.stopPropagation();
                    closeReopenModal();
                });
            }
            if (reopenModalSubmit) {
                reopenModalSubmit.addEventListener('click', (e) => {
                    console.log('✅ Submit button clicked');
                    e.stopPropagation();
                    submitReopen();
                });
            }
            
            // Click outside to close
            if (reopenModal) {
                reopenModal.addEventListener('click', (e) => {
                    if (e.target === reopenModal) {
                        console.log('✅ Click outside - closing modal');
                        closeReopenModal();
                    }
                });
            }

            // ESC key to close all modals
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const apiKeyModal = document.getElementById('apiKeyModal');
                    const commentModal = document.getElementById('commentModal');
                    const statusModal = document.getElementById('statusModal');
                    const reopenModal = document.getElementById('reopenModal');
                    const taskDetailModal = document.getElementById('taskDetailModal');
                    
                    // Priority order: input modals first, then task detail
                    if (apiKeyModal && apiKeyModal.style.display !== 'none') {
                        closeApiKeyModal();
                    } else if (commentModal && commentModal.style.display !== 'none') {
                        closeCommentModal();
                    } else if (statusModal && statusModal.style.display !== 'none') {
                        closeStatusModal();
                    } else if (reopenModal && reopenModal.style.display !== 'none') {
                        console.log('✅ ESC pressed - closing reopen modal');
                        closeReopenModal();
                    } else if (taskDetailModal && taskDetailModal.style.visibility === 'visible') {
                        closeTaskDetail();
                    }
                }
            });

            // SAFETY: Force close all modals on startup
            function closeAllModalsOnStartup() {
                console.log('🔒 SAFETY: Closing all modals on startup');
                
                const apiKeyModal = document.getElementById('apiKeyModal');
                const commentModal = document.getElementById('commentModal');
                const statusModal = document.getElementById('statusModal');
                const reopenModal = document.getElementById('reopenModal');
                
                if (apiKeyModal) {
                    apiKeyModal.style.setProperty('display', 'none', 'important');
                    console.log('✅ API Key modal force-closed');
                }
                if (commentModal) {
                    commentModal.style.setProperty('display', 'none', 'important');
                    console.log('✅ Comment modal force-closed');
                }
                if (statusModal) {
                    statusModal.style.setProperty('display', 'none', 'important');
                    console.log('✅ Status modal force-closed');
                }
                if (reopenModal) {
                    reopenModal.style.setProperty('display', 'none', 'important');
                    console.log('✅ Reopen modal force-closed');
                }
            }

            // Call safety function immediately
            closeAllModalsOnStartup();
            
            // Initialize with default unauthenticated state
            updateAuthUI({ isAuthenticated: false, user: null });
        }

        // MCP Status Update Function
        function updateMCPStatus(status) {
            console.log('[Auxly MCP] Status update:', status);
            const mcpStatusEl = document.getElementById('mcpStatus');
            const mcpStatusText = document.getElementById('mcpStatusText');
            const mcpStatusTimestamp = document.getElementById('mcpStatusTimestamp');
            
            if (!mcpStatusEl || !mcpStatusText || !mcpStatusTimestamp) {
                console.warn('[Auxly MCP] Status elements not found');
                return;
            }
            
            // Update status indicator and text
            if (status.isHealthy) {
                mcpStatusEl.classList.remove('unhealthy');
                mcpStatusEl.classList.add('healthy');
                mcpStatusText.textContent = 'MCP Server: Registered';
            } else {
                mcpStatusEl.classList.remove('healthy');
                mcpStatusEl.classList.add('unhealthy');
                mcpStatusText.textContent = status.error || 'MCP Server: Not Registered';
            }
            
            // Update timestamp with HH:MM:SS format
            if (status.lastCheck) {
                const lastCheckTime = new Date(status.lastCheck);
                const hours = String(lastCheckTime.getHours()).padStart(2, '0');
                const minutes = String(lastCheckTime.getMinutes()).padStart(2, '0');
                const seconds = String(lastCheckTime.getSeconds()).padStart(2, '0');
                const timestampText = \`Last check: \${hours}:\${minutes}:\${seconds}\`;
                mcpStatusTimestamp.textContent = timestampText;
            }
            
            // Update PID if available
            const mcpStatusPid = document.getElementById('mcpStatusPid');
            if (mcpStatusPid) {
                if (status.pid) {
                    mcpStatusPid.textContent = \`Process PID: [\${status.pid}]\`;
                } else {
                    mcpStatusPid.textContent = 'Process PID: [Waiting...]';
                }
            }
            
            // Update workspace path
            const mcpStatusWorkspace = document.getElementById('mcpStatusWorkspace');
            if (mcpStatusWorkspace) {
                if (status.workspacePath) {
                    // Show only the last part of the path
                    const pathParts = status.workspacePath.split(/[\\/\\\\]/);
                    const lastPart = pathParts[pathParts.length - 1] || status.workspacePath;
                    mcpStatusWorkspace.textContent = \`Path: \${lastPart}\`;
                    mcpStatusWorkspace.title = status.workspacePath; // Full path on hover
                } else {
                    mcpStatusWorkspace.textContent = 'Path: Loading...';
                }
            }
        }
        
        // MCP Restart Button Handler
        const mcpRestartBtn = document.getElementById('mcpRestartBtn');
        if (mcpRestartBtn) {
            mcpRestartBtn.addEventListener('click', () => {
                console.log('🔄 MCP Restart button clicked');
                vscode.postMessage({ command: 'restartMCP' });
            });
        }
        
        // ========================================
        // MCP HEALTH MONITORING (Todo2 Style!)
        // ========================================
        let mcpHealthy = true;
        let mcpMonitoringActive = false;
        let mcpRestartAttempts = 0;
        const MAX_MCP_RESTART_ATTEMPTS = 3;
        const MCP_CHECK_INTERVAL = 5000; // 5 seconds (Todo2 speed!)
        let mcpMonitorInterval = null;
        
        function startMCPHealthMonitoring() {
            if (mcpMonitoringActive) {
                console.log('[Auxly MCP] ⚠️ Monitoring already active');
                return;
            }
            
            console.log('[Auxly MCP] 🔍 Starting MCP health monitoring (5-second interval)');
            mcpMonitoringActive = true;
            
            // Initial check
            checkMCPHealth();
            
            // Set up interval
            mcpMonitorInterval = setInterval(() => {
                console.log('[Auxly MCP] 🔍 Interval triggered - checking MCP health');
                checkMCPHealth();
            }, MCP_CHECK_INTERVAL);
        }
        
        function stopMCPHealthMonitoring() {
            console.log('[Auxly MCP] ⏹️ Stopping MCP health monitoring');
            mcpMonitoringActive = false;
            if (mcpMonitorInterval) {
                clearInterval(mcpMonitorInterval);
                mcpMonitorInterval = null;
            }
        }
        
        function checkMCPHealth() {
            console.log('[Auxly MCP] 🔍 Requesting MCP health status from backend...');
            // Request health status from extension backend (backend uses Cursor API)
            vscode.postMessage({ command: 'checkMCPHealth' });
        }
        
        function handleMCPHealthStatus(status) {
            console.log('[Auxly MCP] 📊 Health status received:', status);
            
            const wasHealthy = mcpHealthy;
            mcpHealthy = status.isHealthy;
            
            // Update UI
            updateMCPStatus(status);
            
            // Auto-restart if unhealthy
            if (!mcpHealthy && wasHealthy) {
                console.log('[Auxly MCP] 🚨 MCP server became unhealthy - triggering auto-restart (attempt ' + (mcpRestartAttempts + 1) + '/' + MAX_MCP_RESTART_ATTEMPTS + ')');
                
                if (mcpRestartAttempts < MAX_MCP_RESTART_ATTEMPTS) {
                    mcpRestartAttempts++;
                    
                    // Wait 5 seconds before restarting
                    setTimeout(() => {
                        console.log('[Auxly MCP] 🔄 Auto-restarting MCP server (silent mode)...');
                        vscode.postMessage({ command: 'restartMCP', silent: true });
                        
                        // Check health again after 3 seconds
                        setTimeout(() => {
                            checkMCPHealth();
                        }, 3000);
                    }, 5000);
                } else {
                    console.log('[Auxly MCP] ⚠️ MAX RESTART ATTEMPTS REACHED (' + MAX_MCP_RESTART_ATTEMPTS + ')');
                    console.log('[Auxly MCP] ⏳ Waiting for manual intervention or cooldown');
                }
            } else if (mcpHealthy && !wasHealthy) {
                console.log('[Auxly MCP] ✅ MCP server recovered - resetting restart counter');
                mcpRestartAttempts = 0;
            }
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'cursorProcessTree':
                    // Legacy message - ignore, we now use mcpHealthStatus directly from Cursor API
                    console.log('[Auxly MCP] ℹ️ Process tree message received (legacy - now using Cursor API)');
                    break;
                case 'mcpHealthStatus':
                    handleMCPHealthStatus(message.data);
                    break;
                case 'mcpRestartSuccess':
                    console.log('[Auxly MCP] ✅ MCP restart successful');
                    mcpRestartAttempts = 0;
                    // Check health after restart
                    setTimeout(() => checkMCPHealth(), 2000);
                    break;
                case 'mcpRestartFailed':
                    console.log('[Auxly MCP] ❌ MCP restart failed:', message.error);
                    break;
            }
        });
        
        // Start monitoring when webview loads
        console.log('[Auxly MCP] 🚀 Initializing MCP health monitoring');
        startMCPHealthMonitoring();
        
        // Call initialization immediately since webview DOM is already loaded
        initializeEventListeners();
    </script>
</body>
</html>`;
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.TaskPanelProvider = TaskPanelProvider;
//# sourceMappingURL=TaskPanelProvider.js.map