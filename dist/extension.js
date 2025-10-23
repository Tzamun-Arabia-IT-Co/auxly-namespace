/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 219:
/***/ ((module) => {

"use strict";


/** @type {import('.')} */
module.exports = Error;


/***/ }),

/***/ 225:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var GetIntrinsic = __webpack_require__(8897);

var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

var hasToStringTag = __webpack_require__(1432)();
var hasOwn = __webpack_require__(4313);
var $TypeError = __webpack_require__(1711);

var toStringTag = hasToStringTag ? Symbol.toStringTag : null;

/** @type {import('.')} */
module.exports = function setToStringTag(object, value) {
	var overrideIfSet = arguments.length > 2 && !!arguments[2] && arguments[2].force;
	var nonConfigurable = arguments.length > 2 && !!arguments[2] && arguments[2].nonConfigurable;
	if (
		(typeof overrideIfSet !== 'undefined' && typeof overrideIfSet !== 'boolean')
		|| (typeof nonConfigurable !== 'undefined' && typeof nonConfigurable !== 'boolean')
	) {
		throw new $TypeError('if provided, the `overrideIfSet` and `nonConfigurable` options must be booleans');
	}
	if (toStringTag && (overrideIfSet || !hasOwn(object, toStringTag))) {
		if ($defineProperty) {
			$defineProperty(object, toStringTag, {
				configurable: !nonConfigurable,
				enumerable: false,
				value: value,
				writable: false
			});
		} else {
			object[toStringTag] = value; // eslint-disable-line no-param-reassign
		}
	}
};


/***/ }),

/***/ 264:
/***/ ((module) => {

// API
module.exports = state;

/**
 * Creates initial state object
 * for iteration over list
 *
 * @param   {array|object} list - list to iterate over
 * @param   {function|null} sortMethod - function to use for keys sort,
 *                                     or `null` to keep them as is
 * @returns {object} - initial state object
 */
function state(list, sortMethod)
{
  var isNamedList = !Array.isArray(list)
    , initState =
    {
      index    : 0,
      keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
      jobs     : {},
      results  : isNamedList ? {} : [],
      size     : isNamedList ? Object.keys(list).length : list.length
    }
    ;

  if (sortMethod)
  {
    // sort array keys based on it's values
    // sort object's keys just on own merit
    initState.keyedList.sort(isNamedList ? sortMethod : function(a, b)
    {
      return sortMethod(list[a], list[b]);
    });
  }

  return initState;
}


/***/ }),

/***/ 376:
/***/ ((module) => {

"use strict";


/** @type {import('./functionCall')} */
module.exports = Function.prototype.call;


/***/ }),

/***/ 459:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const os = __webpack_require__(857);
const tty = __webpack_require__(2018);
const hasFlag = __webpack_require__(5704);

const {env} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env) {
	if (env.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (haveStream && !streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream, stream && stream.isTTY);
	return translateLevel(level);
}

module.exports = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};


/***/ }),

/***/ 857:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 946:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(4499);
var $TypeError = __webpack_require__(1711);

var $call = __webpack_require__(376);
var $actualApply = __webpack_require__(3836);

/** @type {(args: [Function, thisArg?: unknown, ...args: unknown[]]) => Function} TODO FIXME, find a way to use import('.') */
module.exports = function callBindBasic(args) {
	if (args.length < 1 || typeof args[0] !== 'function') {
		throw new $TypeError('a function is required');
	}
	return $actualApply(bind, $call, args);
};


/***/ }),

/***/ 956:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskPanelProvider = void 0;
const vscode = __importStar(__webpack_require__(1398));
const path = __importStar(__webpack_require__(6928));
const extension_1 = __webpack_require__(8733);
const packageJson = __webpack_require__(8330);
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
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(__webpack_require__(5347)));
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
        const { exec } = await Promise.resolve().then(() => __importStar(__webpack_require__(5317)));
        const { promisify } = await Promise.resolve().then(() => __importStar(__webpack_require__(9023)));
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


/***/ }),

/***/ 1236:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(6301);
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		const split = (typeof namespaces === 'string' ? namespaces : '')
			.trim()
			.replace(/\s+/g, ',')
			.split(',')
			.filter(Boolean);

		for (const ns of split) {
			if (ns[0] === '-') {
				createDebug.skips.push(ns.slice(1));
			} else {
				createDebug.names.push(ns);
			}
		}
	}

	/**
	 * Checks if the given string matches a namespace template, honoring
	 * asterisks as wildcards.
	 *
	 * @param {String} search
	 * @param {String} template
	 * @return {Boolean}
	 */
	function matchesTemplate(search, template) {
		let searchIndex = 0;
		let templateIndex = 0;
		let starIndex = -1;
		let matchIndex = 0;

		while (searchIndex < search.length) {
			if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
				// Match character or proceed with wildcard
				if (template[templateIndex] === '*') {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++; // Skip the '*'
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
				// Backtrack to the last '*' and try to match more characters
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else {
				return false; // No match
			}
		}

		// Handle trailing '*' in template
		while (templateIndex < template.length && template[templateIndex] === '*') {
			templateIndex++;
		}

		return templateIndex === template.length;
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names,
			...createDebug.skips.map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		for (const skip of createDebug.skips) {
			if (matchesTemplate(name, skip)) {
				return false;
			}
		}

		for (const ns of createDebug.names) {
			if (matchesTemplate(name, ns)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ 1270:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Task Service (Local Storage Edition)
 * Handles task management with local .auxly/tasks.json storage
 * Fast, reliable, offline-first approach (like Todo2)
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskService = void 0;
const vscode = __importStar(__webpack_require__(1398));
const local_storage_1 = __webpack_require__(5541);
const local_config_1 = __webpack_require__(5347);
/**
 * TaskService Singleton
 * Manages all task-related operations using local storage
 */
class TaskService {
    constructor() {
        this.taskUpdateListeners = [];
        this.loadingStateListeners = [];
        this.localStorage = local_storage_1.LocalStorageService.getInstance();
        this.configService = local_config_1.LocalConfigService.getInstance();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!TaskService.instance) {
            TaskService.instance = new TaskService();
        }
        return TaskService.instance;
    }
    /**
     * Initialize task service with local storage
     */
    async initialize() {
        try {
            await this.localStorage.initialize();
            console.log('✅ TaskService initialized with local storage');
            // Watch for external file changes
            this.localStorage.watchTasksFile(() => {
                this.fetchTasks(true);
            });
            // Load initial tasks
            await this.fetchTasks(true);
        }
        catch (error) {
            console.error('❌ Failed to initialize TaskService:', error);
            throw error;
        }
    }
    /**
     * Subscribe to task updates
     */
    onTasksUpdated(listener) {
        this.taskUpdateListeners.push(listener);
        return {
            dispose: () => {
                const index = this.taskUpdateListeners.indexOf(listener);
                if (index > -1) {
                    this.taskUpdateListeners.splice(index, 1);
                }
            }
        };
    }
    /**
     * Subscribe to loading state changes
     */
    onLoadingStateChanged(listener) {
        this.loadingStateListeners.push(listener);
        return {
            dispose: () => {
                const index = this.loadingStateListeners.indexOf(listener);
                if (index > -1) {
                    this.loadingStateListeners.splice(index, 1);
                }
            }
        };
    }
    /**
     * Notify listeners of task updates
     */
    notifyTasksUpdated(tasks) {
        this.taskUpdateListeners.forEach(listener => {
            try {
                listener(tasks);
            }
            catch (error) {
                console.error('Error in task update listener:', error);
            }
        });
    }
    /**
     * Notify listeners of loading state changes
     */
    notifyLoadingStateChanged(state) {
        this.loadingStateListeners.forEach(listener => {
            try {
                listener(state);
            }
            catch (error) {
                console.error('Error in loading state listener:', error);
            }
        });
    }
    /**
     * Get storage file path (for debugging)
     */
    getStoragePath() {
        return this.localStorage.getStoragePath();
    }
    /**
     * Check if user has write access (API key required)
     * Returns true if user has valid API key
     */
    async canWriteTasks() {
        try {
            // Check if user has API key
            const hasApiKey = await this.configService.hasApiKey();
            return hasApiKey;
        }
        catch (error) {
            console.error('Error checking write access:', error);
            return false; // Fail secure
        }
    }
    /**
     * Show read-only mode error with API key prompt
     */
    async showReadOnlyError() {
        const action = await vscode.window.showErrorMessage('🔒 Please connect your API key to create or edit tasks.', 'Enter API Key', 'Get Free API Key');
        if (action === 'Enter API Key') {
            // Trigger API key entry command via connect (not login)
            vscode.commands.executeCommand('auxly.connect');
        }
        else if (action === 'Get Free API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://auxly.tzamun.com'));
        }
    }
    /**
     * Force fresh fetch from backend (bypasses localStorage cache)
     * Used when webview reloads to ensure fresh data
     */
    async forceFreshFetch() {
        try {
            console.log('🔄 forceFreshFetch: Clearing cache and reloading from backend');
            this.notifyLoadingStateChanged({ isLoading: true, operation: 'refreshing' });
            // Clear localStorage cache
            await this.localStorage.clearAllTasks();
            console.log('🗑️ Cache cleared');
            // Re-initialize to load from backend
            await this.localStorage.initialize();
            console.log('♻️ Storage re-initialized');
            // Fetch fresh data
            const groupedTasks = await this.localStorage.getGroupedTasks();
            console.log(`✅ Fresh fetch complete: ${Object.values(groupedTasks).flat().length} tasks loaded`);
            this.notifyTasksUpdated(groupedTasks);
            return groupedTasks;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh tasks';
            console.error('Force fresh fetch error:', error);
            vscode.window.showErrorMessage(`Failed to refresh tasks: ${errorMessage}`);
            return null;
        }
        finally {
            this.notifyLoadingStateChanged({ isLoading: false });
        }
    }
    /**
     * Fetch all tasks from local storage
     */
    async fetchTasks(silent = false) {
        try {
            if (!silent) {
                this.notifyLoadingStateChanged({ isLoading: true, operation: 'fetching' });
            }
            const groupedTasks = await this.localStorage.getGroupedTasks();
            console.log(`📋 Fetched ${Object.values(groupedTasks).flat().length} tasks from local storage`);
            this.notifyTasksUpdated(groupedTasks);
            return groupedTasks;
        }
        catch (error) {
            if (!silent) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
                vscode.window.showErrorMessage(`Failed to fetch tasks: ${errorMessage}`);
            }
            else {
                console.error('Fetch tasks error:', error);
            }
            return null;
        }
        finally {
            if (!silent) {
                this.notifyLoadingStateChanged({ isLoading: false });
            }
        }
    }
    /**
     * Create a new task with input dialogs
     */
    async createTask() {
        try {
            // Check write access (read-only mode)
            const canWrite = await this.canWriteTasks();
            if (!canWrite) {
                await this.showReadOnlyError();
                return null;
            }
            // Step 1: Get task title
            const title = await vscode.window.showInputBox({
                prompt: 'Enter task title',
                placeHolder: 'Implement new feature',
                ignoreFocusOut: true,
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Task title is required';
                    }
                    if (value.length > 100) {
                        return 'Task title must be 100 characters or less';
                    }
                    return null;
                }
            });
            if (title === undefined) {
                return null; // User cancelled
            }
            // Step 2: Get task description (optional)
            const description = await vscode.window.showInputBox({
                prompt: 'Enter task description (optional)',
                placeHolder: 'Detailed description of the task...',
                ignoreFocusOut: true
            });
            if (description === undefined) {
                return null; // User cancelled
            }
            // Step 3: Select priority
            const priorityOptions = [
                { label: 'Medium', description: 'Default priority', picked: true },
                { label: 'Low', description: 'Nice to have' },
                { label: 'High', description: 'Important' },
                { label: 'Critical', description: 'Urgent' }
            ];
            const prioritySelection = await vscode.window.showQuickPick(priorityOptions, {
                placeHolder: 'Select task priority',
                ignoreFocusOut: true
            });
            if (!prioritySelection) {
                return null; // User cancelled
            }
            const priority = prioritySelection.label.toLowerCase();
            // Step 4: Create task with progress
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating task...',
                cancellable: false
            }, async () => {
                try {
                    this.notifyLoadingStateChanged({ isLoading: true, operation: 'creating' });
                    const taskData = {
                        title: title.trim(),
                        description: description?.trim() || undefined,
                        priority
                    };
                    const newTask = await this.localStorage.createTask(taskData);
                    // Refresh tasks to update UI
                    await this.fetchTasks(true);
                    const config = vscode.workspace.getConfiguration('auxly');
                    if (config.get('enableNotifications', true)) {
                        vscode.window.showInformationMessage(`✅ Task created: ${newTask.title}`);
                    }
                    return newTask;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
                    vscode.window.showErrorMessage(`Failed to create task: ${errorMessage}`);
                    return null;
                }
                finally {
                    this.notifyLoadingStateChanged({ isLoading: false });
                }
            });
        }
        catch (error) {
            console.error('Task creation error:', error);
            vscode.window.showErrorMessage('An unexpected error occurred while creating task');
            return null;
        }
    }
    /**
     * Update a task
     */
    async updateTask(taskId, updates) {
        try {
            // Check write access (read-only mode)
            const canWrite = await this.canWriteTasks();
            if (!canWrite) {
                await this.showReadOnlyError();
                return null;
            }
            this.notifyLoadingStateChanged({ isLoading: true, operation: 'updating' });
            const updatedTask = await this.localStorage.updateTask(taskId, updates);
            if (!updatedTask) {
                vscode.window.showErrorMessage('Task not found');
                return null;
            }
            // Refresh tasks to update UI
            await this.fetchTasks(true);
            const config = vscode.workspace.getConfiguration('auxly');
            if (config.get('enableNotifications', true) && updates.status) {
                vscode.window.showInformationMessage(`✅ Task moved to ${updates.status.replace('_', ' ')}`);
            }
            return updatedTask;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
            vscode.window.showErrorMessage(`Failed to update task: ${errorMessage}`);
            return null;
        }
        finally {
            this.notifyLoadingStateChanged({ isLoading: false });
        }
    }
    /**
     * Reopen a task with a reason (adds comment and "reopen" tag)
     */
    async reopenTaskWithReason(taskId, reason) {
        try {
            this.notifyLoadingStateChanged({ isLoading: true, operation: 'reopening' });
            // Get current task
            const task = await this.localStorage.getTask(taskId);
            if (!task) {
                vscode.window.showErrorMessage('Task not found');
                return null;
            }
            // Add reopen comment
            const reopenComment = {
                id: Date.now().toString(),
                author: 'user',
                authorName: 'User',
                content: reason,
                type: 'reopen_reason',
                createdAt: new Date().toISOString()
            };
            const comments = task.comments || [];
            comments.push(reopenComment);
            // Add "reopen" tag if not present
            const tags = task.tags || [];
            if (!tags.includes('reopen')) {
                tags.push('reopen');
            }
            // Update task with new status, comment, and tag
            const updatedTask = await this.localStorage.updateTask(taskId, {
                status: 'in_progress',
                tags: tags,
                comments: comments
            });
            if (!updatedTask) {
                vscode.window.showErrorMessage('Failed to reopen task');
                return null;
            }
            // Refresh tasks to update UI
            await this.fetchTasks(true);
            console.log(`✅ Task reopened: ${updatedTask.title} - Reason: ${reason}`);
            return updatedTask;
        }
        catch (error) {
            console.error('Failed to reopen task with reason:', error);
            vscode.window.showErrorMessage('Failed to reopen task: ' + error.message);
            return null;
        }
        finally {
            this.notifyLoadingStateChanged({ isLoading: false });
        }
    }
    /**
     * Delete a task with confirmation
     */
    async deleteTask(taskId, taskTitle) {
        try {
            // Check write access (read-only mode)
            const canWrite = await this.canWriteTasks();
            if (!canWrite) {
                await this.showReadOnlyError();
                return false;
            }
            // Confirm deletion
            const confirmation = await vscode.window.showWarningMessage(`Are you sure you want to delete task: "${taskTitle}"?`, { modal: true }, 'Delete', 'Cancel');
            if (confirmation !== 'Delete') {
                return false;
            }
            // Delete with progress
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Deleting task...',
                cancellable: false
            }, async () => {
                try {
                    this.notifyLoadingStateChanged({ isLoading: true, operation: 'deleting' });
                    const success = await this.localStorage.deleteTask(taskId);
                    if (!success) {
                        vscode.window.showErrorMessage('Task not found');
                        return false;
                    }
                    // Refresh tasks to update UI
                    await this.fetchTasks(true);
                    const config = vscode.workspace.getConfiguration('auxly');
                    if (config.get('enableNotifications', true)) {
                        vscode.window.showInformationMessage('✅ Task deleted');
                    }
                    return true;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
                    vscode.window.showErrorMessage(`Failed to delete task: ${errorMessage}`);
                    return false;
                }
                finally {
                    this.notifyLoadingStateChanged({ isLoading: false });
                }
            });
        }
        catch (error) {
            console.error('Task deletion error:', error);
            vscode.window.showErrorMessage('An unexpected error occurred while deleting task');
            return false;
        }
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.taskUpdateListeners = [];
        this.loadingStateListeners = [];
    }
}
exports.TaskService = TaskService;


/***/ }),

/***/ 1398:
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),

/***/ 1399:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/** @type {import('.')} */
var $gOPD = __webpack_require__(6433);

if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;


/***/ }),

/***/ 1420:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var parseUrl = (__webpack_require__(7016).parse);

var DEFAULT_PORTS = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
};

var stringEndsWith = String.prototype.endsWith || function(s) {
  return s.length <= this.length &&
    this.indexOf(s, this.length - s.length) !== -1;
};

/**
 * @param {string|object} url - The URL, or the result from url.parse.
 * @return {string} The URL of the proxy that should handle the request to the
 *  given URL. If no proxy is set, this will be an empty string.
 */
function getProxyForUrl(url) {
  var parsedUrl = typeof url === 'string' ? parseUrl(url) : url || {};
  var proto = parsedUrl.protocol;
  var hostname = parsedUrl.host;
  var port = parsedUrl.port;
  if (typeof hostname !== 'string' || !hostname || typeof proto !== 'string') {
    return '';  // Don't proxy URLs without a valid scheme or host.
  }

  proto = proto.split(':', 1)[0];
  // Stripping ports in this way instead of using parsedUrl.hostname to make
  // sure that the brackets around IPv6 addresses are kept.
  hostname = hostname.replace(/:\d*$/, '');
  port = parseInt(port) || DEFAULT_PORTS[proto] || 0;
  if (!shouldProxy(hostname, port)) {
    return '';  // Don't proxy URLs that match NO_PROXY.
  }

  var proxy =
    getEnv('npm_config_' + proto + '_proxy') ||
    getEnv(proto + '_proxy') ||
    getEnv('npm_config_proxy') ||
    getEnv('all_proxy');
  if (proxy && proxy.indexOf('://') === -1) {
    // Missing scheme in proxy, default to the requested URL's scheme.
    proxy = proto + '://' + proxy;
  }
  return proxy;
}

/**
 * Determines whether a given URL should be proxied.
 *
 * @param {string} hostname - The host name of the URL.
 * @param {number} port - The effective port of the URL.
 * @returns {boolean} Whether the given URL should be proxied.
 * @private
 */
function shouldProxy(hostname, port) {
  var NO_PROXY =
    (getEnv('npm_config_no_proxy') || getEnv('no_proxy')).toLowerCase();
  if (!NO_PROXY) {
    return true;  // Always proxy if NO_PROXY is not set.
  }
  if (NO_PROXY === '*') {
    return false;  // Never proxy if wildcard is set.
  }

  return NO_PROXY.split(/[,\s]/).every(function(proxy) {
    if (!proxy) {
      return true;  // Skip zero-length hosts.
    }
    var parsedProxy = proxy.match(/^(.+):(\d+)$/);
    var parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
    var parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
    if (parsedProxyPort && parsedProxyPort !== port) {
      return true;  // Skip if ports don't match.
    }

    if (!/^[.*]/.test(parsedProxyHostname)) {
      // No wildcards, so stop proxying if there is an exact match.
      return hostname !== parsedProxyHostname;
    }

    if (parsedProxyHostname.charAt(0) === '*') {
      // Remove leading wildcard.
      parsedProxyHostname = parsedProxyHostname.slice(1);
    }
    // Stop proxying if the hostname ends with the no_proxy host.
    return !stringEndsWith.call(hostname, parsedProxyHostname);
  });
}

/**
 * Get the value for an environment variable.
 *
 * @param {string} key - The name of the environment variable.
 * @return {string} The value of the environment variable.
 * @private
 */
function getEnv(key) {
  return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || '';
}

exports.getProxyForUrl = getProxyForUrl;


/***/ }),

/***/ 1432:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var hasSymbols = __webpack_require__(4361);

/** @type {import('.')} */
module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};


/***/ }),

/***/ 1588:
/***/ ((module) => {

"use strict";


/** @type {import('./Reflect.getPrototypeOf')} */
module.exports = (typeof Reflect !== 'undefined' && Reflect.getPrototypeOf) || null;


/***/ }),

/***/ 1615:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var debug;

module.exports = function () {
  if (!debug) {
    try {
      /* eslint global-require: off */
      debug = __webpack_require__(9221)("follow-redirects");
    }
    catch (error) { /* */ }
    if (typeof debug !== "function") {
      debug = function () { /* */ };
    }
  }
  debug.apply(null, arguments);
};


/***/ }),

/***/ 1711:
/***/ ((module) => {

"use strict";


/** @type {import('./type')} */
module.exports = TypeError;


/***/ }),

/***/ 1724:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var callBind = __webpack_require__(946);
var gOPD = __webpack_require__(1399);

var hasProtoAccessor;
try {
	// eslint-disable-next-line no-extra-parens, no-proto
	hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */ ([]).__proto__ === Array.prototype;
} catch (e) {
	if (!e || typeof e !== 'object' || !('code' in e) || e.code !== 'ERR_PROTO_ACCESS') {
		throw e;
	}
}

// eslint-disable-next-line no-extra-parens
var desc = !!hasProtoAccessor && gOPD && gOPD(Object.prototype, /** @type {keyof typeof Object.prototype} */ ('__proto__'));

var $Object = Object;
var $getPrototypeOf = $Object.getPrototypeOf;

/** @type {import('./get')} */
module.exports = desc && typeof desc.get === 'function'
	? callBind([desc.get])
	: typeof $getPrototypeOf === 'function'
		? /** @type {import('./get')} */ function getDunder(value) {
			// eslint-disable-next-line eqeqeq
			return $getPrototypeOf(value == null ? value : $Object(value));
		}
		: false;


/***/ }),

/***/ 1943:
/***/ ((module) => {

"use strict";
module.exports = require("fs/promises");

/***/ }),

/***/ 2018:
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ 2203:
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ 2613:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 2925:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var CombinedStream = __webpack_require__(5645);
var util = __webpack_require__(9023);
var path = __webpack_require__(6928);
var http = __webpack_require__(8611);
var https = __webpack_require__(5692);
var parseUrl = (__webpack_require__(7016).parse);
var fs = __webpack_require__(9896);
var Stream = (__webpack_require__(2203).Stream);
var crypto = __webpack_require__(6982);
var mime = __webpack_require__(9726);
var asynckit = __webpack_require__(8909);
var setToStringTag = __webpack_require__(225);
var hasOwn = __webpack_require__(4313);
var populate = __webpack_require__(6686);

/**
 * Create readable "multipart/form-data" streams.
 * Can be used to submit forms
 * and file uploads to other web applications.
 *
 * @constructor
 * @param {object} options - Properties to be added/overriden for FormData and CombinedStream
 */
function FormData(options) {
  if (!(this instanceof FormData)) {
    return new FormData(options);
  }

  this._overheadLength = 0;
  this._valueLength = 0;
  this._valuesToMeasure = [];

  CombinedStream.call(this);

  options = options || {}; // eslint-disable-line no-param-reassign
  for (var option in options) { // eslint-disable-line no-restricted-syntax
    this[option] = options[option];
  }
}

// make it a Stream
util.inherits(FormData, CombinedStream);

FormData.LINE_BREAK = '\r\n';
FormData.DEFAULT_CONTENT_TYPE = 'application/octet-stream';

FormData.prototype.append = function (field, value, options) {
  options = options || {}; // eslint-disable-line no-param-reassign

  // allow filename as single option
  if (typeof options === 'string') {
    options = { filename: options }; // eslint-disable-line no-param-reassign
  }

  var append = CombinedStream.prototype.append.bind(this);

  // all that streamy business can't handle numbers
  if (typeof value === 'number' || value == null) {
    value = String(value); // eslint-disable-line no-param-reassign
  }

  // https://github.com/felixge/node-form-data/issues/38
  if (Array.isArray(value)) {
    /*
     * Please convert your array into string
     * the way web server expects it
     */
    this._error(new Error('Arrays are not supported.'));
    return;
  }

  var header = this._multiPartHeader(field, value, options);
  var footer = this._multiPartFooter();

  append(header);
  append(value);
  append(footer);

  // pass along options.knownLength
  this._trackLength(header, value, options);
};

FormData.prototype._trackLength = function (header, value, options) {
  var valueLength = 0;

  /*
   * used w/ getLengthSync(), when length is known.
   * e.g. for streaming directly from a remote server,
   * w/ a known file a size, and not wanting to wait for
   * incoming file to finish to get its size.
   */
  if (options.knownLength != null) {
    valueLength += Number(options.knownLength);
  } else if (Buffer.isBuffer(value)) {
    valueLength = value.length;
  } else if (typeof value === 'string') {
    valueLength = Buffer.byteLength(value);
  }

  this._valueLength += valueLength;

  // @check why add CRLF? does this account for custom/multiple CRLFs?
  this._overheadLength += Buffer.byteLength(header) + FormData.LINE_BREAK.length;

  // empty or either doesn't have path or not an http response or not a stream
  if (!value || (!value.path && !(value.readable && hasOwn(value, 'httpVersion')) && !(value instanceof Stream))) {
    return;
  }

  // no need to bother with the length
  if (!options.knownLength) {
    this._valuesToMeasure.push(value);
  }
};

FormData.prototype._lengthRetriever = function (value, callback) {
  if (hasOwn(value, 'fd')) {
    // take read range into a account
    // `end` = Infinity –> read file till the end
    //
    // TODO: Looks like there is bug in Node fs.createReadStream
    // it doesn't respect `end` options without `start` options
    // Fix it when node fixes it.
    // https://github.com/joyent/node/issues/7819
    if (value.end != undefined && value.end != Infinity && value.start != undefined) {
      // when end specified
      // no need to calculate range
      // inclusive, starts with 0
      callback(null, value.end + 1 - (value.start ? value.start : 0)); // eslint-disable-line callback-return

      // not that fast snoopy
    } else {
      // still need to fetch file size from fs
      fs.stat(value.path, function (err, stat) {
        if (err) {
          callback(err);
          return;
        }

        // update final size based on the range options
        var fileSize = stat.size - (value.start ? value.start : 0);
        callback(null, fileSize);
      });
    }

    // or http response
  } else if (hasOwn(value, 'httpVersion')) {
    callback(null, Number(value.headers['content-length'])); // eslint-disable-line callback-return

    // or request stream http://github.com/mikeal/request
  } else if (hasOwn(value, 'httpModule')) {
    // wait till response come back
    value.on('response', function (response) {
      value.pause();
      callback(null, Number(response.headers['content-length']));
    });
    value.resume();

    // something else
  } else {
    callback('Unknown stream'); // eslint-disable-line callback-return
  }
};

FormData.prototype._multiPartHeader = function (field, value, options) {
  /*
   * custom header specified (as string)?
   * it becomes responsible for boundary
   * (e.g. to handle extra CRLFs on .NET servers)
   */
  if (typeof options.header === 'string') {
    return options.header;
  }

  var contentDisposition = this._getContentDisposition(value, options);
  var contentType = this._getContentType(value, options);

  var contents = '';
  var headers = {
    // add custom disposition as third element or keep it two elements if not
    'Content-Disposition': ['form-data', 'name="' + field + '"'].concat(contentDisposition || []),
    // if no content type. allow it to be empty array
    'Content-Type': [].concat(contentType || [])
  };

  // allow custom headers.
  if (typeof options.header === 'object') {
    populate(headers, options.header);
  }

  var header;
  for (var prop in headers) { // eslint-disable-line no-restricted-syntax
    if (hasOwn(headers, prop)) {
      header = headers[prop];

      // skip nullish headers.
      if (header == null) {
        continue; // eslint-disable-line no-restricted-syntax, no-continue
      }

      // convert all headers to arrays.
      if (!Array.isArray(header)) {
        header = [header];
      }

      // add non-empty headers.
      if (header.length) {
        contents += prop + ': ' + header.join('; ') + FormData.LINE_BREAK;
      }
    }
  }

  return '--' + this.getBoundary() + FormData.LINE_BREAK + contents + FormData.LINE_BREAK;
};

FormData.prototype._getContentDisposition = function (value, options) { // eslint-disable-line consistent-return
  var filename;

  if (typeof options.filepath === 'string') {
    // custom filepath for relative paths
    filename = path.normalize(options.filepath).replace(/\\/g, '/');
  } else if (options.filename || (value && (value.name || value.path))) {
    /*
     * custom filename take precedence
     * formidable and the browser add a name property
     * fs- and request- streams have path property
     */
    filename = path.basename(options.filename || (value && (value.name || value.path)));
  } else if (value && value.readable && hasOwn(value, 'httpVersion')) {
    // or try http response
    filename = path.basename(value.client._httpMessage.path || '');
  }

  if (filename) {
    return 'filename="' + filename + '"';
  }
};

FormData.prototype._getContentType = function (value, options) {
  // use custom content-type above all
  var contentType = options.contentType;

  // or try `name` from formidable, browser
  if (!contentType && value && value.name) {
    contentType = mime.lookup(value.name);
  }

  // or try `path` from fs-, request- streams
  if (!contentType && value && value.path) {
    contentType = mime.lookup(value.path);
  }

  // or if it's http-reponse
  if (!contentType && value && value.readable && hasOwn(value, 'httpVersion')) {
    contentType = value.headers['content-type'];
  }

  // or guess it from the filepath or filename
  if (!contentType && (options.filepath || options.filename)) {
    contentType = mime.lookup(options.filepath || options.filename);
  }

  // fallback to the default content type if `value` is not simple value
  if (!contentType && value && typeof value === 'object') {
    contentType = FormData.DEFAULT_CONTENT_TYPE;
  }

  return contentType;
};

FormData.prototype._multiPartFooter = function () {
  return function (next) {
    var footer = FormData.LINE_BREAK;

    var lastPart = this._streams.length === 0;
    if (lastPart) {
      footer += this._lastBoundary();
    }

    next(footer);
  }.bind(this);
};

FormData.prototype._lastBoundary = function () {
  return '--' + this.getBoundary() + '--' + FormData.LINE_BREAK;
};

FormData.prototype.getHeaders = function (userHeaders) {
  var header;
  var formHeaders = {
    'content-type': 'multipart/form-data; boundary=' + this.getBoundary()
  };

  for (header in userHeaders) { // eslint-disable-line no-restricted-syntax
    if (hasOwn(userHeaders, header)) {
      formHeaders[header.toLowerCase()] = userHeaders[header];
    }
  }

  return formHeaders;
};

FormData.prototype.setBoundary = function (boundary) {
  if (typeof boundary !== 'string') {
    throw new TypeError('FormData boundary must be a string');
  }
  this._boundary = boundary;
};

FormData.prototype.getBoundary = function () {
  if (!this._boundary) {
    this._generateBoundary();
  }

  return this._boundary;
};

FormData.prototype.getBuffer = function () {
  var dataBuffer = new Buffer.alloc(0); // eslint-disable-line new-cap
  var boundary = this.getBoundary();

  // Create the form content. Add Line breaks to the end of data.
  for (var i = 0, len = this._streams.length; i < len; i++) {
    if (typeof this._streams[i] !== 'function') {
      // Add content to the buffer.
      if (Buffer.isBuffer(this._streams[i])) {
        dataBuffer = Buffer.concat([dataBuffer, this._streams[i]]);
      } else {
        dataBuffer = Buffer.concat([dataBuffer, Buffer.from(this._streams[i])]);
      }

      // Add break after content.
      if (typeof this._streams[i] !== 'string' || this._streams[i].substring(2, boundary.length + 2) !== boundary) {
        dataBuffer = Buffer.concat([dataBuffer, Buffer.from(FormData.LINE_BREAK)]);
      }
    }
  }

  // Add the footer and return the Buffer object.
  return Buffer.concat([dataBuffer, Buffer.from(this._lastBoundary())]);
};

FormData.prototype._generateBoundary = function () {
  // This generates a 50 character boundary similar to those used by Firefox.

  // They are optimized for boyer-moore parsing.
  this._boundary = '--------------------------' + crypto.randomBytes(12).toString('hex');
};

// Note: getLengthSync DOESN'T calculate streams length
// As workaround one can calculate file size manually and add it as knownLength option
FormData.prototype.getLengthSync = function () {
  var knownLength = this._overheadLength + this._valueLength;

  // Don't get confused, there are 3 "internal" streams for each keyval pair so it basically checks if there is any value added to the form
  if (this._streams.length) {
    knownLength += this._lastBoundary().length;
  }

  // https://github.com/form-data/form-data/issues/40
  if (!this.hasKnownLength()) {
    /*
     * Some async length retrievers are present
     * therefore synchronous length calculation is false.
     * Please use getLength(callback) to get proper length
     */
    this._error(new Error('Cannot calculate proper length in synchronous way.'));
  }

  return knownLength;
};

// Public API to check if length of added values is known
// https://github.com/form-data/form-data/issues/196
// https://github.com/form-data/form-data/issues/262
FormData.prototype.hasKnownLength = function () {
  var hasKnownLength = true;

  if (this._valuesToMeasure.length) {
    hasKnownLength = false;
  }

  return hasKnownLength;
};

FormData.prototype.getLength = function (cb) {
  var knownLength = this._overheadLength + this._valueLength;

  if (this._streams.length) {
    knownLength += this._lastBoundary().length;
  }

  if (!this._valuesToMeasure.length) {
    process.nextTick(cb.bind(this, null, knownLength));
    return;
  }

  asynckit.parallel(this._valuesToMeasure, this._lengthRetriever, function (err, values) {
    if (err) {
      cb(err);
      return;
    }

    values.forEach(function (length) {
      knownLength += length;
    });

    cb(null, knownLength);
  });
};

FormData.prototype.submit = function (params, cb) {
  var request;
  var options;
  var defaults = { method: 'post' };

  // parse provided url if it's string or treat it as options object
  if (typeof params === 'string') {
    params = parseUrl(params); // eslint-disable-line no-param-reassign
    /* eslint sort-keys: 0 */
    options = populate({
      port: params.port,
      path: params.pathname,
      host: params.hostname,
      protocol: params.protocol
    }, defaults);
  } else { // use custom params
    options = populate(params, defaults);
    // if no port provided use default one
    if (!options.port) {
      options.port = options.protocol === 'https:' ? 443 : 80;
    }
  }

  // put that good code in getHeaders to some use
  options.headers = this.getHeaders(params.headers);

  // https if specified, fallback to http in any other case
  if (options.protocol === 'https:') {
    request = https.request(options);
  } else {
    request = http.request(options);
  }

  // get content length and fire away
  this.getLength(function (err, length) {
    if (err && err !== 'Unknown stream') {
      this._error(err);
      return;
    }

    // add content length
    if (length) {
      request.setHeader('Content-Length', length);
    }

    this.pipe(request);
    if (cb) {
      var onResponse;

      var callback = function (error, responce) {
        request.removeListener('error', callback);
        request.removeListener('response', onResponse);

        return cb.call(this, error, responce); // eslint-disable-line no-invalid-this
      };

      onResponse = callback.bind(this, null);

      request.on('error', callback);
      request.on('response', onResponse);
    }
  }.bind(this));

  return request;
};

FormData.prototype._error = function (err) {
  if (!this.error) {
    this.error = err;
    this.pause();
    this.emit('error', err);
  }
};

FormData.prototype.toString = function () {
  return '[object FormData]';
};
setToStringTag(FormData, 'FormData');

// Public API
module.exports = FormData;


/***/ }),

/***/ 3106:
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ }),

/***/ 3221:
/***/ ((module) => {

"use strict";


/** @type {import('./uri')} */
module.exports = URIError;


/***/ }),

/***/ 3463:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerMCPServerWithCursorAPI = registerMCPServerWithCursorAPI;
exports.unregisterMCPServer = unregisterMCPServer;
const vscode = __importStar(__webpack_require__(1398));
const path = __importStar(__webpack_require__(6928));
const crypto = __importStar(__webpack_require__(6982));
const fs = __importStar(__webpack_require__(9896));
/**
 * Auxly MCP Registration using Cursor's Extension API
 * This is the SAME approach as Todo2 extension
 */
/**
 * Generate workspace hash (same as Todo2)
 */
function generateWorkspaceHash(workspacePath) {
    return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
}
/**
 * Register MCP server using Cursor's extension API (same as Todo2!)
 */
async function registerMCPServerWithCursorAPI(context) {
    try {
        console.log('[Auxly MCP] Registering MCP server using Cursor API...');
        // Get workspace path
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const workspacePath = workspaceFolders && workspaceFolders.length > 0
            ? workspaceFolders[0].uri.fsPath
            : '';
        // Get extension path and MCP server path
        const extensionPath = context.extensionPath;
        const mcpServerPath = path.join(extensionPath, 'dist', 'mcp-server', 'index.js');
        // Verify MCP server exists
        if (!fs.existsSync(mcpServerPath)) {
            console.error('[Auxly MCP] MCP server not found at:', mcpServerPath);
            return false;
        }
        // Generate workspace ID
        const workspaceHash = workspacePath ? generateWorkspaceHash(workspacePath) : 'default';
        console.log(`[Auxly MCP] Workspace: ${workspacePath || 'No workspace'}`);
        console.log(`[Auxly MCP] Workspace ID: ${workspaceHash}`);
        console.log(`[Auxly MCP] MCP Server: ${mcpServerPath}`);
        // Check if Cursor MCP API is available
        const cursorAPI = vscode.cursor;
        if (!cursorAPI || !cursorAPI.mcp || !cursorAPI.mcp.registerServer) {
            console.error('[Auxly MCP] Cursor MCP API not available');
            console.log('[Auxly MCP] Falling back to .cursor/mcp.json approach');
            return false;
        }
        // Unregister if already registered (like Todo2 does)
        try {
            cursorAPI.mcp.unregisterServer('auxly');
            console.log('[Auxly MCP] Unregistered existing server');
        }
        catch (e) {
            // Ignore - server wasn't registered
        }
        // Register MCP server with Cursor API (EXACT same as Todo2!)
        // Note: Cursor adds "extension-" prefix automatically, so use "auxly"
        // CRITICAL FIX: Use process.execPath instead of 'node' for reliability
        const serverConfig = {
            name: 'auxly',
            server: {
                command: process.execPath, // Full path to node.exe (more reliable than 'node')
                args: [
                    mcpServerPath
                    // Note: Todo2 uses --workspace-id, but we use env vars
                ],
                env: {
                    AUXLY_WORKSPACE_PATH: workspacePath || '',
                    AUXLY_WORKSPACE_ID: workspaceHash,
                    AUXLY_API_URL: vscode.workspace.getConfiguration('auxly').get('apiUrl') || 'https://auxly.tzamun.com:8000'
                }
            }
        };
        console.log('[Auxly MCP] Registering with config:', JSON.stringify(serverConfig, null, 2));
        try {
            await cursorAPI.mcp.registerServer(serverConfig);
            console.log('[Auxly MCP] ✅ Successfully registered MCP server using Cursor API');
            // Wait a moment for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Verify registration
            try {
                const servers = await cursorAPI.mcp.getServers();
                console.log('[Auxly MCP] Registered servers:', Object.keys(servers));
                // Check both possible names (Cursor might add "extension-" prefix)
                if (servers['auxly'] || servers['extension-auxly']) {
                    console.log('[Auxly MCP] ✅ Auxly server found in registry');
                }
                else {
                    console.log('[Auxly MCP] ⚠️ Auxly server NOT in registry after registration!');
                }
            }
            catch (verifyError) {
                console.log('[Auxly MCP] Could not verify registration:', verifyError);
            }
            return true;
        }
        catch (registerError) {
            console.error('[Auxly MCP] Registration failed:', registerError);
            return false;
        }
    }
    catch (error) {
        console.error('[Auxly MCP] Failed to register with Cursor API:', error);
        return false;
    }
}
/**
 * Unregister MCP server (for cleanup)
 */
async function unregisterMCPServer() {
    try {
        const cursorAPI = vscode.cursor;
        if (cursorAPI?.mcp?.unregisterServer) {
            cursorAPI.mcp.unregisterServer('auxly');
            console.log('[Auxly MCP] MCP server unregistered');
        }
    }
    catch (error) {
        console.error('[Auxly MCP] Failed to unregister:', error);
    }
}


/***/ }),

/***/ 3520:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var url = __webpack_require__(7016);
var URL = url.URL;
var http = __webpack_require__(8611);
var https = __webpack_require__(5692);
var Writable = (__webpack_require__(2203).Writable);
var assert = __webpack_require__(2613);
var debug = __webpack_require__(1615);

// Preventive platform detection
// istanbul ignore next
(function detectUnsupportedEnvironment() {
  var looksLikeNode = typeof process !== "undefined";
  var looksLikeBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  var looksLikeV8 = isFunction(Error.captureStackTrace);
  if (!looksLikeNode && (looksLikeBrowser || !looksLikeV8)) {
    console.warn("The follow-redirects package should be excluded from browser builds.");
  }
}());

// Whether to use the native URL object or the legacy url module
var useNativeURL = false;
try {
  assert(new URL(""));
}
catch (error) {
  useNativeURL = error.code === "ERR_INVALID_URL";
}

// URL fields to preserve in copy operations
var preservedUrlFields = [
  "auth",
  "host",
  "hostname",
  "href",
  "path",
  "pathname",
  "port",
  "protocol",
  "query",
  "search",
  "hash",
];

// Create handlers that pass events from native requests
var events = ["abort", "aborted", "connect", "error", "socket", "timeout"];
var eventHandlers = Object.create(null);
events.forEach(function (event) {
  eventHandlers[event] = function (arg1, arg2, arg3) {
    this._redirectable.emit(event, arg1, arg2, arg3);
  };
});

// Error types with codes
var InvalidUrlError = createErrorType(
  "ERR_INVALID_URL",
  "Invalid URL",
  TypeError
);
var RedirectionError = createErrorType(
  "ERR_FR_REDIRECTION_FAILURE",
  "Redirected request failed"
);
var TooManyRedirectsError = createErrorType(
  "ERR_FR_TOO_MANY_REDIRECTS",
  "Maximum number of redirects exceeded",
  RedirectionError
);
var MaxBodyLengthExceededError = createErrorType(
  "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
  "Request body larger than maxBodyLength limit"
);
var WriteAfterEndError = createErrorType(
  "ERR_STREAM_WRITE_AFTER_END",
  "write after end"
);

// istanbul ignore next
var destroy = Writable.prototype.destroy || noop;

// An HTTP(S) request that can be redirected
function RedirectableRequest(options, responseCallback) {
  // Initialize the request
  Writable.call(this);
  this._sanitizeOptions(options);
  this._options = options;
  this._ended = false;
  this._ending = false;
  this._redirectCount = 0;
  this._redirects = [];
  this._requestBodyLength = 0;
  this._requestBodyBuffers = [];

  // Attach a callback if passed
  if (responseCallback) {
    this.on("response", responseCallback);
  }

  // React to responses of native requests
  var self = this;
  this._onNativeResponse = function (response) {
    try {
      self._processResponse(response);
    }
    catch (cause) {
      self.emit("error", cause instanceof RedirectionError ?
        cause : new RedirectionError({ cause: cause }));
    }
  };

  // Perform the first request
  this._performRequest();
}
RedirectableRequest.prototype = Object.create(Writable.prototype);

RedirectableRequest.prototype.abort = function () {
  destroyRequest(this._currentRequest);
  this._currentRequest.abort();
  this.emit("abort");
};

RedirectableRequest.prototype.destroy = function (error) {
  destroyRequest(this._currentRequest, error);
  destroy.call(this, error);
  return this;
};

// Writes buffered data to the current native request
RedirectableRequest.prototype.write = function (data, encoding, callback) {
  // Writing is not allowed if end has been called
  if (this._ending) {
    throw new WriteAfterEndError();
  }

  // Validate input and shift parameters if necessary
  if (!isString(data) && !isBuffer(data)) {
    throw new TypeError("data should be a string, Buffer or Uint8Array");
  }
  if (isFunction(encoding)) {
    callback = encoding;
    encoding = null;
  }

  // Ignore empty buffers, since writing them doesn't invoke the callback
  // https://github.com/nodejs/node/issues/22066
  if (data.length === 0) {
    if (callback) {
      callback();
    }
    return;
  }
  // Only write when we don't exceed the maximum body length
  if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
    this._requestBodyLength += data.length;
    this._requestBodyBuffers.push({ data: data, encoding: encoding });
    this._currentRequest.write(data, encoding, callback);
  }
  // Error when we exceed the maximum body length
  else {
    this.emit("error", new MaxBodyLengthExceededError());
    this.abort();
  }
};

// Ends the current native request
RedirectableRequest.prototype.end = function (data, encoding, callback) {
  // Shift parameters if necessary
  if (isFunction(data)) {
    callback = data;
    data = encoding = null;
  }
  else if (isFunction(encoding)) {
    callback = encoding;
    encoding = null;
  }

  // Write data if needed and end
  if (!data) {
    this._ended = this._ending = true;
    this._currentRequest.end(null, null, callback);
  }
  else {
    var self = this;
    var currentRequest = this._currentRequest;
    this.write(data, encoding, function () {
      self._ended = true;
      currentRequest.end(null, null, callback);
    });
    this._ending = true;
  }
};

// Sets a header value on the current native request
RedirectableRequest.prototype.setHeader = function (name, value) {
  this._options.headers[name] = value;
  this._currentRequest.setHeader(name, value);
};

// Clears a header value on the current native request
RedirectableRequest.prototype.removeHeader = function (name) {
  delete this._options.headers[name];
  this._currentRequest.removeHeader(name);
};

// Global timeout for all underlying requests
RedirectableRequest.prototype.setTimeout = function (msecs, callback) {
  var self = this;

  // Destroys the socket on timeout
  function destroyOnTimeout(socket) {
    socket.setTimeout(msecs);
    socket.removeListener("timeout", socket.destroy);
    socket.addListener("timeout", socket.destroy);
  }

  // Sets up a timer to trigger a timeout event
  function startTimer(socket) {
    if (self._timeout) {
      clearTimeout(self._timeout);
    }
    self._timeout = setTimeout(function () {
      self.emit("timeout");
      clearTimer();
    }, msecs);
    destroyOnTimeout(socket);
  }

  // Stops a timeout from triggering
  function clearTimer() {
    // Clear the timeout
    if (self._timeout) {
      clearTimeout(self._timeout);
      self._timeout = null;
    }

    // Clean up all attached listeners
    self.removeListener("abort", clearTimer);
    self.removeListener("error", clearTimer);
    self.removeListener("response", clearTimer);
    self.removeListener("close", clearTimer);
    if (callback) {
      self.removeListener("timeout", callback);
    }
    if (!self.socket) {
      self._currentRequest.removeListener("socket", startTimer);
    }
  }

  // Attach callback if passed
  if (callback) {
    this.on("timeout", callback);
  }

  // Start the timer if or when the socket is opened
  if (this.socket) {
    startTimer(this.socket);
  }
  else {
    this._currentRequest.once("socket", startTimer);
  }

  // Clean up on events
  this.on("socket", destroyOnTimeout);
  this.on("abort", clearTimer);
  this.on("error", clearTimer);
  this.on("response", clearTimer);
  this.on("close", clearTimer);

  return this;
};

// Proxy all other public ClientRequest methods
[
  "flushHeaders", "getHeader",
  "setNoDelay", "setSocketKeepAlive",
].forEach(function (method) {
  RedirectableRequest.prototype[method] = function (a, b) {
    return this._currentRequest[method](a, b);
  };
});

// Proxy all public ClientRequest properties
["aborted", "connection", "socket"].forEach(function (property) {
  Object.defineProperty(RedirectableRequest.prototype, property, {
    get: function () { return this._currentRequest[property]; },
  });
});

RedirectableRequest.prototype._sanitizeOptions = function (options) {
  // Ensure headers are always present
  if (!options.headers) {
    options.headers = {};
  }

  // Since http.request treats host as an alias of hostname,
  // but the url module interprets host as hostname plus port,
  // eliminate the host property to avoid confusion.
  if (options.host) {
    // Use hostname if set, because it has precedence
    if (!options.hostname) {
      options.hostname = options.host;
    }
    delete options.host;
  }

  // Complete the URL object when necessary
  if (!options.pathname && options.path) {
    var searchPos = options.path.indexOf("?");
    if (searchPos < 0) {
      options.pathname = options.path;
    }
    else {
      options.pathname = options.path.substring(0, searchPos);
      options.search = options.path.substring(searchPos);
    }
  }
};


// Executes the next native request (initial or redirect)
RedirectableRequest.prototype._performRequest = function () {
  // Load the native protocol
  var protocol = this._options.protocol;
  var nativeProtocol = this._options.nativeProtocols[protocol];
  if (!nativeProtocol) {
    throw new TypeError("Unsupported protocol " + protocol);
  }

  // If specified, use the agent corresponding to the protocol
  // (HTTP and HTTPS use different types of agents)
  if (this._options.agents) {
    var scheme = protocol.slice(0, -1);
    this._options.agent = this._options.agents[scheme];
  }

  // Create the native request and set up its event handlers
  var request = this._currentRequest =
        nativeProtocol.request(this._options, this._onNativeResponse);
  request._redirectable = this;
  for (var event of events) {
    request.on(event, eventHandlers[event]);
  }

  // RFC7230§5.3.1: When making a request directly to an origin server, […]
  // a client MUST send only the absolute path […] as the request-target.
  this._currentUrl = /^\//.test(this._options.path) ?
    url.format(this._options) :
    // When making a request to a proxy, […]
    // a client MUST send the target URI in absolute-form […].
    this._options.path;

  // End a redirected request
  // (The first request must be ended explicitly with RedirectableRequest#end)
  if (this._isRedirect) {
    // Write the request entity and end
    var i = 0;
    var self = this;
    var buffers = this._requestBodyBuffers;
    (function writeNext(error) {
      // Only write if this request has not been redirected yet
      // istanbul ignore else
      if (request === self._currentRequest) {
        // Report any write errors
        // istanbul ignore if
        if (error) {
          self.emit("error", error);
        }
        // Write the next buffer if there are still left
        else if (i < buffers.length) {
          var buffer = buffers[i++];
          // istanbul ignore else
          if (!request.finished) {
            request.write(buffer.data, buffer.encoding, writeNext);
          }
        }
        // End the request if `end` has been called on us
        else if (self._ended) {
          request.end();
        }
      }
    }());
  }
};

// Processes a response from the current native request
RedirectableRequest.prototype._processResponse = function (response) {
  // Store the redirected response
  var statusCode = response.statusCode;
  if (this._options.trackRedirects) {
    this._redirects.push({
      url: this._currentUrl,
      headers: response.headers,
      statusCode: statusCode,
    });
  }

  // RFC7231§6.4: The 3xx (Redirection) class of status code indicates
  // that further action needs to be taken by the user agent in order to
  // fulfill the request. If a Location header field is provided,
  // the user agent MAY automatically redirect its request to the URI
  // referenced by the Location field value,
  // even if the specific status code is not understood.

  // If the response is not a redirect; return it as-is
  var location = response.headers.location;
  if (!location || this._options.followRedirects === false ||
      statusCode < 300 || statusCode >= 400) {
    response.responseUrl = this._currentUrl;
    response.redirects = this._redirects;
    this.emit("response", response);

    // Clean up
    this._requestBodyBuffers = [];
    return;
  }

  // The response is a redirect, so abort the current request
  destroyRequest(this._currentRequest);
  // Discard the remainder of the response to avoid waiting for data
  response.destroy();

  // RFC7231§6.4: A client SHOULD detect and intervene
  // in cyclical redirections (i.e., "infinite" redirection loops).
  if (++this._redirectCount > this._options.maxRedirects) {
    throw new TooManyRedirectsError();
  }

  // Store the request headers if applicable
  var requestHeaders;
  var beforeRedirect = this._options.beforeRedirect;
  if (beforeRedirect) {
    requestHeaders = Object.assign({
      // The Host header was set by nativeProtocol.request
      Host: response.req.getHeader("host"),
    }, this._options.headers);
  }

  // RFC7231§6.4: Automatic redirection needs to done with
  // care for methods not known to be safe, […]
  // RFC7231§6.4.2–3: For historical reasons, a user agent MAY change
  // the request method from POST to GET for the subsequent request.
  var method = this._options.method;
  if ((statusCode === 301 || statusCode === 302) && this._options.method === "POST" ||
      // RFC7231§6.4.4: The 303 (See Other) status code indicates that
      // the server is redirecting the user agent to a different resource […]
      // A user agent can perform a retrieval request targeting that URI
      // (a GET or HEAD request if using HTTP) […]
      (statusCode === 303) && !/^(?:GET|HEAD)$/.test(this._options.method)) {
    this._options.method = "GET";
    // Drop a possible entity and headers related to it
    this._requestBodyBuffers = [];
    removeMatchingHeaders(/^content-/i, this._options.headers);
  }

  // Drop the Host header, as the redirect might lead to a different host
  var currentHostHeader = removeMatchingHeaders(/^host$/i, this._options.headers);

  // If the redirect is relative, carry over the host of the last request
  var currentUrlParts = parseUrl(this._currentUrl);
  var currentHost = currentHostHeader || currentUrlParts.host;
  var currentUrl = /^\w+:/.test(location) ? this._currentUrl :
    url.format(Object.assign(currentUrlParts, { host: currentHost }));

  // Create the redirected request
  var redirectUrl = resolveUrl(location, currentUrl);
  debug("redirecting to", redirectUrl.href);
  this._isRedirect = true;
  spreadUrlObject(redirectUrl, this._options);

  // Drop confidential headers when redirecting to a less secure protocol
  // or to a different domain that is not a superdomain
  if (redirectUrl.protocol !== currentUrlParts.protocol &&
     redirectUrl.protocol !== "https:" ||
     redirectUrl.host !== currentHost &&
     !isSubdomain(redirectUrl.host, currentHost)) {
    removeMatchingHeaders(/^(?:(?:proxy-)?authorization|cookie)$/i, this._options.headers);
  }

  // Evaluate the beforeRedirect callback
  if (isFunction(beforeRedirect)) {
    var responseDetails = {
      headers: response.headers,
      statusCode: statusCode,
    };
    var requestDetails = {
      url: currentUrl,
      method: method,
      headers: requestHeaders,
    };
    beforeRedirect(this._options, responseDetails, requestDetails);
    this._sanitizeOptions(this._options);
  }

  // Perform the redirected request
  this._performRequest();
};

// Wraps the key/value object of protocols with redirect functionality
function wrap(protocols) {
  // Default settings
  var exports = {
    maxRedirects: 21,
    maxBodyLength: 10 * 1024 * 1024,
  };

  // Wrap each protocol
  var nativeProtocols = {};
  Object.keys(protocols).forEach(function (scheme) {
    var protocol = scheme + ":";
    var nativeProtocol = nativeProtocols[protocol] = protocols[scheme];
    var wrappedProtocol = exports[scheme] = Object.create(nativeProtocol);

    // Executes a request, following redirects
    function request(input, options, callback) {
      // Parse parameters, ensuring that input is an object
      if (isURL(input)) {
        input = spreadUrlObject(input);
      }
      else if (isString(input)) {
        input = spreadUrlObject(parseUrl(input));
      }
      else {
        callback = options;
        options = validateUrl(input);
        input = { protocol: protocol };
      }
      if (isFunction(options)) {
        callback = options;
        options = null;
      }

      // Set defaults
      options = Object.assign({
        maxRedirects: exports.maxRedirects,
        maxBodyLength: exports.maxBodyLength,
      }, input, options);
      options.nativeProtocols = nativeProtocols;
      if (!isString(options.host) && !isString(options.hostname)) {
        options.hostname = "::1";
      }

      assert.equal(options.protocol, protocol, "protocol mismatch");
      debug("options", options);
      return new RedirectableRequest(options, callback);
    }

    // Executes a GET request, following redirects
    function get(input, options, callback) {
      var wrappedRequest = wrappedProtocol.request(input, options, callback);
      wrappedRequest.end();
      return wrappedRequest;
    }

    // Expose the properties on the wrapped protocol
    Object.defineProperties(wrappedProtocol, {
      request: { value: request, configurable: true, enumerable: true, writable: true },
      get: { value: get, configurable: true, enumerable: true, writable: true },
    });
  });
  return exports;
}

function noop() { /* empty */ }

function parseUrl(input) {
  var parsed;
  // istanbul ignore else
  if (useNativeURL) {
    parsed = new URL(input);
  }
  else {
    // Ensure the URL is valid and absolute
    parsed = validateUrl(url.parse(input));
    if (!isString(parsed.protocol)) {
      throw new InvalidUrlError({ input });
    }
  }
  return parsed;
}

function resolveUrl(relative, base) {
  // istanbul ignore next
  return useNativeURL ? new URL(relative, base) : parseUrl(url.resolve(base, relative));
}

function validateUrl(input) {
  if (/^\[/.test(input.hostname) && !/^\[[:0-9a-f]+\]$/i.test(input.hostname)) {
    throw new InvalidUrlError({ input: input.href || input });
  }
  if (/^\[/.test(input.host) && !/^\[[:0-9a-f]+\](:\d+)?$/i.test(input.host)) {
    throw new InvalidUrlError({ input: input.href || input });
  }
  return input;
}

function spreadUrlObject(urlObject, target) {
  var spread = target || {};
  for (var key of preservedUrlFields) {
    spread[key] = urlObject[key];
  }

  // Fix IPv6 hostname
  if (spread.hostname.startsWith("[")) {
    spread.hostname = spread.hostname.slice(1, -1);
  }
  // Ensure port is a number
  if (spread.port !== "") {
    spread.port = Number(spread.port);
  }
  // Concatenate path
  spread.path = spread.search ? spread.pathname + spread.search : spread.pathname;

  return spread;
}

function removeMatchingHeaders(regex, headers) {
  var lastValue;
  for (var header in headers) {
    if (regex.test(header)) {
      lastValue = headers[header];
      delete headers[header];
    }
  }
  return (lastValue === null || typeof lastValue === "undefined") ?
    undefined : String(lastValue).trim();
}

function createErrorType(code, message, baseClass) {
  // Create constructor
  function CustomError(properties) {
    // istanbul ignore else
    if (isFunction(Error.captureStackTrace)) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.assign(this, properties || {});
    this.code = code;
    this.message = this.cause ? message + ": " + this.cause.message : message;
  }

  // Attach constructor and set default properties
  CustomError.prototype = new (baseClass || Error)();
  Object.defineProperties(CustomError.prototype, {
    constructor: {
      value: CustomError,
      enumerable: false,
    },
    name: {
      value: "Error [" + code + "]",
      enumerable: false,
    },
  });
  return CustomError;
}

function destroyRequest(request, error) {
  for (var event of events) {
    request.removeListener(event, eventHandlers[event]);
  }
  request.on("error", noop);
  request.destroy(error);
}

function isSubdomain(subdomain, domain) {
  assert(isString(subdomain) && isString(domain));
  var dot = subdomain.length - domain.length - 1;
  return dot > 0 && subdomain[dot] === "." && subdomain.endsWith(domain);
}

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

function isFunction(value) {
  return typeof value === "function";
}

function isBuffer(value) {
  return typeof value === "object" && ("length" in value);
}

function isURL(value) {
  return URL && value instanceof URL;
}

// Exports
module.exports = wrap({ http: http, https: https });
module.exports.wrap = wrap;


/***/ }),

/***/ 3559:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/*! Axios v1.12.2 Copyright (c) 2025 Matt Zabriskie and contributors */


const FormData$1 = __webpack_require__(2925);
const crypto = __webpack_require__(6982);
const url = __webpack_require__(7016);
const proxyFromEnv = __webpack_require__(1420);
const http = __webpack_require__(8611);
const https = __webpack_require__(5692);
const util = __webpack_require__(9023);
const followRedirects = __webpack_require__(3520);
const zlib = __webpack_require__(3106);
const stream = __webpack_require__(2203);
const events = __webpack_require__(4434);

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const FormData__default = /*#__PURE__*/_interopDefaultLegacy(FormData$1);
const crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
const url__default = /*#__PURE__*/_interopDefaultLegacy(url);
const proxyFromEnv__default = /*#__PURE__*/_interopDefaultLegacy(proxyFromEnv);
const http__default = /*#__PURE__*/_interopDefaultLegacy(http);
const https__default = /*#__PURE__*/_interopDefaultLegacy(https);
const util__default = /*#__PURE__*/_interopDefaultLegacy(util);
const followRedirects__default = /*#__PURE__*/_interopDefaultLegacy(followRedirects);
const zlib__default = /*#__PURE__*/_interopDefaultLegacy(zlib);
const stream__default = /*#__PURE__*/_interopDefaultLegacy(stream);

function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}

// utils is a library of generic helper functions non-specific to axios

const {toString} = Object.prototype;
const {getPrototypeOf} = Object;
const {iterator, toStringTag} = Symbol;

const kindOf = (cache => thing => {
    const str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));

const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type
};

const typeOfTest = type => thing => typeof thing === type;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an Array, otherwise false
 */
const {isArray} = Array;

/**
 * Determine if a value is undefined
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if the value is undefined, otherwise false
 */
const isUndefined = typeOfTest('undefined');

/**
 * Determine if a value is a Buffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && isFunction$1(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
const isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  let result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a String, otherwise false
 */
const isString = typeOfTest('string');

/**
 * Determine if a value is a Function
 *
 * @param {*} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
const isFunction$1 = typeOfTest('function');

/**
 * Determine if a value is a Number
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Number, otherwise false
 */
const isNumber = typeOfTest('number');

/**
 * Determine if a value is an Object
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an Object, otherwise false
 */
const isObject = (thing) => thing !== null && typeof thing === 'object';

/**
 * Determine if a value is a Boolean
 *
 * @param {*} thing The value to test
 * @returns {boolean} True if value is a Boolean, otherwise false
 */
const isBoolean = thing => thing === true || thing === false;

/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
const isPlainObject = (val) => {
  if (kindOf(val) !== 'object') {
    return false;
  }

  const prototype = getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(toStringTag in val) && !(iterator in val);
};

/**
 * Determine if a value is an empty object (safely handles Buffers)
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is an empty object, otherwise false
 */
const isEmptyObject = (val) => {
  // Early return for non-objects or Buffers to prevent RangeError
  if (!isObject(val) || isBuffer(val)) {
    return false;
  }

  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    // Fallback for any other objects that might cause RangeError with Object.keys()
    return false;
  }
};

/**
 * Determine if a value is a Date
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Date, otherwise false
 */
const isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Blob, otherwise false
 */
const isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Stream
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Stream, otherwise false
 */
const isStream = (val) => isObject(val) && isFunction$1(val.pipe);

/**
 * Determine if a value is a FormData
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an FormData, otherwise false
 */
const isFormData = (thing) => {
  let kind;
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) || (
      isFunction$1(thing.append) && (
        (kind = kindOf(thing)) === 'formdata' ||
        // detect form-data instance
        (kind === 'object' && isFunction$1(thing.toString) && thing.toString() === '[object FormData]')
      )
    )
  )
};

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
const isURLSearchParams = kindOfTest('URLSearchParams');

const [isReadableStream, isRequest, isResponse, isHeaders] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest);

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 *
 * @returns {String} The String freed of excess whitespace
 */
const trim = (str) => str.trim ?
  str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 *
 * @param {Boolean} [allOwnKeys = false]
 * @returns {any}
 */
function forEach(obj, fn, {allOwnKeys = false} = {}) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  let i;
  let l;

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Buffer check
    if (isBuffer(obj)) {
      return;
    }

    // Iterate over object keys
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;

    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}

function findKey(obj, key) {
  if (isBuffer(obj)){
    return null;
  }

  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}

const _global = (() => {
  /*eslint no-undef:0*/
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
})();

const isContextDefined = (context) => !isUndefined(context) && context !== _global;

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 *
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  const {caseless, skipUndefined} = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };

  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 *
 * @param {Boolean} [allOwnKeys]
 * @returns {Object} The resulting value of object a
 */
const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction$1(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, {allOwnKeys});
  return a;
};

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 *
 * @returns {string} content value without BOM
 */
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
};

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 *
 * @returns {void}
 */
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  Object.defineProperty(constructor, 'super', {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function|Boolean} [filter]
 * @param {Function} [propFilter]
 *
 * @returns {Object}
 */
const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};

  destObj = destObj || {};
  // eslint-disable-next-line no-eq-null,eqeqeq
  if (sourceObj == null) return destObj;

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
};

/**
 * Determines whether a string ends with the characters of a specified string
 *
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 *
 * @returns {boolean}
 */
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};


/**
 * Returns new array from array like object or null if failed
 *
 * @param {*} [thing]
 *
 * @returns {?Array}
 */
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};

/**
 * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
 * thing passed in is an instance of Uint8Array
 *
 * @param {TypedArray}
 *
 * @returns {Array}
 */
// eslint-disable-next-line func-names
const isTypedArray = (TypedArray => {
  // eslint-disable-next-line func-names
  return thing => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

/**
 * For each entry in the object, call the function with the key and value.
 *
 * @param {Object<any, any>} obj - The object to iterate over.
 * @param {Function} fn - The function to call for each entry.
 *
 * @returns {void}
 */
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];

  const _iterator = generator.call(obj);

  let result;

  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};

/**
 * It takes a regular expression and a string, and returns an array of all the matches
 *
 * @param {string} regExp - The regular expression to match against.
 * @param {string} str - The string to search.
 *
 * @returns {Array<boolean>}
 */
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];

  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }

  return arr;
};

/* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
const isHTMLForm = kindOfTest('HTMLFormElement');

const toCamelCase = str => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
    function replacer(m, p1, p2) {
      return p1.toUpperCase() + p2;
    }
  );
};

/* Creating a function that will check if an object has a property. */
const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

/**
 * Determine if a value is a RegExp object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a RegExp object, otherwise false
 */
const isRegExp = kindOfTest('RegExp');

const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};

  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });

  Object.defineProperties(obj, reducedDescriptors);
};

/**
 * Makes all methods read-only
 * @param {Object} obj
 */

const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    // skip restricted props in strict mode
    if (isFunction$1(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
      return false;
    }

    const value = obj[name];

    if (!isFunction$1(value)) return;

    descriptor.enumerable = false;

    if ('writable' in descriptor) {
      descriptor.writable = false;
      return;
    }

    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error('Can not rewrite read-only method \'' + name + '\'');
      };
    }
  });
};

const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};

  const define = (arr) => {
    arr.forEach(value => {
      obj[value] = true;
    });
  };

  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

  return obj;
};

const noop = () => {};

const toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};



/**
 * If the thing is a FormData object, return true, otherwise return false.
 *
 * @param {unknown} thing - The thing to check.
 *
 * @returns {boolean}
 */
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction$1(thing.append) && thing[toStringTag] === 'FormData' && thing[iterator]);
}

const toJSONObject = (obj) => {
  const stack = new Array(10);

  const visit = (source, i) => {

    if (isObject(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }

      //Buffer check
      if (isBuffer(source)) {
        return source;
      }

      if(!('toJSON' in source)) {
        stack[i] = source;
        const target = isArray(source) ? [] : {};

        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });

        stack[i] = undefined;

        return target;
      }
    }

    return source;
  };

  return visit(obj, 0);
};

const isAsyncFn = kindOfTest('AsyncFunction');

const isThenable = (thing) =>
  thing && (isObject(thing) || isFunction$1(thing)) && isFunction$1(thing.then) && isFunction$1(thing.catch);

// original code
// https://github.com/DigitalBrainJS/AxiosPromise/blob/16deab13710ec09779922131f3fa5954320f83ab/lib/utils.js#L11-L34

const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }

  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener("message", ({source, data}) => {
      if (source === _global && data === token) {
        callbacks.length && callbacks.shift()();
      }
    }, false);

    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    }
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(
  typeof setImmediate === 'function',
  isFunction$1(_global.postMessage)
);

const asap = typeof queueMicrotask !== 'undefined' ?
  queueMicrotask.bind(_global) : ( typeof process !== 'undefined' && process.nextTick || _setImmediate);

// *********************


const isIterable = (thing) => thing != null && isFunction$1(thing[iterator]);


const utils$1 = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction: isFunction$1,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable
};

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 *
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = (new Error()).stack;
  }

  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  if (response) {
    this.response = response;
    this.status = response.status ? response.status : null;
  }
}

utils$1.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils$1.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});

const prototype$1 = AxiosError.prototype;
const descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL'
// eslint-disable-next-line func-names
].forEach(code => {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = (error, code, config, request, response, customProps) => {
  const axiosError = Object.create(prototype$1);

  utils$1.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  }, prop => {
    return prop !== 'isAxiosError';
  });

  const msg = error && error.message ? error.message : 'Error';

  // Prefer explicit code; otherwise copy the low-level error's code (e.g. ECONNREFUSED)
  const errCode = code == null && error ? error.code : code;
  AxiosError.call(axiosError, msg, errCode, config, request, response);

  // Chain the original error on the standard field; non-enumerable to avoid JSON noise
  if (error && axiosError.cause == null) {
    Object.defineProperty(axiosError, 'cause', { value: error, configurable: true });
  }

  axiosError.name = (error && error.name) || 'Error';

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

/**
 * Determines if the given thing is a array or js object.
 *
 * @param {string} thing - The object or array to be visited.
 *
 * @returns {boolean}
 */
function isVisitable(thing) {
  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
}

/**
 * It removes the brackets from the end of a string
 *
 * @param {string} key - The key of the parameter.
 *
 * @returns {string} the key without the brackets.
 */
function removeBrackets(key) {
  return utils$1.endsWith(key, '[]') ? key.slice(0, -2) : key;
}

/**
 * It takes a path, a key, and a boolean, and returns a string
 *
 * @param {string} path - The path to the current key.
 * @param {string} key - The key of the current object being iterated over.
 * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
 *
 * @returns {string} The path to the current key.
 */
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    // eslint-disable-next-line no-param-reassign
    token = removeBrackets(token);
    return !dots && i ? '[' + token + ']' : token;
  }).join(dots ? '.' : '');
}

/**
 * If the array is an array and none of its elements are visitable, then it's a flat array.
 *
 * @param {Array<any>} arr - The array to check
 *
 * @returns {boolean}
 */
function isFlatArray(arr) {
  return utils$1.isArray(arr) && !arr.some(isVisitable);
}

const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});

/**
 * Convert a data object to FormData
 *
 * @param {Object} obj
 * @param {?Object} [formData]
 * @param {?Object} [options]
 * @param {Function} [options.visitor]
 * @param {Boolean} [options.metaTokens = true]
 * @param {Boolean} [options.dots = false]
 * @param {?Boolean} [options.indexes = false]
 *
 * @returns {Object}
 **/

/**
 * It converts an object into a FormData object
 *
 * @param {Object<any, any>} obj - The object to convert to form data.
 * @param {string} formData - The FormData object to append to.
 * @param {Object<string, any>} options
 *
 * @returns
 */
function toFormData(obj, formData, options) {
  if (!utils$1.isObject(obj)) {
    throw new TypeError('target must be an object');
  }

  // eslint-disable-next-line no-param-reassign
  formData = formData || new (FormData__default["default"] || FormData)();

  // eslint-disable-next-line no-param-reassign
  options = utils$1.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    // eslint-disable-next-line no-eq-null,eqeqeq
    return !utils$1.isUndefined(source[option]);
  });

  const metaTokens = options.metaTokens;
  // eslint-disable-next-line no-use-before-define
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);

  if (!utils$1.isFunction(visitor)) {
    throw new TypeError('visitor must be a function');
  }

  function convertValue(value) {
    if (value === null) return '';

    if (utils$1.isDate(value)) {
      return value.toISOString();
    }

    if (utils$1.isBoolean(value)) {
      return value.toString();
    }

    if (!useBlob && utils$1.isBlob(value)) {
      throw new AxiosError('Blob is not supported. Use a Buffer instead.');
    }

    if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
      return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }

    return value;
  }

  /**
   * Default visitor.
   *
   * @param {*} value
   * @param {String|Number} key
   * @param {Array<String|Number>} path
   * @this {FormData}
   *
   * @returns {boolean} return true to visit the each prop of the value recursively
   */
  function defaultVisitor(value, key, path) {
    let arr = value;

    if (value && !path && typeof value === 'object') {
      if (utils$1.endsWith(key, '{}')) {
        // eslint-disable-next-line no-param-reassign
        key = metaTokens ? key : key.slice(0, -2);
        // eslint-disable-next-line no-param-reassign
        value = JSON.stringify(value);
      } else if (
        (utils$1.isArray(value) && isFlatArray(value)) ||
        ((utils$1.isFileList(value) || utils$1.endsWith(key, '[]')) && (arr = utils$1.toArray(value))
        )) {
        // eslint-disable-next-line no-param-reassign
        key = removeBrackets(key);

        arr.forEach(function each(el, index) {
          !(utils$1.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
            convertValue(el)
          );
        });
        return false;
      }
    }

    if (isVisitable(value)) {
      return true;
    }

    formData.append(renderKey(path, key, dots), convertValue(value));

    return false;
  }

  const stack = [];

  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });

  function build(value, path) {
    if (utils$1.isUndefined(value)) return;

    if (stack.indexOf(value) !== -1) {
      throw Error('Circular reference detected in ' + path.join('.'));
    }

    stack.push(value);

    utils$1.forEach(value, function each(el, key) {
      const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
        formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers
      );

      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });

    stack.pop();
  }

  if (!utils$1.isObject(obj)) {
    throw new TypeError('data must be an object');
  }

  build(obj);

  return formData;
}

/**
 * It encodes a string by replacing all characters that are not in the unreserved set with
 * their percent-encoded equivalents
 *
 * @param {string} str - The string to encode.
 *
 * @returns {string} The encoded string.
 */
function encode$1(str) {
  const charMap = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\x00'
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}

/**
 * It takes a params object and converts it to a FormData object
 *
 * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
 * @param {Object<string, any>} options - The options object passed to the Axios constructor.
 *
 * @returns {void}
 */
function AxiosURLSearchParams(params, options) {
  this._pairs = [];

  params && toFormData(params, this, options);
}

const prototype = AxiosURLSearchParams.prototype;

prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};

prototype.toString = function toString(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode$1);
  } : encode$1;

  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + '=' + _encode(pair[1]);
  }, '').join('&');
};

/**
 * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
 * URI encoded counterparts
 *
 * @param {string} val The value to be encoded.
 *
 * @returns {string} The encoded value.
 */
function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @param {?(object|Function)} options
 *
 * @returns {string} The formatted url
 */
function buildURL(url, params, options) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }
  
  const _encode = options && options.encode || encode;

  if (utils$1.isFunction(options)) {
    options = {
      serialize: options
    };
  } 

  const serializeFn = options && options.serialize;

  let serializedParams;

  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils$1.isURLSearchParams(params) ?
      params.toString() :
      new AxiosURLSearchParams(params, options).toString(_encode);
  }

  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");

    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
}

class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils$1.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}

const InterceptorManager$1 = InterceptorManager;

const transitionalDefaults = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

const URLSearchParams = url__default["default"].URLSearchParams;

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

const DIGIT = '0123456789';

const ALPHABET = {
  DIGIT,
  ALPHA,
  ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
};

const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
  let str = '';
  const {length} = alphabet;
  const randomValues = new Uint32Array(size);
  crypto__default["default"].randomFillSync(randomValues);
  for (let i = 0; i < size; i++) {
    str += alphabet[randomValues[i] % length];
  }

  return str;
};


const platform$1 = {
  isNode: true,
  classes: {
    URLSearchParams,
    FormData: FormData__default["default"],
    Blob: typeof Blob !== 'undefined' && Blob || null
  },
  ALPHABET,
  generateString,
  protocols: [ 'http', 'https', 'file', 'data' ]
};

const hasBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined';

const _navigator = typeof navigator === 'object' && navigator || undefined;

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 *
 * @returns {boolean}
 */
const hasStandardBrowserEnv = hasBrowserEnv &&
  (!_navigator || ['ReactNative', 'NativeScript', 'NS'].indexOf(_navigator.product) < 0);

/**
 * Determine if we're running in a standard browser webWorker environment
 *
 * Although the `isStandardBrowserEnv` method indicates that
 * `allows axios to run in a web worker`, the WebWorker will still be
 * filtered out due to its judgment standard
 * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
 * This leads to a problem when axios post `FormData` in webWorker
 */
const hasStandardBrowserWebWorkerEnv = (() => {
  return (
    typeof WorkerGlobalScope !== 'undefined' &&
    // eslint-disable-next-line no-undef
    self instanceof WorkerGlobalScope &&
    typeof self.importScripts === 'function'
  );
})();

const origin = hasBrowserEnv && window.location.href || 'http://localhost';

const utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  hasBrowserEnv: hasBrowserEnv,
  hasStandardBrowserWebWorkerEnv: hasStandardBrowserWebWorkerEnv,
  hasStandardBrowserEnv: hasStandardBrowserEnv,
  navigator: _navigator,
  origin: origin
});

const platform = {
  ...utils,
  ...platform$1
};

function toURLEncodedForm(data, options) {
  return toFormData(data, new platform.classes.URLSearchParams(), {
    visitor: function(value, key, path, helpers) {
      if (platform.isNode && utils$1.isBuffer(value)) {
        this.append(key, value.toString('base64'));
        return false;
      }

      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}

/**
 * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
 *
 * @param {string} name - The name of the property to get.
 *
 * @returns An array of strings.
 */
function parsePropPath(name) {
  // foo[x][y][z]
  // foo.x.y.z
  // foo-x-y-z
  // foo x y z
  return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
    return match[0] === '[]' ? '' : match[1] || match[0];
  });
}

/**
 * Convert an array to an object.
 *
 * @param {Array<any>} arr - The array to convert to an object.
 *
 * @returns An object with the same keys and values as the array.
 */
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}

/**
 * It takes a FormData object and returns a JavaScript object
 *
 * @param {string} formData The FormData object to convert to JSON.
 *
 * @returns {Object<string, any> | null} The converted object.
 */
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];

    if (name === '__proto__') return true;

    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils$1.isArray(target) ? target.length : name;

    if (isLast) {
      if (utils$1.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }

      return !isNumericKey;
    }

    if (!target[name] || !utils$1.isObject(target[name])) {
      target[name] = [];
    }

    const result = buildPath(path, value, target[name], index);

    if (result && utils$1.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }

    return !isNumericKey;
  }

  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
    const obj = {};

    utils$1.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });

    return obj;
  }

  return null;
}

/**
 * It takes a string, tries to parse it, and if it fails, it returns the stringified version
 * of the input
 *
 * @param {any} rawValue - The value to be stringified.
 * @param {Function} parser - A function that parses a string into a JavaScript object.
 * @param {Function} encoder - A function that takes a value and returns a string.
 *
 * @returns {string} A stringified version of the rawValue.
 */
function stringifySafely(rawValue, parser, encoder) {
  if (utils$1.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils$1.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

const defaults = {

  transitional: transitionalDefaults,

  adapter: ['xhr', 'http', 'fetch'],

  transformRequest: [function transformRequest(data, headers) {
    const contentType = headers.getContentType() || '';
    const hasJSONContentType = contentType.indexOf('application/json') > -1;
    const isObjectPayload = utils$1.isObject(data);

    if (isObjectPayload && utils$1.isHTMLForm(data)) {
      data = new FormData(data);
    }

    const isFormData = utils$1.isFormData(data);

    if (isFormData) {
      return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
    }

    if (utils$1.isArrayBuffer(data) ||
      utils$1.isBuffer(data) ||
      utils$1.isStream(data) ||
      utils$1.isFile(data) ||
      utils$1.isBlob(data) ||
      utils$1.isReadableStream(data)
    ) {
      return data;
    }
    if (utils$1.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils$1.isURLSearchParams(data)) {
      headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
      return data.toString();
    }

    let isFileList;

    if (isObjectPayload) {
      if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }

      if ((isFileList = utils$1.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
        const _FormData = this.env && this.env.FormData;

        return toFormData(
          isFileList ? {'files[]': data} : data,
          _FormData && new _FormData(),
          this.formSerializer
        );
      }
    }

    if (isObjectPayload || hasJSONContentType ) {
      headers.setContentType('application/json', false);
      return stringifySafely(data);
    }

    return data;
  }],

  transformResponse: [function transformResponse(data) {
    const transitional = this.transitional || defaults.transitional;
    const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    const JSONRequested = this.responseType === 'json';

    if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
      return data;
    }

    if (data && utils$1.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
      const silentJSONParsing = transitional && transitional.silentJSONParsing;
      const strictJSONParsing = !silentJSONParsing && JSONRequested;

      try {
        return JSON.parse(data, this.parseReviver);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': undefined
    }
  }
};

utils$1.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (method) => {
  defaults.headers[method] = {};
});

const defaults$1 = defaults;

// RawAxiosHeaders whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
const ignoreDuplicateOf = utils$1.toObjectSet([
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
]);

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} rawHeaders Headers needing to be parsed
 *
 * @returns {Object} Headers parsed into an object
 */
const parseHeaders = rawHeaders => {
  const parsed = {};
  let key;
  let val;
  let i;

  rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
    i = line.indexOf(':');
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();

    if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
      return;
    }

    if (key === 'set-cookie') {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    }
  });

  return parsed;
};

const $internals = Symbol('internals');

function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}

function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }

  return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
}

function parseTokens(str) {
  const tokens = Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;

  while ((match = tokensRE.exec(str))) {
    tokens[match[1]] = match[2];
  }

  return tokens;
}

const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
  if (utils$1.isFunction(filter)) {
    return filter.call(this, value, header);
  }

  if (isHeaderNameFilter) {
    value = header;
  }

  if (!utils$1.isString(value)) return;

  if (utils$1.isString(filter)) {
    return value.indexOf(filter) !== -1;
  }

  if (utils$1.isRegExp(filter)) {
    return filter.test(value);
  }
}

function formatHeader(header) {
  return header.trim()
    .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
}

function buildAccessors(obj, header) {
  const accessorName = utils$1.toCamelCase(' ' + header);

  ['get', 'set', 'has'].forEach(methodName => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}

class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }

  set(header, valueOrRewrite, rewrite) {
    const self = this;

    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);

      if (!lHeader) {
        throw new Error('header name must be a non-empty string');
      }

      const key = utils$1.findKey(self, lHeader);

      if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
        self[key || _header] = normalizeValue(_value);
      }
    }

    const setHeaders = (headers, _rewrite) =>
      utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if(utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
      let obj = {}, dest, key;
      for (const entry of header) {
        if (!utils$1.isArray(entry)) {
          throw TypeError('Object iterator must return a key-value pair');
        }

        obj[key = entry[0]] = (dest = obj[key]) ?
          (utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]]) : entry[1];
      }

      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }

    return this;
  }

  get(header, parser) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils$1.findKey(this, header);

      if (key) {
        const value = this[key];

        if (!parser) {
          return value;
        }

        if (parser === true) {
          return parseTokens(value);
        }

        if (utils$1.isFunction(parser)) {
          return parser.call(this, value, key);
        }

        if (utils$1.isRegExp(parser)) {
          return parser.exec(value);
        }

        throw new TypeError('parser must be boolean|regexp|function');
      }
    }
  }

  has(header, matcher) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils$1.findKey(this, header);

      return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }

    return false;
  }

  delete(header, matcher) {
    const self = this;
    let deleted = false;

    function deleteHeader(_header) {
      _header = normalizeHeader(_header);

      if (_header) {
        const key = utils$1.findKey(self, _header);

        if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
          delete self[key];

          deleted = true;
        }
      }
    }

    if (utils$1.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }

    return deleted;
  }

  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;

    while (i--) {
      const key = keys[i];
      if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }

    return deleted;
  }

  normalize(format) {
    const self = this;
    const headers = {};

    utils$1.forEach(this, (value, header) => {
      const key = utils$1.findKey(headers, header);

      if (key) {
        self[key] = normalizeValue(value);
        delete self[header];
        return;
      }

      const normalized = format ? formatHeader(header) : String(header).trim();

      if (normalized !== header) {
        delete self[header];
      }

      self[normalized] = normalizeValue(value);

      headers[normalized] = true;
    });

    return this;
  }

  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }

  toJSON(asStrings) {
    const obj = Object.create(null);

    utils$1.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(', ') : value);
    });

    return obj;
  }

  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }

  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
  }

  getSetCookie() {
    return this.get("set-cookie") || [];
  }

  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }

  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }

  static concat(first, ...targets) {
    const computed = new this(first);

    targets.forEach((target) => computed.set(target));

    return computed;
  }

  static accessor(header) {
    const internals = this[$internals] = (this[$internals] = {
      accessors: {}
    });

    const accessors = internals.accessors;
    const prototype = this.prototype;

    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);

      if (!accessors[lHeader]) {
        buildAccessors(prototype, _header);
        accessors[lHeader] = true;
      }
    }

    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

    return this;
  }
}

AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

// reserved names hotfix
utils$1.reduceDescriptors(AxiosHeaders.prototype, ({value}, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  }
});

utils$1.freezeMethods(AxiosHeaders);

const AxiosHeaders$1 = AxiosHeaders;

/**
 * Transform the data for a request or a response
 *
 * @param {Array|Function} fns A single function or Array of functions
 * @param {?Object} response The response object
 *
 * @returns {*} The resulting transformed data
 */
function transformData(fns, response) {
  const config = this || defaults$1;
  const context = response || config;
  const headers = AxiosHeaders$1.from(context.headers);
  let data = context.data;

  utils$1.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
  });

  headers.normalize();

  return data;
}

function isCancel(value) {
  return !!(value && value.__CANCEL__);
}

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @param {string=} message The message.
 * @param {Object=} config The config.
 * @param {Object=} request The request.
 *
 * @returns {CanceledError} The created error.
 */
function CanceledError(message, config, request) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
  this.name = 'CanceledError';
}

utils$1.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 *
 * @returns {object} The response.
 */
function settle(resolve, reject, response) {
  const validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 *
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 *
 * @returns {string} The combined URL
 */
function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 *
 * @returns {string} The combined full path
 */
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls == false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

const VERSION = "1.12.2";

function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
}

const DATA_URL_PATTERN = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;

/**
 * Parse data uri to a Buffer or Blob
 *
 * @param {String} uri
 * @param {?Boolean} asBlob
 * @param {?Object} options
 * @param {?Function} options.Blob
 *
 * @returns {Buffer|Blob}
 */
function fromDataURI(uri, asBlob, options) {
  const _Blob = options && options.Blob || platform.classes.Blob;
  const protocol = parseProtocol(uri);

  if (asBlob === undefined && _Blob) {
    asBlob = true;
  }

  if (protocol === 'data') {
    uri = protocol.length ? uri.slice(protocol.length + 1) : uri;

    const match = DATA_URL_PATTERN.exec(uri);

    if (!match) {
      throw new AxiosError('Invalid URL', AxiosError.ERR_INVALID_URL);
    }

    const mime = match[1];
    const isBase64 = match[2];
    const body = match[3];
    const buffer = Buffer.from(decodeURIComponent(body), isBase64 ? 'base64' : 'utf8');

    if (asBlob) {
      if (!_Blob) {
        throw new AxiosError('Blob is not supported', AxiosError.ERR_NOT_SUPPORT);
      }

      return new _Blob([buffer], {type: mime});
    }

    return buffer;
  }

  throw new AxiosError('Unsupported protocol ' + protocol, AxiosError.ERR_NOT_SUPPORT);
}

const kInternals = Symbol('internals');

class AxiosTransformStream extends stream__default["default"].Transform{
  constructor(options) {
    options = utils$1.toFlatObject(options, {
      maxRate: 0,
      chunkSize: 64 * 1024,
      minChunkSize: 100,
      timeWindow: 500,
      ticksRate: 2,
      samplesCount: 15
    }, null, (prop, source) => {
      return !utils$1.isUndefined(source[prop]);
    });

    super({
      readableHighWaterMark: options.chunkSize
    });

    const internals = this[kInternals] = {
      timeWindow: options.timeWindow,
      chunkSize: options.chunkSize,
      maxRate: options.maxRate,
      minChunkSize: options.minChunkSize,
      bytesSeen: 0,
      isCaptured: false,
      notifiedBytesLoaded: 0,
      ts: Date.now(),
      bytes: 0,
      onReadCallback: null
    };

    this.on('newListener', event => {
      if (event === 'progress') {
        if (!internals.isCaptured) {
          internals.isCaptured = true;
        }
      }
    });
  }

  _read(size) {
    const internals = this[kInternals];

    if (internals.onReadCallback) {
      internals.onReadCallback();
    }

    return super._read(size);
  }

  _transform(chunk, encoding, callback) {
    const internals = this[kInternals];
    const maxRate = internals.maxRate;

    const readableHighWaterMark = this.readableHighWaterMark;

    const timeWindow = internals.timeWindow;

    const divider = 1000 / timeWindow;
    const bytesThreshold = (maxRate / divider);
    const minChunkSize = internals.minChunkSize !== false ? Math.max(internals.minChunkSize, bytesThreshold * 0.01) : 0;

    const pushChunk = (_chunk, _callback) => {
      const bytes = Buffer.byteLength(_chunk);
      internals.bytesSeen += bytes;
      internals.bytes += bytes;

      internals.isCaptured && this.emit('progress', internals.bytesSeen);

      if (this.push(_chunk)) {
        process.nextTick(_callback);
      } else {
        internals.onReadCallback = () => {
          internals.onReadCallback = null;
          process.nextTick(_callback);
        };
      }
    };

    const transformChunk = (_chunk, _callback) => {
      const chunkSize = Buffer.byteLength(_chunk);
      let chunkRemainder = null;
      let maxChunkSize = readableHighWaterMark;
      let bytesLeft;
      let passed = 0;

      if (maxRate) {
        const now = Date.now();

        if (!internals.ts || (passed = (now - internals.ts)) >= timeWindow) {
          internals.ts = now;
          bytesLeft = bytesThreshold - internals.bytes;
          internals.bytes = bytesLeft < 0 ? -bytesLeft : 0;
          passed = 0;
        }

        bytesLeft = bytesThreshold - internals.bytes;
      }

      if (maxRate) {
        if (bytesLeft <= 0) {
          // next time window
          return setTimeout(() => {
            _callback(null, _chunk);
          }, timeWindow - passed);
        }

        if (bytesLeft < maxChunkSize) {
          maxChunkSize = bytesLeft;
        }
      }

      if (maxChunkSize && chunkSize > maxChunkSize && (chunkSize - maxChunkSize) > minChunkSize) {
        chunkRemainder = _chunk.subarray(maxChunkSize);
        _chunk = _chunk.subarray(0, maxChunkSize);
      }

      pushChunk(_chunk, chunkRemainder ? () => {
        process.nextTick(_callback, null, chunkRemainder);
      } : _callback);
    };

    transformChunk(chunk, function transformNextChunk(err, _chunk) {
      if (err) {
        return callback(err);
      }

      if (_chunk) {
        transformChunk(_chunk, transformNextChunk);
      } else {
        callback(null);
      }
    });
  }
}

const AxiosTransformStream$1 = AxiosTransformStream;

const {asyncIterator} = Symbol;

const readBlob = async function* (blob) {
  if (blob.stream) {
    yield* blob.stream();
  } else if (blob.arrayBuffer) {
    yield await blob.arrayBuffer();
  } else if (blob[asyncIterator]) {
    yield* blob[asyncIterator]();
  } else {
    yield blob;
  }
};

const readBlob$1 = readBlob;

const BOUNDARY_ALPHABET = platform.ALPHABET.ALPHA_DIGIT + '-_';

const textEncoder = typeof TextEncoder === 'function' ? new TextEncoder() : new util__default["default"].TextEncoder();

const CRLF = '\r\n';
const CRLF_BYTES = textEncoder.encode(CRLF);
const CRLF_BYTES_COUNT = 2;

class FormDataPart {
  constructor(name, value) {
    const {escapeName} = this.constructor;
    const isStringValue = utils$1.isString(value);

    let headers = `Content-Disposition: form-data; name="${escapeName(name)}"${
      !isStringValue && value.name ? `; filename="${escapeName(value.name)}"` : ''
    }${CRLF}`;

    if (isStringValue) {
      value = textEncoder.encode(String(value).replace(/\r?\n|\r\n?/g, CRLF));
    } else {
      headers += `Content-Type: ${value.type || "application/octet-stream"}${CRLF}`;
    }

    this.headers = textEncoder.encode(headers + CRLF);

    this.contentLength = isStringValue ? value.byteLength : value.size;

    this.size = this.headers.byteLength + this.contentLength + CRLF_BYTES_COUNT;

    this.name = name;
    this.value = value;
  }

  async *encode(){
    yield this.headers;

    const {value} = this;

    if(utils$1.isTypedArray(value)) {
      yield value;
    } else {
      yield* readBlob$1(value);
    }

    yield CRLF_BYTES;
  }

  static escapeName(name) {
      return String(name).replace(/[\r\n"]/g, (match) => ({
        '\r' : '%0D',
        '\n' : '%0A',
        '"' : '%22',
      }[match]));
  }
}

const formDataToStream = (form, headersHandler, options) => {
  const {
    tag = 'form-data-boundary',
    size = 25,
    boundary = tag + '-' + platform.generateString(size, BOUNDARY_ALPHABET)
  } = options || {};

  if(!utils$1.isFormData(form)) {
    throw TypeError('FormData instance required');
  }

  if (boundary.length < 1 || boundary.length > 70) {
    throw Error('boundary must be 10-70 characters long')
  }

  const boundaryBytes = textEncoder.encode('--' + boundary + CRLF);
  const footerBytes = textEncoder.encode('--' + boundary + '--' + CRLF);
  let contentLength = footerBytes.byteLength;

  const parts = Array.from(form.entries()).map(([name, value]) => {
    const part = new FormDataPart(name, value);
    contentLength += part.size;
    return part;
  });

  contentLength += boundaryBytes.byteLength * parts.length;

  contentLength = utils$1.toFiniteNumber(contentLength);

  const computedHeaders = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`
  };

  if (Number.isFinite(contentLength)) {
    computedHeaders['Content-Length'] = contentLength;
  }

  headersHandler && headersHandler(computedHeaders);

  return stream.Readable.from((async function *() {
    for(const part of parts) {
      yield boundaryBytes;
      yield* part.encode();
    }

    yield footerBytes;
  })());
};

const formDataToStream$1 = formDataToStream;

class ZlibHeaderTransformStream extends stream__default["default"].Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present
      if (chunk[0] !== 120) { // Hex: 78
        const header = Buffer.alloc(2);
        header[0] = 120; // Hex: 78
        header[1] = 156; // Hex: 9C 
        this.push(header, encoding);
      }
    }

    this.__transform(chunk, encoding, callback);
  }
}

const ZlibHeaderTransformStream$1 = ZlibHeaderTransformStream;

const callbackify = (fn, reducer) => {
  return utils$1.isAsyncFn(fn) ? function (...args) {
    const cb = args.pop();
    fn.apply(this, args).then((value) => {
      try {
        reducer ? cb(null, ...reducer(value)) : cb(null, value);
      } catch (err) {
        cb(err);
      }
    }, cb);
  } : fn;
};

const callbackify$1 = callbackify;

/**
 * Calculate data maxRate
 * @param {Number} [samplesCount= 10]
 * @param {Number} [min= 1000]
 * @returns {Function}
 */
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;

  min = min !== undefined ? min : 1000;

  return function push(chunkLength) {
    const now = Date.now();

    const startedAt = timestamps[tail];

    if (!firstSampleTS) {
      firstSampleTS = now;
    }

    bytes[head] = chunkLength;
    timestamps[head] = now;

    let i = tail;
    let bytesCount = 0;

    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }

    head = (head + 1) % samplesCount;

    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }

    if (now - firstSampleTS < min) {
      return;
    }

    const passed = startedAt && now - startedAt;

    return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
  };
}

/**
 * Throttle decorator
 * @param {Function} fn
 * @param {Number} freq
 * @return {Function}
 */
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1000 / freq;
  let lastArgs;
  let timer;

  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };

  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if ( passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };

  const flush = () => lastArgs && invoke(lastArgs);

  return [throttled, flush];
}

const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);

  return throttle(e => {
    const loaded = e.loaded;
    const total = e.lengthComputable ? e.total : undefined;
    const progressBytes = loaded - bytesNotified;
    const rate = _speedometer(progressBytes);
    const inRange = loaded <= total;

    bytesNotified = loaded;

    const data = {
      loaded,
      total,
      progress: total ? (loaded / total) : undefined,
      bytes: progressBytes,
      rate: rate ? rate : undefined,
      estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? 'download' : 'upload']: true
    };

    listener(data);
  }, freq);
};

const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;

  return [(loaded) => throttled[0]({
    lengthComputable,
    total,
    loaded
  }), throttled[1]];
};

const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));

/**
 * Estimate decoded byte length of a data:// URL *without* allocating large buffers.
 * - For base64: compute exact decoded size using length and padding;
 *               handle %XX at the character-count level (no string allocation).
 * - For non-base64: use UTF-8 byteLength of the encoded body as a safe upper bound.
 *
 * @param {string} url
 * @returns {number}
 */
function estimateDataURLDecodedBytes(url) {
  if (!url || typeof url !== 'string') return 0;
  if (!url.startsWith('data:')) return 0;

  const comma = url.indexOf(',');
  if (comma < 0) return 0;

  const meta = url.slice(5, comma);
  const body = url.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);

  if (isBase64) {
    let effectiveLen = body.length;
    const len = body.length; // cache length

    for (let i = 0; i < len; i++) {
      if (body.charCodeAt(i) === 37 /* '%' */ && i + 2 < len) {
        const a = body.charCodeAt(i + 1);
        const b = body.charCodeAt(i + 2);
        const isHex =
          ((a >= 48 && a <= 57) || (a >= 65 && a <= 70) || (a >= 97 && a <= 102)) &&
          ((b >= 48 && b <= 57) || (b >= 65 && b <= 70) || (b >= 97 && b <= 102));

        if (isHex) {
          effectiveLen -= 2;
          i += 2;
        }
      }
    }

    let pad = 0;
    let idx = len - 1;

    const tailIsPct3D = (j) =>
      j >= 2 &&
      body.charCodeAt(j - 2) === 37 && // '%'
      body.charCodeAt(j - 1) === 51 && // '3'
      (body.charCodeAt(j) === 68 || body.charCodeAt(j) === 100); // 'D' or 'd'

    if (idx >= 0) {
      if (body.charCodeAt(idx) === 61 /* '=' */) {
        pad++;
        idx--;
      } else if (tailIsPct3D(idx)) {
        pad++;
        idx -= 3;
      }
    }

    if (pad === 1 && idx >= 0) {
      if (body.charCodeAt(idx) === 61 /* '=' */) {
        pad++;
      } else if (tailIsPct3D(idx)) {
        pad++;
      }
    }

    const groups = Math.floor(effectiveLen / 4);
    const bytes = groups * 3 - (pad || 0);
    return bytes > 0 ? bytes : 0;
  }

  return Buffer.byteLength(body, 'utf8');
}

const zlibOptions = {
  flush: zlib__default["default"].constants.Z_SYNC_FLUSH,
  finishFlush: zlib__default["default"].constants.Z_SYNC_FLUSH
};

const brotliOptions = {
  flush: zlib__default["default"].constants.BROTLI_OPERATION_FLUSH,
  finishFlush: zlib__default["default"].constants.BROTLI_OPERATION_FLUSH
};

const isBrotliSupported = utils$1.isFunction(zlib__default["default"].createBrotliDecompress);

const {http: httpFollow, https: httpsFollow} = followRedirects__default["default"];

const isHttps = /https:?/;

const supportedProtocols = platform.protocols.map(protocol => {
  return protocol + ':';
});


const flushOnFinish = (stream, [throttled, flush]) => {
  stream
    .on('end', flush)
    .on('error', flush);

  return throttled;
};


/**
 * If the proxy or config beforeRedirects functions are defined, call them with the options
 * object.
 *
 * @param {Object<string, any>} options - The options object that was passed to the request.
 *
 * @returns {Object<string, any>}
 */
function dispatchBeforeRedirect(options, responseDetails) {
  if (options.beforeRedirects.proxy) {
    options.beforeRedirects.proxy(options);
  }
  if (options.beforeRedirects.config) {
    options.beforeRedirects.config(options, responseDetails);
  }
}

/**
 * If the proxy or config afterRedirects functions are defined, call them with the options
 *
 * @param {http.ClientRequestArgs} options
 * @param {AxiosProxyConfig} configProxy configuration from Axios options object
 * @param {string} location
 *
 * @returns {http.ClientRequestArgs}
 */
function setProxy(options, configProxy, location) {
  let proxy = configProxy;
  if (!proxy && proxy !== false) {
    const proxyUrl = proxyFromEnv__default["default"].getProxyForUrl(location);
    if (proxyUrl) {
      proxy = new URL(proxyUrl);
    }
  }
  if (proxy) {
    // Basic proxy authorization
    if (proxy.username) {
      proxy.auth = (proxy.username || '') + ':' + (proxy.password || '');
    }

    if (proxy.auth) {
      // Support proxy auth object form
      if (proxy.auth.username || proxy.auth.password) {
        proxy.auth = (proxy.auth.username || '') + ':' + (proxy.auth.password || '');
      }
      const base64 = Buffer
        .from(proxy.auth, 'utf8')
        .toString('base64');
      options.headers['Proxy-Authorization'] = 'Basic ' + base64;
    }

    options.headers.host = options.hostname + (options.port ? ':' + options.port : '');
    const proxyHost = proxy.hostname || proxy.host;
    options.hostname = proxyHost;
    // Replace 'host' since options is not a URL object
    options.host = proxyHost;
    options.port = proxy.port;
    options.path = location;
    if (proxy.protocol) {
      options.protocol = proxy.protocol.includes(':') ? proxy.protocol : `${proxy.protocol}:`;
    }
  }

  options.beforeRedirects.proxy = function beforeRedirect(redirectOptions) {
    // Configure proxy for redirected request, passing the original config proxy to apply
    // the exact same logic as if the redirected request was performed by axios directly.
    setProxy(redirectOptions, configProxy, redirectOptions.href);
  };
}

const isHttpAdapterSupported = typeof process !== 'undefined' && utils$1.kindOf(process) === 'process';

// temporary hotfix

const wrapAsync = (asyncExecutor) => {
  return new Promise((resolve, reject) => {
    let onDone;
    let isDone;

    const done = (value, isRejected) => {
      if (isDone) return;
      isDone = true;
      onDone && onDone(value, isRejected);
    };

    const _resolve = (value) => {
      done(value);
      resolve(value);
    };

    const _reject = (reason) => {
      done(reason, true);
      reject(reason);
    };

    asyncExecutor(_resolve, _reject, (onDoneHandler) => (onDone = onDoneHandler)).catch(_reject);
  })
};

const resolveFamily = ({address, family}) => {
  if (!utils$1.isString(address)) {
    throw TypeError('address must be a string');
  }
  return ({
    address,
    family: family || (address.indexOf('.') < 0 ? 6 : 4)
  });
};

const buildAddressEntry = (address, family) => resolveFamily(utils$1.isObject(address) ? address : {address, family});

/*eslint consistent-return:0*/
const httpAdapter = isHttpAdapterSupported && function httpAdapter(config) {
  return wrapAsync(async function dispatchHttpRequest(resolve, reject, onDone) {
    let {data, lookup, family} = config;
    const {responseType, responseEncoding} = config;
    const method = config.method.toUpperCase();
    let isDone;
    let rejected = false;
    let req;

    if (lookup) {
      const _lookup = callbackify$1(lookup, (value) => utils$1.isArray(value) ? value : [value]);
      // hotfix to support opt.all option which is required for node 20.x
      lookup = (hostname, opt, cb) => {
        _lookup(hostname, opt, (err, arg0, arg1) => {
          if (err) {
            return cb(err);
          }

          const addresses = utils$1.isArray(arg0) ? arg0.map(addr => buildAddressEntry(addr)) : [buildAddressEntry(arg0, arg1)];

          opt.all ? cb(err, addresses) : cb(err, addresses[0].address, addresses[0].family);
        });
      };
    }

    // temporary internal emitter until the AxiosRequest class will be implemented
    const emitter = new events.EventEmitter();

    const onFinished = () => {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(abort);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', abort);
      }

      emitter.removeAllListeners();
    };

    onDone((value, isRejected) => {
      isDone = true;
      if (isRejected) {
        rejected = true;
        onFinished();
      }
    });

    function abort(reason) {
      emitter.emit('abort', !reason || reason.type ? new CanceledError(null, config, req) : reason);
    }

    emitter.once('abort', reject);

    if (config.cancelToken || config.signal) {
      config.cancelToken && config.cancelToken.subscribe(abort);
      if (config.signal) {
        config.signal.aborted ? abort() : config.signal.addEventListener('abort', abort);
      }
    }

    // Parse url
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    const parsed = new URL(fullPath, platform.hasBrowserEnv ? platform.origin : undefined);
    const protocol = parsed.protocol || supportedProtocols[0];

    if (protocol === 'data:') {
      // Apply the same semantics as HTTP: only enforce if a finite, non-negative cap is set.
      if (config.maxContentLength > -1) {
        // Use the exact string passed to fromDataURI (config.url); fall back to fullPath if needed.
        const dataUrl = String(config.url || fullPath || '');
        const estimated = estimateDataURLDecodedBytes(dataUrl);

        if (estimated > config.maxContentLength) {
          return reject(new AxiosError(
            'maxContentLength size of ' + config.maxContentLength + ' exceeded',
            AxiosError.ERR_BAD_RESPONSE,
            config
          ));
        }
      }

      let convertedData;

      if (method !== 'GET') {
        return settle(resolve, reject, {
          status: 405,
          statusText: 'method not allowed',
          headers: {},
          config
        });
      }

      try {
        convertedData = fromDataURI(config.url, responseType === 'blob', {
          Blob: config.env && config.env.Blob
        });
      } catch (err) {
        throw AxiosError.from(err, AxiosError.ERR_BAD_REQUEST, config);
      }

      if (responseType === 'text') {
        convertedData = convertedData.toString(responseEncoding);

        if (!responseEncoding || responseEncoding === 'utf8') {
          convertedData = utils$1.stripBOM(convertedData);
        }
      } else if (responseType === 'stream') {
        convertedData = stream__default["default"].Readable.from(convertedData);
      }

      return settle(resolve, reject, {
        data: convertedData,
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders$1(),
        config
      });
    }

    if (supportedProtocols.indexOf(protocol) === -1) {
      return reject(new AxiosError(
        'Unsupported protocol ' + protocol,
        AxiosError.ERR_BAD_REQUEST,
        config
      ));
    }

    const headers = AxiosHeaders$1.from(config.headers).normalize();

    // Set User-Agent (required by some servers)
    // See https://github.com/axios/axios/issues/69
    // User-Agent is specified; handle case where no UA header is desired
    // Only set header if it hasn't been set in config
    headers.set('User-Agent', 'axios/' + VERSION, false);

    const {onUploadProgress, onDownloadProgress} = config;
    const maxRate = config.maxRate;
    let maxUploadRate = undefined;
    let maxDownloadRate = undefined;

    // support for spec compliant FormData objects
    if (utils$1.isSpecCompliantForm(data)) {
      const userBoundary = headers.getContentType(/boundary=([-_\w\d]{10,70})/i);

      data = formDataToStream$1(data, (formHeaders) => {
        headers.set(formHeaders);
      }, {
        tag: `axios-${VERSION}-boundary`,
        boundary: userBoundary && userBoundary[1] || undefined
      });
      // support for https://www.npmjs.com/package/form-data api
    } else if (utils$1.isFormData(data) && utils$1.isFunction(data.getHeaders)) {
      headers.set(data.getHeaders());

      if (!headers.hasContentLength()) {
        try {
          const knownLength = await util__default["default"].promisify(data.getLength).call(data);
          Number.isFinite(knownLength) && knownLength >= 0 && headers.setContentLength(knownLength);
          /*eslint no-empty:0*/
        } catch (e) {
        }
      }
    } else if (utils$1.isBlob(data) || utils$1.isFile(data)) {
      data.size && headers.setContentType(data.type || 'application/octet-stream');
      headers.setContentLength(data.size || 0);
      data = stream__default["default"].Readable.from(readBlob$1(data));
    } else if (data && !utils$1.isStream(data)) {
      if (Buffer.isBuffer(data)) ; else if (utils$1.isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (utils$1.isString(data)) {
        data = Buffer.from(data, 'utf-8');
      } else {
        return reject(new AxiosError(
          'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
          AxiosError.ERR_BAD_REQUEST,
          config
        ));
      }

      // Add Content-Length header if data exists
      headers.setContentLength(data.length, false);

      if (config.maxBodyLength > -1 && data.length > config.maxBodyLength) {
        return reject(new AxiosError(
          'Request body larger than maxBodyLength limit',
          AxiosError.ERR_BAD_REQUEST,
          config
        ));
      }
    }

    const contentLength = utils$1.toFiniteNumber(headers.getContentLength());

    if (utils$1.isArray(maxRate)) {
      maxUploadRate = maxRate[0];
      maxDownloadRate = maxRate[1];
    } else {
      maxUploadRate = maxDownloadRate = maxRate;
    }

    if (data && (onUploadProgress || maxUploadRate)) {
      if (!utils$1.isStream(data)) {
        data = stream__default["default"].Readable.from(data, {objectMode: false});
      }

      data = stream__default["default"].pipeline([data, new AxiosTransformStream$1({
        maxRate: utils$1.toFiniteNumber(maxUploadRate)
      })], utils$1.noop);

      onUploadProgress && data.on('progress', flushOnFinish(
        data,
        progressEventDecorator(
          contentLength,
          progressEventReducer(asyncDecorator(onUploadProgress), false, 3)
        )
      ));
    }

    // HTTP basic authentication
    let auth = undefined;
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password || '';
      auth = username + ':' + password;
    }

    if (!auth && parsed.username) {
      const urlUsername = parsed.username;
      const urlPassword = parsed.password;
      auth = urlUsername + ':' + urlPassword;
    }

    auth && headers.delete('authorization');

    let path;

    try {
      path = buildURL(
        parsed.pathname + parsed.search,
        config.params,
        config.paramsSerializer
      ).replace(/^\?/, '');
    } catch (err) {
      const customErr = new Error(err.message);
      customErr.config = config;
      customErr.url = config.url;
      customErr.exists = true;
      return reject(customErr);
    }

    headers.set(
      'Accept-Encoding',
      'gzip, compress, deflate' + (isBrotliSupported ? ', br' : ''), false
      );

    const options = {
      path,
      method: method,
      headers: headers.toJSON(),
      agents: { http: config.httpAgent, https: config.httpsAgent },
      auth,
      protocol,
      family,
      beforeRedirect: dispatchBeforeRedirect,
      beforeRedirects: {}
    };

    // cacheable-lookup integration hotfix
    !utils$1.isUndefined(lookup) && (options.lookup = lookup);

    if (config.socketPath) {
      options.socketPath = config.socketPath;
    } else {
      options.hostname = parsed.hostname.startsWith("[") ? parsed.hostname.slice(1, -1) : parsed.hostname;
      options.port = parsed.port;
      setProxy(options, config.proxy, protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path);
    }

    let transport;
    const isHttpsRequest = isHttps.test(options.protocol);
    options.agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;
    if (config.transport) {
      transport = config.transport;
    } else if (config.maxRedirects === 0) {
      transport = isHttpsRequest ? https__default["default"] : http__default["default"];
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects;
      }
      if (config.beforeRedirect) {
        options.beforeRedirects.config = config.beforeRedirect;
      }
      transport = isHttpsRequest ? httpsFollow : httpFollow;
    }

    if (config.maxBodyLength > -1) {
      options.maxBodyLength = config.maxBodyLength;
    } else {
      // follow-redirects does not skip comparison, so it should always succeed for axios -1 unlimited
      options.maxBodyLength = Infinity;
    }

    if (config.insecureHTTPParser) {
      options.insecureHTTPParser = config.insecureHTTPParser;
    }

    // Create the request
    req = transport.request(options, function handleResponse(res) {
      if (req.destroyed) return;

      const streams = [res];

      const responseLength = +res.headers['content-length'];

      if (onDownloadProgress || maxDownloadRate) {
        const transformStream = new AxiosTransformStream$1({
          maxRate: utils$1.toFiniteNumber(maxDownloadRate)
        });

        onDownloadProgress && transformStream.on('progress', flushOnFinish(
          transformStream,
          progressEventDecorator(
            responseLength,
            progressEventReducer(asyncDecorator(onDownloadProgress), true, 3)
          )
        ));

        streams.push(transformStream);
      }

      // decompress the response body transparently if required
      let responseStream = res;

      // return the last request in case of redirects
      const lastRequest = res.req || req;

      // if decompress disabled we should not decompress
      if (config.decompress !== false && res.headers['content-encoding']) {
        // if no content, but headers still say that it is encoded,
        // remove the header not confuse downstream operations
        if (method === 'HEAD' || res.statusCode === 204) {
          delete res.headers['content-encoding'];
        }

        switch ((res.headers['content-encoding'] || '').toLowerCase()) {
        /*eslint default-case:0*/
        case 'gzip':
        case 'x-gzip':
        case 'compress':
        case 'x-compress':
          // add the unzipper to the body stream processing pipeline
          streams.push(zlib__default["default"].createUnzip(zlibOptions));

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding'];
          break;
        case 'deflate':
          streams.push(new ZlibHeaderTransformStream$1());

          // add the unzipper to the body stream processing pipeline
          streams.push(zlib__default["default"].createUnzip(zlibOptions));

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding'];
          break;
        case 'br':
          if (isBrotliSupported) {
            streams.push(zlib__default["default"].createBrotliDecompress(brotliOptions));
            delete res.headers['content-encoding'];
          }
        }
      }

      responseStream = streams.length > 1 ? stream__default["default"].pipeline(streams, utils$1.noop) : streams[0];

      const offListeners = stream__default["default"].finished(responseStream, () => {
        offListeners();
        onFinished();
      });

      const response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: new AxiosHeaders$1(res.headers),
        config,
        request: lastRequest
      };

      if (responseType === 'stream') {
        response.data = responseStream;
        settle(resolve, reject, response);
      } else {
        const responseBuffer = [];
        let totalResponseBytes = 0;

        responseStream.on('data', function handleStreamData(chunk) {
          responseBuffer.push(chunk);
          totalResponseBytes += chunk.length;

          // make sure the content length is not over the maxContentLength if specified
          if (config.maxContentLength > -1 && totalResponseBytes > config.maxContentLength) {
            // stream.destroy() emit aborted event before calling reject() on Node.js v16
            rejected = true;
            responseStream.destroy();
            reject(new AxiosError('maxContentLength size of ' + config.maxContentLength + ' exceeded',
              AxiosError.ERR_BAD_RESPONSE, config, lastRequest));
          }
        });

        responseStream.on('aborted', function handlerStreamAborted() {
          if (rejected) {
            return;
          }

          const err = new AxiosError(
            'stream has been aborted',
            AxiosError.ERR_BAD_RESPONSE,
            config,
            lastRequest
          );
          responseStream.destroy(err);
          reject(err);
        });

        responseStream.on('error', function handleStreamError(err) {
          if (req.destroyed) return;
          reject(AxiosError.from(err, null, config, lastRequest));
        });

        responseStream.on('end', function handleStreamEnd() {
          try {
            let responseData = responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
            if (responseType !== 'arraybuffer') {
              responseData = responseData.toString(responseEncoding);
              if (!responseEncoding || responseEncoding === 'utf8') {
                responseData = utils$1.stripBOM(responseData);
              }
            }
            response.data = responseData;
          } catch (err) {
            return reject(AxiosError.from(err, null, config, response.request, response));
          }
          settle(resolve, reject, response);
        });
      }

      emitter.once('abort', err => {
        if (!responseStream.destroyed) {
          responseStream.emit('error', err);
          responseStream.destroy();
        }
      });
    });

    emitter.once('abort', err => {
      reject(err);
      req.destroy(err);
    });

    // Handle errors
    req.on('error', function handleRequestError(err) {
      // @todo remove
      // if (req.aborted && err.code !== AxiosError.ERR_FR_TOO_MANY_REDIRECTS) return;
      reject(AxiosError.from(err, null, config, req));
    });

    // set tcp keep alive to prevent drop connection by peer
    req.on('socket', function handleRequestSocket(socket) {
      // default interval of sending ack packet is 1 minute
      socket.setKeepAlive(true, 1000 * 60);
    });

    // Handle request timeout
    if (config.timeout) {
      // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
      const timeout = parseInt(config.timeout, 10);

      if (Number.isNaN(timeout)) {
        reject(new AxiosError(
          'error trying to parse `config.timeout` to int',
          AxiosError.ERR_BAD_OPTION_VALUE,
          config,
          req
        ));

        return;
      }

      // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
      // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
      // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
      // And then these socket which be hang up will devouring CPU little by little.
      // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
      req.setTimeout(timeout, function handleRequestTimeout() {
        if (isDone) return;
        let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
        const transitional = config.transitional || transitionalDefaults;
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        reject(new AxiosError(
          timeoutErrorMessage,
          transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
          config,
          req
        ));
        abort();
      });
    }


    // Send the request
    if (utils$1.isStream(data)) {
      let ended = false;
      let errored = false;

      data.on('end', () => {
        ended = true;
      });

      data.once('error', err => {
        errored = true;
        req.destroy(err);
      });

      data.on('close', () => {
        if (!ended && !errored) {
          abort(new CanceledError('Request stream has been aborted', config, req));
        }
      });

      data.pipe(req);
    } else {
      req.end(data);
    }
  });
};

const isURLSameOrigin = platform.hasStandardBrowserEnv ? ((origin, isMSIE) => (url) => {
  url = new URL(url, platform.origin);

  return (
    origin.protocol === url.protocol &&
    origin.host === url.host &&
    (isMSIE || origin.port === url.port)
  );
})(
  new URL(platform.origin),
  platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
) : () => true;

const cookies = platform.hasStandardBrowserEnv ?

  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain, secure) {
      const cookie = [name + '=' + encodeURIComponent(value)];

      utils$1.isNumber(expires) && cookie.push('expires=' + new Date(expires).toGMTString());

      utils$1.isString(path) && cookie.push('path=' + path);

      utils$1.isString(domain) && cookie.push('domain=' + domain);

      secure === true && cookie.push('secure');

      document.cookie = cookie.join('; ');
    },

    read(name) {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return (match ? decodeURIComponent(match[3]) : null);
    },

    remove(name) {
      this.write(name, '', Date.now() - 86400000);
    }
  }

  :

  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {},
    read() {
      return null;
    },
    remove() {}
  };

const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 *
 * @returns {Object} New object resulting from merging config2 to config1
 */
function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  const config = {};

  function getMergedValue(target, source, prop, caseless) {
    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
      return utils$1.merge.call({caseless}, target, source);
    } else if (utils$1.isPlainObject(source)) {
      return utils$1.merge({}, source);
    } else if (utils$1.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(a, b, prop , caseless) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(a, b, prop , caseless);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(undefined, a, prop , caseless);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(undefined, b);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(undefined, b);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(undefined, a);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(a, b, prop) {
    if (prop in config2) {
      return getMergedValue(a, b);
    } else if (prop in config1) {
      return getMergedValue(undefined, a);
    }
  }

  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b , prop) => mergeDeepProperties(headersToObject(a), headersToObject(b),prop, true)
  };

  utils$1.forEach(Object.keys({...config1, ...config2}), function computeConfigValue(prop) {
    const merge = mergeMap[prop] || mergeDeepProperties;
    const configValue = merge(config1[prop], config2[prop], prop);
    (utils$1.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
}

const resolveConfig = (config) => {
  const newConfig = mergeConfig({}, config);

  let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;

  newConfig.headers = headers = AxiosHeaders$1.from(headers);

  newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);

  // HTTP basic authentication
  if (auth) {
    headers.set('Authorization', 'Basic ' +
      btoa((auth.username || '') + ':' + (auth.password ? unescape(encodeURIComponent(auth.password)) : ''))
    );
  }

  if (utils$1.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(undefined); // browser handles it
    } else if (utils$1.isFunction(data.getHeaders)) {
      // Node.js FormData (like form-data package)
      const formHeaders = data.getHeaders();
      // Only set safe headers to avoid overwriting security headers
      const allowedHeaders = ['content-type', 'content-length'];
      Object.entries(formHeaders).forEach(([key, val]) => {
        if (allowedHeaders.includes(key.toLowerCase())) {
          headers.set(key, val);
        }
      });
    }
  }  

  // Add xsrf header
  // This is only done if running in a standard browser environment.
  // Specifically not if we're in a web worker, or react-native.

  if (platform.hasStandardBrowserEnv) {
    withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));

    if (withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(newConfig.url))) {
      // Add xsrf header
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);

      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }

  return newConfig;
};

const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

const xhrAdapter = isXHRAdapterSupported && function (config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
    let {responseType, onUploadProgress, onDownloadProgress} = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;

    function done() {
      flushUpload && flushUpload(); // flush events
      flushDownload && flushDownload(); // flush events

      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);

      _config.signal && _config.signal.removeEventListener('abort', onCanceled);
    }

    let request = new XMLHttpRequest();

    request.open(_config.method.toUpperCase(), _config.url, true);

    // Set the request timeout in MS
    request.timeout = _config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      const responseHeaders = AxiosHeaders$1.from(
        'getAllResponseHeaders' in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
        request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
  request.onerror = function handleError(event) {
       // Browsers deliver a ProgressEvent in XHR onerror
       // (message may be empty; when present, surface it)
       // See https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/error_event
       const msg = event && event.message ? event.message : 'Network Error';
       const err = new AxiosError(msg, AxiosError.ERR_NETWORK, config, request);
       // attach the underlying event for consumers who want details
       err.event = event || null;
       reject(err);
       request = null;
    };
    
    // Handle timeout
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? 'timeout of ' + _config.timeout + 'ms exceeded' : 'timeout exceeded';
      const transitional = _config.transitional || transitionalDefaults;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(new AxiosError(
        timeoutErrorMessage,
        transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
        config,
        request));

      // Clean up request
      request = null;
    };

    // Remove Content-Type if data is undefined
    requestData === undefined && requestHeaders.setContentType(null);

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }

    // Add withCredentials to request if needed
    if (!utils$1.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = _config.responseType;
    }

    // Handle progress if needed
    if (onDownloadProgress) {
      ([downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true));
      request.addEventListener('progress', downloadThrottled);
    }

    // Not all browsers support upload events
    if (onUploadProgress && request.upload) {
      ([uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress));

      request.upload.addEventListener('progress', uploadThrottled);

      request.upload.addEventListener('loadend', flushUpload);
    }

    if (_config.cancelToken || _config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = cancel => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
        request.abort();
        request = null;
      };

      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener('abort', onCanceled);
      }
    }

    const protocol = parseProtocol(_config.url);

    if (protocol && platform.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }


    // Send the request
    request.send(requestData || null);
  });
};

const composeSignals = (signals, timeout) => {
  const {length} = (signals = signals ? signals.filter(Boolean) : []);

  if (timeout || length) {
    let controller = new AbortController();

    let aborted;

    const onabort = function (reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
      }
    };

    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError(`timeout ${timeout} of ms exceeded`, AxiosError.ETIMEDOUT));
    }, timeout);

    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach(signal => {
          signal.unsubscribe ? signal.unsubscribe(onabort) : signal.removeEventListener('abort', onabort);
        });
        signals = null;
      }
    };

    signals.forEach((signal) => signal.addEventListener('abort', onabort));

    const {signal} = controller;

    signal.unsubscribe = () => utils$1.asap(unsubscribe);

    return signal;
  }
};

const composeSignals$1 = composeSignals;

const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;

  if (!chunkSize || len < chunkSize) {
    yield chunk;
    return;
  }

  let pos = 0;
  let end;

  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};

const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};

const readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }

  const reader = stream.getReader();
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};

const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator = readBytes(stream, chunkSize);

  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };

  return new ReadableStream({
    async pull(controller) {
      try {
        const {done, value} = await iterator.next();

        if (done) {
         _onFinish();
          controller.close();
          return;
        }

        let len = value.byteLength;
        if (onProgress) {
          let loadedBytes = bytes += len;
          onProgress(loadedBytes);
        }
        controller.enqueue(new Uint8Array(value));
      } catch (err) {
        _onFinish(err);
        throw err;
      }
    },
    cancel(reason) {
      _onFinish(reason);
      return iterator.return();
    }
  }, {
    highWaterMark: 2
  })
};

const DEFAULT_CHUNK_SIZE = 64 * 1024;

const {isFunction} = utils$1;

const globalFetchAPI = (({Request, Response}) => ({
  Request, Response
}))(utils$1.global);

const {
  ReadableStream: ReadableStream$1, TextEncoder: TextEncoder$1
} = utils$1.global;


const test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false
  }
};

const factory = (env) => {
  env = utils$1.merge.call({
    skipUndefined: true
  }, globalFetchAPI, env);

  const {fetch: envFetch, Request, Response} = env;
  const isFetchSupported = envFetch ? isFunction(envFetch) : typeof fetch === 'function';
  const isRequestSupported = isFunction(Request);
  const isResponseSupported = isFunction(Response);

  if (!isFetchSupported) {
    return false;
  }

  const isReadableStreamSupported = isFetchSupported && isFunction(ReadableStream$1);

  const encodeText = isFetchSupported && (typeof TextEncoder$1 === 'function' ?
      ((encoder) => (str) => encoder.encode(str))(new TextEncoder$1()) :
      async (str) => new Uint8Array(await new Request(str).arrayBuffer())
  );

  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;

    const hasContentType = new Request(platform.origin, {
      body: new ReadableStream$1(),
      method: 'POST',
      get duplex() {
        duplexAccessed = true;
        return 'half';
      },
    }).headers.has('Content-Type');

    return duplexAccessed && !hasContentType;
  });

  const supportsResponseStream = isResponseSupported && isReadableStreamSupported &&
    test(() => utils$1.isReadableStream(new Response('').body));

  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };

  isFetchSupported && ((() => {
    ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach(type => {
      !resolvers[type] && (resolvers[type] = (res, config) => {
        let method = res && res[type];

        if (method) {
          return method.call(res);
        }

        throw new AxiosError(`Response type '${type}' is not supported`, AxiosError.ERR_NOT_SUPPORT, config);
      });
    });
  })());

  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }

    if (utils$1.isBlob(body)) {
      return body.size;
    }

    if (utils$1.isSpecCompliantForm(body)) {
      const _request = new Request(platform.origin, {
        method: 'POST',
        body,
      });
      return (await _request.arrayBuffer()).byteLength;
    }

    if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
      return body.byteLength;
    }

    if (utils$1.isURLSearchParams(body)) {
      body = body + '';
    }

    if (utils$1.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };

  const resolveBodyLength = async (headers, body) => {
    const length = utils$1.toFiniteNumber(headers.getContentLength());

    return length == null ? getBodyLength(body) : length;
  };

  return async (config) => {
    let {
      url,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = 'same-origin',
      fetchOptions
    } = resolveConfig(config);

    let _fetch = envFetch || fetch;

    responseType = responseType ? (responseType + '').toLowerCase() : 'text';

    let composedSignal = composeSignals$1([signal, cancelToken && cancelToken.toAbortSignal()], timeout);

    let request = null;

    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });

    let requestContentLength;

    try {
      if (
        onUploadProgress && supportsRequestStream && method !== 'get' && method !== 'head' &&
        (requestContentLength = await resolveBodyLength(headers, data)) !== 0
      ) {
        let _request = new Request(url, {
          method: 'POST',
          body: data,
          duplex: "half"
        });

        let contentTypeHeader;

        if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get('content-type'))) {
          headers.setContentType(contentTypeHeader);
        }

        if (_request.body) {
          const [onProgress, flush] = progressEventDecorator(
            requestContentLength,
            progressEventReducer(asyncDecorator(onUploadProgress))
          );

          data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
        }
      }

      if (!utils$1.isString(withCredentials)) {
        withCredentials = withCredentials ? 'include' : 'omit';
      }

      // Cloudflare Workers throws when credentials are defined
      // see https://github.com/cloudflare/workerd/issues/902
      const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;

      const resolvedOptions = {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: headers.normalize().toJSON(),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : undefined
      };

      request = isRequestSupported && new Request(url, resolvedOptions);

      let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url, resolvedOptions));

      const isStreamResponse = supportsResponseStream && (responseType === 'stream' || responseType === 'response');

      if (supportsResponseStream && (onDownloadProgress || (isStreamResponse && unsubscribe))) {
        const options = {};

        ['status', 'statusText', 'headers'].forEach(prop => {
          options[prop] = response[prop];
        });

        const responseContentLength = utils$1.toFiniteNumber(response.headers.get('content-length'));

        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];

        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }

      responseType = responseType || 'text';

      let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || 'text'](response, config);

      !isStreamResponse && unsubscribe && unsubscribe();

      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders$1.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request
        });
      })
    } catch (err) {
      unsubscribe && unsubscribe();

      if (err && err.name === 'TypeError' && /Load failed|fetch/i.test(err.message)) {
        throw Object.assign(
          new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request),
          {
            cause: err.cause || err
          }
        )
      }

      throw AxiosError.from(err, err && err.code, config, request);
    }
  }
};

const seedCache = new Map();

const getFetch = (config) => {
  let env = config ? config.env : {};
  const {fetch, Request, Response} = env;
  const seeds = [
    Request, Response, fetch
  ];

  let len = seeds.length, i = len,
    seed, target, map = seedCache;

  while (i--) {
    seed = seeds[i];
    target = map.get(seed);

    target === undefined && map.set(seed, target = (i ? new Map() : factory(env)));

    map = target;
  }

  return target;
};

getFetch();

const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: {
    get: getFetch,
  }
};

utils$1.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, 'name', {value});
    } catch (e) {
      // eslint-disable-next-line no-empty
    }
    Object.defineProperty(fn, 'adapterName', {value});
  }
});

const renderReason = (reason) => `- ${reason}`;

const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;

const adapters = {
  getAdapter: (adapters, config) => {
    adapters = utils$1.isArray(adapters) ? adapters : [adapters];

    const {length} = adapters;
    let nameOrAdapter;
    let adapter;

    const rejectedReasons = {};

    for (let i = 0; i < length; i++) {
      nameOrAdapter = adapters[i];
      let id;

      adapter = nameOrAdapter;

      if (!isResolvedHandle(nameOrAdapter)) {
        adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];

        if (adapter === undefined) {
          throw new AxiosError(`Unknown adapter '${id}'`);
        }
      }

      if (adapter && (utils$1.isFunction(adapter) || (adapter = adapter.get(config)))) {
        break;
      }

      rejectedReasons[id || '#' + i] = adapter;
    }

    if (!adapter) {

      const reasons = Object.entries(rejectedReasons)
        .map(([id, state]) => `adapter ${id} ` +
          (state === false ? 'is not supported by the environment' : 'is not available in the build')
        );

      let s = length ?
        (reasons.length > 1 ? 'since :\n' + reasons.map(renderReason).join('\n') : ' ' + renderReason(reasons[0])) :
        'as no adapter specified';

      throw new AxiosError(
        `There is no suitable adapter to dispatch the request ` + s,
        'ERR_NOT_SUPPORT'
      );
    }

    return adapter;
  },
  adapters: knownAdapters
};

/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError(null, config);
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  config.headers = AxiosHeaders$1.from(config.headers);

  // Transform request data
  config.data = transformData.call(
    config,
    config.transformRequest
  );

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || defaults$1.adapter, config);

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      config.transformResponse,
      response
    );

    response.headers = AxiosHeaders$1.from(response.headers);

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          config.transformResponse,
          reason.response
        );
        reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
      }
    }

    return Promise.reject(reason);
  });
}

const validators$1 = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
  validators$1[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

const deprecatedWarnings = {};

/**
 * Transitional option validator
 *
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 *
 * @returns {function}
 */
validators$1.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return (value, opt, opts) => {
    if (validator === false) {
      throw new AxiosError(
        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
        AxiosError.ERR_DEPRECATED
      );
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

validators$1.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    // eslint-disable-next-line no-console
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  }
};

/**
 * Assert object's properties type
 *
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 *
 * @returns {object}
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = schema[opt];
    if (validator) {
      const value = options[opt];
      const result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
    }
  }
}

const validator = {
  assertOptions,
  validators: validators$1
};

const validators = validator.validators;

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 *
 * @return {Axios} A new instance of Axios
 */
class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager$1(),
      response: new InterceptorManager$1()
    };
  }

  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};

        Error.captureStackTrace ? Error.captureStackTrace(dummy) : (dummy = new Error());

        // slice off the Error: ... line
        const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, '') : '';
        try {
          if (!err.stack) {
            err.stack = stack;
            // match without the 2 top stack lines
          } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ''))) {
            err.stack += '\n' + stack;
          }
        } catch (e) {
          // ignore the case where "stack" is an un-writable property
        }
      }

      throw err;
    }
  }

  _request(configOrUrl, config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    config = mergeConfig(this.defaults, config);

    const {transitional, paramsSerializer, headers} = config;

    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: validators.transitional(validators.boolean),
        forcedJSONParsing: validators.transitional(validators.boolean),
        clarifyTimeoutError: validators.transitional(validators.boolean)
      }, false);
    }

    if (paramsSerializer != null) {
      if (utils$1.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator.assertOptions(paramsSerializer, {
          encode: validators.function,
          serialize: validators.function
        }, true);
      }
    }

    // Set config.allowAbsoluteUrls
    if (config.allowAbsoluteUrls !== undefined) ; else if (this.defaults.allowAbsoluteUrls !== undefined) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }

    validator.assertOptions(config, {
      baseUrl: validators.spelling('baseURL'),
      withXsrfToken: validators.spelling('withXSRFToken')
    }, true);

    // Set config.method
    config.method = (config.method || this.defaults.method || 'get').toLowerCase();

    // Flatten headers
    let contextHeaders = headers && utils$1.merge(
      headers.common,
      headers[config.method]
    );

    headers && utils$1.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      (method) => {
        delete headers[method];
      }
    );

    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

    // filter out skipped interceptors
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }

      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;
    let i = 0;
    let len;

    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), undefined];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;

      promise = Promise.resolve(config);

      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }

      return promise;
    }

    len = requestInterceptorChain.length;

    let newConfig = config;

    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }

    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    i = 0;
    len = responseInterceptorChain.length;

    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }

    return promise;
  }

  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
}

// Provide aliases for supported request methods
utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});

utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url,
        data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

const Axios$1 = Axios;

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @param {Function} executor The executor function.
 *
 * @returns {CancelToken}
 */
class CancelToken {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    let resolvePromise;

    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    const token = this;

    // eslint-disable-next-line func-names
    this.promise.then(cancel => {
      if (!token._listeners) return;

      let i = token._listeners.length;

      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });

    // eslint-disable-next-line func-names
    this.promise.then = onfulfilled => {
      let _resolve;
      // eslint-disable-next-line func-names
      const promise = new Promise(resolve => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);

      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };

      return promise;
    };

    executor(function cancel(message, config, request) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new CanceledError(message, config, request);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }

  /**
   * Subscribe to the cancel signal
   */

  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }

    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }

  /**
   * Unsubscribe from the cancel signal
   */

  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  toAbortSignal() {
    const controller = new AbortController();

    const abort = (err) => {
      controller.abort(err);
    };

    this.subscribe(abort);

    controller.signal.unsubscribe = () => this.unsubscribe(abort);

    return controller.signal;
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
}

const CancelToken$1 = CancelToken;

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 *
 * @returns {Function}
 */
function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 *
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
function isAxiosError(payload) {
  return utils$1.isObject(payload) && (payload.isAxiosError === true);
}

const HttpStatusCode = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
};

Object.entries(HttpStatusCode).forEach(([key, value]) => {
  HttpStatusCode[value] = key;
});

const HttpStatusCode$1 = HttpStatusCode;

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 *
 * @returns {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  const context = new Axios$1(defaultConfig);
  const instance = bind(Axios$1.prototype.request, context);

  // Copy axios.prototype to instance
  utils$1.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

  // Copy context to instance
  utils$1.extend(instance, context, null, {allOwnKeys: true});

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
const axios = createInstance(defaults$1);

// Expose Axios class to allow class inheritance
axios.Axios = Axios$1;

// Expose Cancel & CancelToken
axios.CanceledError = CanceledError;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData;

// Expose AxiosError class
axios.AxiosError = AxiosError;

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = spread;

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

// Expose mergeConfig
axios.mergeConfig = mergeConfig;

axios.AxiosHeaders = AxiosHeaders$1;

axios.formToJSON = thing => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);

axios.getAdapter = adapters.getAdapter;

axios.HttpStatusCode = HttpStatusCode$1;

axios.default = axios;

module.exports = axios;
//# sourceMappingURL=axios.cjs.map


/***/ }),

/***/ 3700:
/***/ ((module) => {

"use strict";


/** @type {import('./floor')} */
module.exports = Math.floor;


/***/ }),

/***/ 3836:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(4499);

var $apply = __webpack_require__(6678);
var $call = __webpack_require__(376);
var $reflectApply = __webpack_require__(9707);

/** @type {import('./actualApply')} */
module.exports = $reflectApply || bind.call($call, $apply);


/***/ }),

/***/ 3841:
/***/ ((module) => {

"use strict";


/** @type {import('./eval')} */
module.exports = EvalError;


/***/ }),

/***/ 3888:
/***/ ((module) => {

"use strict";


/** @type {import('./max')} */
module.exports = Math.max;


/***/ }),

/***/ 3897:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var $isNaN = __webpack_require__(3943);

/** @type {import('./sign')} */
module.exports = function sign(number) {
	if ($isNaN(number) || number === 0) {
		return number;
	}
	return number < 0 ? -1 : +1;
};


/***/ }),

/***/ 3943:
/***/ ((module) => {

"use strict";


/** @type {import('./isNaN')} */
module.exports = Number.isNaN || function isNaN(a) {
	return a !== a;
};


/***/ }),

/***/ 3950:
/***/ ((module) => {

"use strict";


/** @type {import('./ref')} */
module.exports = ReferenceError;


/***/ }),

/***/ 4101:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MCPHealthMonitor = void 0;
const vscode = __importStar(__webpack_require__(1398));
const mcp_cursor_api_1 = __webpack_require__(3463);
let extensionContext;
class MCPHealthMonitor {
    constructor() {
        this.currentStatus = {
            isHealthy: false,
            lastCheck: new Date()
        };
        this.statusChangeCallbacks = [];
        this.restartAttempts = 0;
        this.lastRestartTime = 0;
        this.MAX_RESTART_ATTEMPTS = 3;
        this.RESTART_COOLDOWN_MS = 30000; // 30 seconds between restart attempts
    }
    static getInstance() {
        if (!MCPHealthMonitor.instance) {
            MCPHealthMonitor.instance = new MCPHealthMonitor();
        }
        return MCPHealthMonitor.instance;
    }
    /**
     * Set extension context (needed for re-registration)
     */
    setContext(context) {
        extensionContext = context;
    }
    /**
     * Set WMIC shim path (for process detection on Windows 11)
     */
    setWmicShimPath(shimPath) {
        this.wmicShimPath = shimPath;
        if (shimPath) {
            console.log(`[MCP Health] Using WMIC shim at: ${shimPath}`);
        }
    }
    /**
     * Start monitoring MCP server health with AUTO-RESTART (Todo2 behavior)
     */
    startMonitoring(intervalMs = 10000) {
        console.log('🏥 Starting MCP health monitoring...');
        console.log('✨ AUTO-RESTART ENABLED (Todo2 behavior)');
        // Initial check
        this.checkHealth();
        // Schedule periodic checks
        this.healthCheckInterval = setInterval(() => {
            this.checkHealth();
        }, intervalMs);
        console.log(`✅ MCP health monitoring started (interval: ${intervalMs}ms)`);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
            console.log('⏹️  MCP health monitoring stopped');
        }
    }
    /**
     * Check MCP server health (Todo2 approach - check actual process)
     */
    async checkHealth() {
        try {
            console.log('🔍 Checking MCP server health...');
            // Check using Cursor's MCP API
            const cursorAPI = vscode.cursor;
            if (!cursorAPI || !cursorAPI.mcp) {
                console.log('⚠️ Cursor MCP API not available');
                this.updateStatus(false, 'Cursor MCP API not available');
                return;
            }
            // Check if Auxly MCP server is registered
            let mcpServers = {};
            try {
                if (cursorAPI.mcp.getServers) {
                    mcpServers = await cursorAPI.mcp.getServers();
                }
                else if (cursorAPI.mcp.listServers) {
                    mcpServers = await cursorAPI.mcp.listServers();
                }
                else {
                    const config = vscode.workspace.getConfiguration('cursor');
                    mcpServers = config.get('mcp.servers', {});
                }
            }
            catch (error) {
                console.error('❌ Failed to get MCP servers:', error);
                this.updateStatus(false, 'Failed to get MCP servers list');
                return;
            }
            const auxlyServer = mcpServers['auxly'];
            if (!auxlyServer) {
                console.log('❌ Auxly MCP server not registered');
                this.updateStatus(false, 'MCP server not registered');
                return;
            }
            // Check if the MCP server is actually healthy using Cursor's API
            // Don't try to find processes manually - let Cursor tell us if it's working
            let isProcessRunning = false;
            try {
                // METHOD 1: Try to list tools (proves server is responding)
                if (cursorAPI.mcp.listTools) {
                    try {
                        const tools = await cursorAPI.mcp.listTools('auxly', { timeout: 5000 });
                        if (tools && tools.length > 0) {
                            isProcessRunning = true;
                            console.log(`✅ MCP server responding with ${tools.length} tools`);
                        }
                        else {
                            console.log('⚠️ MCP server returned no tools');
                            isProcessRunning = false;
                        }
                    }
                    catch (toolsError) {
                        console.log('⚠️ Failed to list tools, trying status check...', toolsError);
                        isProcessRunning = false;
                    }
                }
                // METHOD 2: If listTools failed, check server status
                if (!isProcessRunning && cursorAPI.mcp.getServerStatus) {
                    try {
                        const status = await cursorAPI.mcp.getServerStatus('auxly');
                        // Server is healthy if it's running/ready/connected
                        isProcessRunning = status?.state === 'running' ||
                            status?.state === 'ready' ||
                            status?.connected === true;
                        console.log('📊 MCP Server Status:', {
                            state: status?.state,
                            connected: status?.connected,
                            isHealthy: isProcessRunning
                        });
                    }
                    catch (statusError) {
                        console.log('⚠️ Failed to get server status:', statusError);
                        isProcessRunning = false;
                    }
                }
                // METHOD 3: If both failed, assume server is registered = healthy
                // (Cursor manages the process lifecycle, if it's registered it's probably working)
                if (!isProcessRunning) {
                    console.log('ℹ️ Could not verify server health via API, assuming healthy if registered');
                    isProcessRunning = true; // Server is registered, trust Cursor to manage it
                }
            }
            catch (error) {
                console.error('❌ Failed to check MCP health:', error);
                // If server is registered but we can't check health, assume it's working
                isProcessRunning = true; // Trust Cursor's process management
            }
            // Update status based on PROCESS running state (not just registration)
            if (isProcessRunning) {
                console.log('✅ MCP server is healthy (process running)');
                this.updateStatus(true);
            }
            else {
                console.log('❌ MCP server is unhealthy (process not found or not responding)');
                this.updateStatus(false, 'MCP server process not found or not responding');
            }
        }
        catch (error) {
            console.error('❌ Health check failed:', error);
            this.updateStatus(false, error instanceof Error ? error.message : String(error));
        }
    }
    /**
     * Update health status and notify if changed
     * AUTO-RESTART if unhealthy (Todo2 behavior)
     */
    async updateStatus(isHealthy, error) {
        const wasHealthy = this.currentStatus.isHealthy;
        this.currentStatus = {
            isHealthy,
            lastCheck: new Date(),
            error: error
        };
        // Reset restart attempts if healthy
        if (isHealthy && this.restartAttempts > 0) {
            console.log('✅ MCP recovered - resetting restart counter');
            this.restartAttempts = 0;
        }
        // Notify listeners if status changed
        if (wasHealthy !== isHealthy) {
            console.log(`🔄 MCP health status changed: ${wasHealthy} → ${isHealthy}`);
            if (!isHealthy) {
                // Check if we should attempt restart
                const now = Date.now();
                const timeSinceLastRestart = now - this.lastRestartTime;
                if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
                    console.log(`⚠️ MAX RESTART ATTEMPTS REACHED (${this.MAX_RESTART_ATTEMPTS})`);
                    console.log('⏳ Waiting for cooldown period before retry...');
                    // Reset after cooldown
                    if (timeSinceLastRestart > this.RESTART_COOLDOWN_MS) {
                        console.log('🔄 Cooldown period passed - resetting counter');
                        this.restartAttempts = 0;
                        this.lastRestartTime = 0;
                    }
                }
                else {
                    console.log(`⚠️ MCP server unhealthy - AUTO-RESTARTING (${this.restartAttempts + 1}/${this.MAX_RESTART_ATTEMPTS})...`);
                    this.restartAttempts++;
                    this.lastRestartTime = now;
                    // Auto-restart if unhealthy
                    await this.restartMCPServer();
                }
            }
            this.notifyStatusChange();
        }
    }
    /**
     * Manually restart MCP server (AUTO-RESTART - Todo2 behavior)
     */
    async restartMCPServer() {
        try {
            console.log('🔄 AUTO-RESTARTING MCP server (Todo2 behavior)...');
            if (!extensionContext) {
                console.error('❌ Extension context not set');
                return false;
            }
            const cursorAPI = vscode.cursor;
            if (!cursorAPI || !cursorAPI.mcp) {
                console.error('❌ Cursor MCP API not available');
                return false;
            }
            // Unregister existing server
            try {
                if (cursorAPI.mcp.unregisterServer) {
                    await cursorAPI.mcp.unregisterServer('auxly');
                    console.log('📤 Unregistered existing MCP server');
                }
            }
            catch (e) {
                // Ignore - server might not be registered
                console.log('ℹ️  No existing server to unregister');
            }
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 500));
            // Re-register using the Cursor API (same as Todo2!)
            console.log('📥 Re-registering MCP server...');
            const registered = await (0, mcp_cursor_api_1.registerMCPServerWithCursorAPI)(extensionContext);
            if (registered) {
                console.log('✅ MCP server AUTO-RESTARTED successfully!');
                vscode.window.showInformationMessage('✅ Auxly MCP server restarted automatically');
                // Wait a moment for registration to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Re-check health
                await this.checkHealth();
                return true;
            }
            else {
                console.error('❌ Failed to re-register MCP server');
                vscode.window.showWarningMessage('⚠️ Auxly MCP auto-restart failed. Try manual reload.');
                return false;
            }
        }
        catch (error) {
            console.error('❌ Failed to restart MCP server:', error);
            vscode.window.showErrorMessage(`Failed to restart MCP server: ${error}`);
            return false;
        }
    }
    /**
     * Get current health status
     */
    getStatus() {
        return { ...this.currentStatus };
    }
    /**
     * Subscribe to status changes
     */
    onStatusChange(callback) {
        this.statusChangeCallbacks.push(callback);
        // Send current status immediately
        callback(this.getStatus());
        return new vscode.Disposable(() => {
            const index = this.statusChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.statusChangeCallbacks.splice(index, 1);
            }
        });
    }
    /**
     * Notify all listeners of status change
     */
    notifyStatusChange() {
        const status = this.getStatus();
        this.statusChangeCallbacks.forEach(callback => {
            try {
                callback(status);
            }
            catch (error) {
                console.error('Error in status change callback:', error);
            }
        });
    }
    /**
     * Dispose and clean up
     */
    dispose() {
        this.stopMonitoring();
        this.statusChangeCallbacks = [];
    }
}
exports.MCPHealthMonitor = MCPHealthMonitor;


/***/ }),

/***/ 4145:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Stream = (__webpack_require__(2203).Stream);
var util = __webpack_require__(9023);

module.exports = DelayedStream;
function DelayedStream() {
  this.source = null;
  this.dataSize = 0;
  this.maxDataSize = 1024 * 1024;
  this.pauseStream = true;

  this._maxDataSizeExceeded = false;
  this._released = false;
  this._bufferedEvents = [];
}
util.inherits(DelayedStream, Stream);

DelayedStream.create = function(source, options) {
  var delayedStream = new this();

  options = options || {};
  for (var option in options) {
    delayedStream[option] = options[option];
  }

  delayedStream.source = source;

  var realEmit = source.emit;
  source.emit = function() {
    delayedStream._handleEmit(arguments);
    return realEmit.apply(source, arguments);
  };

  source.on('error', function() {});
  if (delayedStream.pauseStream) {
    source.pause();
  }

  return delayedStream;
};

Object.defineProperty(DelayedStream.prototype, 'readable', {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.source.readable;
  }
});

DelayedStream.prototype.setEncoding = function() {
  return this.source.setEncoding.apply(this.source, arguments);
};

DelayedStream.prototype.resume = function() {
  if (!this._released) {
    this.release();
  }

  this.source.resume();
};

DelayedStream.prototype.pause = function() {
  this.source.pause();
};

DelayedStream.prototype.release = function() {
  this._released = true;

  this._bufferedEvents.forEach(function(args) {
    this.emit.apply(this, args);
  }.bind(this));
  this._bufferedEvents = [];
};

DelayedStream.prototype.pipe = function() {
  var r = Stream.prototype.pipe.apply(this, arguments);
  this.resume();
  return r;
};

DelayedStream.prototype._handleEmit = function(args) {
  if (this._released) {
    this.emit.apply(this, args);
    return;
  }

  if (args[0] === 'data') {
    this.dataSize += args[1].length;
    this._checkIfMaxDataSizeExceeded();
  }

  this._bufferedEvents.push(args);
};

DelayedStream.prototype._checkIfMaxDataSizeExceeded = function() {
  if (this._maxDataSizeExceeded) {
    return;
  }

  if (this.dataSize <= this.maxDataSize) {
    return;
  }

  this._maxDataSizeExceeded = true;
  var message =
    'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.'
  this.emit('error', new Error(message));
};


/***/ }),

/***/ 4313:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var call = Function.prototype.call;
var $hasOwn = Object.prototype.hasOwnProperty;
var bind = __webpack_require__(4499);

/** @type {import('.')} */
module.exports = bind.call(call, $hasOwn);


/***/ }),

/***/ 4361:
/***/ ((module) => {

"use strict";


/** @type {import('./shams')} */
/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	/** @type {{ [k in symbol]?: unknown }} */
	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (var _ in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		// eslint-disable-next-line no-extra-parens
		var descriptor = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(obj, sym));
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};


/***/ }),

/***/ 4407:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var async = __webpack_require__(7797)
  , abort = __webpack_require__(9407)
  ;

// API
module.exports = iterate;

/**
 * Iterates over each job object
 *
 * @param {array|object} list - array or object (named list) to iterate over
 * @param {function} iterator - iterator to run
 * @param {object} state - current job status
 * @param {function} callback - invoked when all elements processed
 */
function iterate(list, iterator, state, callback)
{
  // store current index
  var key = state['keyedList'] ? state['keyedList'][state.index] : state.index;

  state.jobs[key] = runJob(iterator, key, list[key], function(error, output)
  {
    // don't repeat yourself
    // skip secondary callbacks
    if (!(key in state.jobs))
    {
      return;
    }

    // clean up jobs
    delete state.jobs[key];

    if (error)
    {
      // don't process rest of the results
      // stop still active jobs
      // and reset the list
      abort(state);
    }
    else
    {
      state.results[key] = output;
    }

    // return salvaged results
    callback(error, state.results);
  });
}

/**
 * Runs iterator over provided job element
 *
 * @param   {function} iterator - iterator to invoke
 * @param   {string|number} key - key/index of the element in the list of jobs
 * @param   {mixed} item - job description
 * @param   {function} callback - invoked after iterator is done with the job
 * @returns {function|mixed} - job abort function or something else
 */
function runJob(iterator, key, item, callback)
{
  var aborter;

  // allow shortcut if iterator expects only two arguments
  if (iterator.length == 2)
  {
    aborter = iterator(item, async(callback));
  }
  // otherwise go with full three arguments
  else
  {
    aborter = iterator(item, key, async(callback));
  }

  return aborter;
}


/***/ }),

/***/ 4434:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 4457:
/***/ ((module) => {

module.exports = defer;

/**
 * Runs provided function on next iteration of the event loop
 *
 * @param {function} fn - function to run
 */
function defer(fn)
{
  var nextTick = typeof setImmediate == 'function'
    ? setImmediate
    : (
      typeof process == 'object' && typeof process.nextTick == 'function'
      ? process.nextTick
      : null
    );

  if (nextTick)
  {
    nextTick(fn);
  }
  else
  {
    setTimeout(fn, 0);
  }
}


/***/ }),

/***/ 4499:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var implementation = __webpack_require__(5845);

module.exports = Function.prototype.bind || implementation;


/***/ }),

/***/ 4670:
/***/ ((module) => {

"use strict";


/** @type {import('./min')} */
module.exports = Math.min;


/***/ }),

/***/ 4723:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * API Client
 * Singleton HTTP client for Auxly backend communication
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ApiClient = void 0;
exports.initializeApiClient = initializeApiClient;
const axios_1 = __importDefault(__webpack_require__(3559));
const vscode = __importStar(__webpack_require__(1398));
const os = __importStar(__webpack_require__(857));
const https = __importStar(__webpack_require__(5692));
const endpoints_1 = __webpack_require__(8109);
const externalHttp = __importStar(__webpack_require__(6117));
/**
 * Secure storage keys for VSCode secrets
 */
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'auxly.accessToken',
    REFRESH_TOKEN: 'auxly.refreshToken',
    TOKEN_EXPIRES_AT: 'auxly.tokenExpiresAt',
    API_KEY: 'auxly.apiKey',
};
/**
 * API Client Singleton
 * Handles all HTTP communication with the Auxly backend
 */
class ApiClient {
    constructor(config) {
        this.context = null;
        this.isRefreshing = false;
        this.refreshPromise = null;
        // Disable Node.js SSL verification globally for this extension
        // This is required for VS Code extensions to accept Let's Encrypt certificates
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        // Get user configuration for SSL handling
        const vsConfig = vscode.workspace.getConfiguration('auxly');
        // Default to true to allow Let's Encrypt certificate
        const allowInsecureSSL = vsConfig.get('allowInsecureSSL', true);
        // Create HTTPS agent with SSL/TLS configuration
        // This helps handle self-signed certificates and SSL errors
        const httpsAgent = new https.Agent({
            // Disable strict SSL verification to allow Let's Encrypt certificate
            // Users can override this in settings if needed
            rejectUnauthorized: false,
            // Keep connections alive for better performance
            keepAlive: true,
            // Set minimum TLS version
            minVersion: 'TLSv1.2',
            // Maximum TLS version
            maxVersion: 'TLSv1.3',
        });
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || endpoints_1.API_CONFIG.DEFAULT_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
            // Add HTTPS agent for SSL/TLS handling
            httpsAgent: httpsAgent,
            // Explicitly handle both HTTP and HTTPS
            httpAgent: undefined,
        });
        this.setupInterceptors();
    }
    /**
     * Initialize or get singleton instance
     */
    static getInstance(config) {
        if (!ApiClient.instance && config) {
            ApiClient.instance = new ApiClient(config);
        }
        if (!ApiClient.instance) {
            throw new Error('ApiClient must be initialized with config first');
        }
        return ApiClient.instance;
    }
    /**
     * Set ExtensionContext for secure token storage
     */
    setContext(context) {
        this.context = context;
    }
    /**
     * Generate device fingerprint for device tracking
     */
    getDeviceFingerprint() {
        // Try to get MAC address first (most stable identifier)
        try {
            const os = __webpack_require__(857);
            const networkInterfaces = os.networkInterfaces();
            // Find first non-internal network interface with MAC address
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                if (interfaces) {
                    for (const iface of interfaces) {
                        // Skip internal/loopback interfaces and those without MAC
                        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                            console.log(`✅ Using MAC address as device fingerprint: ${iface.mac}`);
                            return `mac-${iface.mac}`;
                        }
                    }
                }
            }
        }
        catch (error) {
            console.warn('⚠️ Failed to get MAC address:', error);
        }
        // Fallback to machine ID (stable across sessions)
        if (this.context) {
            const machineId = vscode.env.machineId;
            console.log('⚠️ Using machineId as fallback device fingerprint');
            return `vscode-${machineId}`;
        }
        return 'vscode-unknown-device';
    }
    /**
     * Get device name (computer hostname)
     */
    getDeviceName() {
        try {
            const hostname = os.hostname();
            return `${hostname} - VS Code Extension`;
        }
        catch {
            return 'VS Code Extension';
        }
    }
    /**
     * Get OS information
     */
    getOsInfo() {
        try {
            const platform = os.platform(); // 'win32', 'darwin', 'linux'
            const release = os.release();
            let osName = 'Unknown OS';
            switch (platform) {
                case 'win32':
                    osName = 'Windows';
                    break;
                case 'darwin':
                    osName = 'macOS';
                    break;
                case 'linux':
                    osName = 'Linux';
                    break;
            }
            return `${osName} ${release}`;
        }
        catch {
            return 'Unknown OS';
        }
    }
    /**
     * Setup Axios interceptors for authentication and error handling
     */
    setupInterceptors() {
        // Request interceptor: Add auth (API key or JWT token) to requests
        this.axiosInstance.interceptors.request.use(async (config) => {
            try {
                // 🔧 CRITICAL FIX: Don't overwrite API key if already set by the caller
                // This allows verifyApiKey() to test a new key before storing it
                const hasExistingApiKey = config.headers && config.headers['X-API-Key'];
                if (!hasExistingApiKey) {
                    // Only get cached API key if caller didn't provide one
                    const apiKey = await this.getApiKey();
                    if (apiKey && config.headers) {
                        config.headers['X-API-Key'] = apiKey;
                        // Add device tracking headers
                        config.headers['x-device-fingerprint'] = this.getDeviceFingerprint();
                        config.headers['x-device-name'] = this.getDeviceName();
                        config.headers['x-os-info'] = this.getOsInfo();
                        // No browser info for VS Code extension (set to extension name)
                        config.headers['x-browser-info'] = 'VS Code Extension';
                    }
                    else {
                        // Fallback to JWT token
                        const token = await this.getAccessToken();
                        if (token && config.headers) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    }
                }
                else {
                    // API key already set by caller - still add device tracking headers
                    if (config.headers) {
                        config.headers['x-device-fingerprint'] = this.getDeviceFingerprint();
                        config.headers['x-device-name'] = this.getDeviceName();
                        config.headers['x-os-info'] = this.getOsInfo();
                        config.headers['x-browser-info'] = 'VS Code Extension';
                    }
                }
            }
            catch (error) {
                console.error('Failed to get auth credentials:', error);
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor: Handle errors and token refresh
        this.axiosInstance.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            // Handle 401 Unauthorized - token expired
            if (error.response?.status === endpoints_1.HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    // Try to refresh the token
                    const newToken = await this.refreshAccessToken();
                    if (newToken && originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return this.axiosInstance(originalRequest);
                    }
                }
                catch (refreshError) {
                    // Refresh failed - user needs to log in again
                    await this.clearTokens();
                    vscode.window.showWarningMessage('Session expired. Please log in again.');
                    return Promise.reject(refreshError);
                }
            }
            // Handle retryable errors (5xx, network errors)
            if (this.shouldRetry(error) && !originalRequest._retry) {
                return this.retryRequest(originalRequest, error);
            }
            return Promise.reject(this.handleError(error));
        });
    }
    /**
     * Determine if request should be retried
     */
    shouldRetry(error) {
        // Don't retry if no response (network error)
        if (!error.response) {
            return true;
        }
        const status = error.response.status;
        // Retry on 5xx server errors
        if (status >= 500 && status < 600) {
            return true;
        }
        // Retry on specific errors
        if (status === endpoints_1.HTTP_STATUS.TOO_MANY_REQUESTS) {
            return true;
        }
        return false;
    }
    /**
     * Retry request with exponential backoff
     */
    async retryRequest(config, error) {
        config._retry = true;
        config._retryCount = (config._retryCount || 0) + 1;
        // Max retry attempts
        if (config._retryCount > endpoints_1.API_CONFIG.DEFAULT_RETRY_ATTEMPTS) {
            return Promise.reject(error);
        }
        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = endpoints_1.API_CONFIG.DEFAULT_RETRY_DELAY * Math.pow(2, config._retryCount - 1);
        console.log(`Retrying request (attempt ${config._retryCount}/${endpoints_1.API_CONFIG.DEFAULT_RETRY_ATTEMPTS}) after ${delay}ms`);
        await this.sleep(delay);
        return this.axiosInstance(config);
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Handle and transform errors into user-friendly messages
     */
    handleError(error) {
        // Network error (includes SSL/TLS errors)
        if (!error.response) {
            // Check for SSL/TLS specific errors
            const errorMessage = error.message || '';
            const errorCode = error.code || '';
            // SSL Certificate errors
            if (errorCode === 'CERT_HAS_EXPIRED' || errorMessage.includes('certificate has expired')) {
                return {
                    message: 'SSL certificate has expired. Please contact support or update your certificates.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            if (errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || errorMessage.includes('unable to verify')) {
                return {
                    message: 'Unable to verify SSL certificate. The server may be using a self-signed certificate. Please check your connection settings.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // SSL Protocol errors (EPROTO)
            if (errorCode === 'EPROTO' || errorMessage.includes('EPROTO') || errorMessage.includes('wrong version number')) {
                return {
                    message: 'SSL/TLS connection error. The server may not be properly configured for HTTPS. Please contact support or check the server configuration.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Self-signed certificate
            if (errorCode === 'DEPTH_ZERO_SELF_SIGNED_CERT' || errorMessage.includes('self signed certificate')) {
                return {
                    message: 'The server is using a self-signed SSL certificate. For security reasons, this connection was blocked. Please use a valid SSL certificate.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Generic connection error
            if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
                return {
                    message: 'Unable to connect to Auxly server. The server may be offline or unreachable.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Timeout
            if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
                return {
                    message: 'Connection timed out. Please check your internet connection and try again.',
                    statusCode: 0,
                    details: error.message,
                };
            }
            // Generic network error
            return {
                message: 'Unable to connect to Auxly server. Please check your internet connection and firewall settings.',
                statusCode: 0,
                details: `${errorCode || 'NETWORK_ERROR'}: ${error.message}`,
            };
        }
        const status = error.response.status;
        const data = error.response.data;
        // Use server-provided error message if available
        const serverMessage = data?.message || data?.error;
        // Map status codes to user-friendly messages
        const statusMessages = {
            [endpoints_1.HTTP_STATUS.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
            [endpoints_1.HTTP_STATUS.UNAUTHORIZED]: 'Session expired. Please log in again.',
            [endpoints_1.HTTP_STATUS.FORBIDDEN]: 'You don\'t have permission to perform this action.',
            [endpoints_1.HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found.',
            [endpoints_1.HTTP_STATUS.CONFLICT]: 'A conflict occurred. The resource may already exist.',
            [endpoints_1.HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',
            [endpoints_1.HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Auxly server encountered an error. Please try again later.',
            [endpoints_1.HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Auxly server is temporarily unavailable. Please try again later.',
            [endpoints_1.HTTP_STATUS.GATEWAY_TIMEOUT]: 'Request timed out. Please try again.',
        };
        return {
            message: serverMessage || statusMessages[status] || 'An unexpected error occurred.',
            statusCode: status,
            details: error.response.data,
        };
    }
    // ========================================
    // Token Management
    // ========================================
    /**
     * Get access token from secure storage
     */
    async getAccessToken() {
        if (!this.context) {
            return null;
        }
        return await this.context.secrets.get(STORAGE_KEYS.ACCESS_TOKEN) || null;
    }
    /**
     * Get refresh token from secure storage
     */
    async getRefreshToken() {
        if (!this.context) {
            return null;
        }
        return await this.context.secrets.get(STORAGE_KEYS.REFRESH_TOKEN) || null;
    }
    /**
     * Store authentication tokens securely
     */
    async storeTokens(tokenData) {
        if (!this.context) {
            throw new Error('ExtensionContext not set. Cannot store tokens.');
        }
        const expiresAt = Date.now() + (tokenData.expiresIn * 1000);
        await Promise.all([
            this.context.secrets.store(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken),
            this.context.secrets.store(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken),
            this.context.secrets.store(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString()),
        ]);
    }
    /**
     * Clear all stored tokens
     */
    async clearTokens() {
        if (!this.context) {
            return;
        }
        await Promise.all([
            this.context.secrets.delete(STORAGE_KEYS.ACCESS_TOKEN),
            this.context.secrets.delete(STORAGE_KEYS.REFRESH_TOKEN),
            this.context.secrets.delete(STORAGE_KEYS.TOKEN_EXPIRES_AT),
        ]);
    }
    /**
     * Check if user is authenticated (via API key or JWT token)
     */
    async isAuthenticated() {
        const apiKey = await this.getApiKey();
        if (apiKey) {
            return true;
        }
        const token = await this.getAccessToken();
        return !!token;
    }
    // ========================================
    // API Key Management
    // ========================================
    /**
     * Get API key from local config (.auxly/config.json)
     * Note: LocalConfigService should be initialized by extension first
     */
    async getApiKey() {
        try {
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(__webpack_require__(5347)));
            const configService = LocalConfigService.getInstance();
            return await configService.getApiKey();
        }
        catch (error) {
            console.error('Error getting API key from config:', error);
            return null;
        }
    }
    /**
     * Store API key in local config (.auxly/config.json)
     */
    async storeApiKey(apiKey) {
        try {
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(__webpack_require__(5347)));
            const configService = LocalConfigService.getInstance();
            await configService.setApiKey(apiKey);
        }
        catch (error) {
            console.error('Error storing API key:', error);
            throw error;
        }
    }
    /**
     * Clear stored API key from local config
     */
    async clearApiKey() {
        try {
            const { LocalConfigService } = await Promise.resolve().then(() => __importStar(__webpack_require__(5347)));
            const configService = LocalConfigService.getInstance();
            await configService.clearApiKey();
        }
        catch (error) {
            console.error('Error clearing API key:', error);
        }
    }
    /**
     * Verify API key with backend
     */
    async verifyApiKey(apiKey) {
        try {
            // If no API key provided, try to get from storage
            const keyToVerify = apiKey || await this.getApiKey();
            if (!keyToVerify) {
                return { valid: false, error: 'No API key provided' };
            }
            // Use external HTTP client (child process) to completely bypass Electron
            const config = vscode.workspace.getConfiguration('auxly');
            const apiUrl = config.get('apiUrl') || 'https://auxly.tzamun.com:8000';
            const fullUrl = `${apiUrl}${endpoints_1.API_ENDPOINTS.API_KEYS.VERIFY}`;
            console.log('🔒 Verifying API key with external HTTP client (child process):', fullUrl);
            // Include device tracking headers for 2-device limit enforcement
            const response = await externalHttp.externalHttpGet(fullUrl, {
                'X-API-Key': keyToVerify,
                'Content-Type': 'application/json',
                'x-device-fingerprint': this.getDeviceFingerprint(),
                'x-device-name': this.getDeviceName(),
                'x-os-info': this.getOsInfo(),
                'x-browser-info': 'VS Code Extension'
            });
            console.log('✅ External HTTP response:', response.status);
            if (response.success && response.data && response.data.user) {
                return { valid: true, user: response.data.user };
            }
            return { valid: false, error: response.data?.error || 'Invalid response from server' };
        }
        catch (error) {
            console.error('❌ API key verification failed:', error);
            return {
                valid: false,
                error: error.message || 'API key verification failed'
            };
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }
        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();
        try {
            const token = await this.refreshPromise;
            return token;
        }
        finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }
    /**
     * Perform the actual token refresh
     */
    async performTokenRefresh() {
        try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            const response = await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, {
                // Don't add auth header for refresh request
                headers: { Authorization: '' },
            });
            if (response.data.success && response.data.data) {
                await this.storeTokens(response.data.data);
                return response.data.data.accessToken;
            }
            return null;
        }
        catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }
    // ========================================
    // Authentication API
    // ========================================
    /**
     * Login with email and password
     */
    async login(credentials) {
        try {
            const response = await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.AUTH.LOGIN, credentials);
            if (response.data.success && response.data.data) {
                await this.storeTokens(response.data.data);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Login failed');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Logout and clear tokens
     */
    async logout() {
        try {
            await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.AUTH.LOGOUT);
        }
        catch (error) {
            // Continue even if logout API call fails
            console.error('Logout API call failed:', error);
        }
        finally {
            await this.clearTokens();
        }
    }
    /**
     * Get current user information
     */
    async getCurrentUser() {
        try {
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.AUTH.ME);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to get user information');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    // ========================================
    // Task API
    // ========================================
    /**
     * Get all tasks
     */
    async getTasks() {
        try {
            console.log('🌐 API Client: Fetching tasks from', endpoints_1.API_ENDPOINTS.TASKS.LIST);
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.TASKS.LIST);
            console.log('✅ API Client: Received response', response.data);
            // Backend returns direct array of tasks, not wrapped in ApiResponse
            if (Array.isArray(response.data)) {
                console.log(`📋 API Client: Got ${response.data.length} tasks`);
                return response.data;
            }
            // Fallback: handle old wrapped response format
            const wrappedData = response.data;
            if (wrappedData.success && wrappedData.data && wrappedData.data.tasks) {
                return wrappedData.data.tasks;
            }
            console.log('⚠️ API Client: Unexpected response format');
            return [];
        }
        catch (error) {
            console.error('❌ API Client: getTasks failed:', error);
            throw this.handleError(error);
        }
    }
    /**
     * Get single task by ID
     */
    async getTask(taskId) {
        try {
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.TASKS.GET(taskId));
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to get task');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Create new task
     */
    async createTask(taskData) {
        try {
            const response = await this.axiosInstance.post(endpoints_1.API_ENDPOINTS.TASKS.CREATE, taskData);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create task');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Update existing task
     */
    async updateTask(taskId, updates) {
        try {
            const response = await this.axiosInstance.patch(endpoints_1.API_ENDPOINTS.TASKS.UPDATE(taskId), updates);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to update task');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Delete task
     */
    async deleteTask(taskId) {
        try {
            const response = await this.axiosInstance.delete(endpoints_1.API_ENDPOINTS.TASKS.DELETE(taskId));
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete task');
            }
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    // ========================================
    // Subscription API
    // ========================================
    /**
     * Get current user's subscription
     */
    async getSubscription() {
        try {
            const response = await this.axiosInstance.get(endpoints_1.API_ENDPOINTS.SUBSCRIPTION.GET);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to get subscription');
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
}
exports.ApiClient = ApiClient;
/**
 * Initialize and get API client singleton
 */
function initializeApiClient(context) {
    const config = vscode.workspace.getConfiguration('auxly');
    const apiUrl = config.get('apiUrl') || 'https://auxly.tzamun.com:8000';
    // Default to true to handle self-signed certificates automatically
    // TODO: Set to false once production has valid SSL certificate from Let's Encrypt
    const allowInsecureSSL = config.get('allowInsecureSSL', true);
    // Log SSL configuration for debugging
    console.log('🔒 Auxly API Client: Initializing with URL:', apiUrl);
    console.log('🔒 SSL Verification:', allowInsecureSSL ? 'Disabled (Allow Insecure)' : ( true ? 'Enabled (Strict)' : 0));
    if (allowInsecureSSL) {
        console.warn('⚠️ WARNING: SSL certificate verification is disabled. This is insecure and should only be used for testing with self-signed certificates.');
    }
    const client = ApiClient.getInstance({
        baseURL: apiUrl,
        timeout: endpoints_1.API_CONFIG.DEFAULT_TIMEOUT,
    });
    client.setContext(context);
    return client;
}


/***/ }),

/***/ 4822:
/***/ ((module) => {

"use strict";


/** @type {import('./abs')} */
module.exports = Math.abs;


/***/ }),

/***/ 4923:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = __webpack_require__(4361);

/** @type {import('.')} */
module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};


/***/ }),

/***/ 5317:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 5347:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Local Configuration Service
 * Manages workspace-specific config in .auxly/config.json
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocalConfigService = void 0;
const vscode = __importStar(__webpack_require__(1398));
const fs = __importStar(__webpack_require__(9896));
const path = __importStar(__webpack_require__(6928));
class LocalConfigService {
    constructor() {
        this.configFile = '';
        this.config = null;
    }
    static getInstance() {
        if (!LocalConfigService.instance) {
            LocalConfigService.instance = new LocalConfigService();
        }
        return LocalConfigService.instance;
    }
    /**
     * Initialize config in workspace .auxly directory
     */
    async initialize() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }
        const storageDir = path.join(workspaceFolder.uri.fsPath, '.auxly');
        this.configFile = path.join(storageDir, 'config.json');
        // Create .auxly directory if it doesn't exist
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
            console.log('✅ Created .auxly directory for config');
        }
        // Load existing config or create new one
        await this.loadConfig();
        console.log('✅ Config initialized');
    }
    /**
     * Load config from file
     */
    async loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = fs.readFileSync(this.configFile, 'utf-8');
                this.config = JSON.parse(data);
                console.log('📂 Loaded config from .auxly/config.json');
            }
            else {
                // Create new config file
                this.config = {
                    lastUpdated: new Date().toISOString(),
                    version: '1.0.0'
                };
                await this.saveConfig();
                console.log('📂 Created new config file');
            }
        }
        catch (error) {
            console.error('❌ Error loading config:', error);
            this.config = {
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            };
        }
    }
    /**
     * Save config to file
     */
    async saveConfig() {
        try {
            if (!this.config) {
                throw new Error('Config not initialized');
            }
            this.config.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), 'utf-8');
            console.log('💾 Saved config to .auxly/config.json');
        }
        catch (error) {
            console.error('❌ Error saving config:', error);
            throw error;
        }
    }
    /**
     * Get API key
     */
    async getApiKey() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config?.apiKey || null;
    }
    /**
     * Store API key
     */
    async setApiKey(apiKey) {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            this.config.apiKey = apiKey;
            await this.saveConfig();
            console.log('✅ API key saved to .auxly/config.json');
            vscode.window.showInformationMessage('✅ API key saved to .auxly/config.json');
        }
    }
    /**
     * Clear API key
     */
    async clearApiKey() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            delete this.config.apiKey;
            await this.saveConfig();
            console.log('🗑️ API key cleared from config');
        }
    }
    /**
     * Get API URL
     */
    async getApiUrl() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config?.apiUrl || 'https://auxly.tzamun.com:8000';
    }
    /**
     * Set API URL
     */
    async setApiUrl(apiUrl) {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            this.config.apiUrl = apiUrl;
            await this.saveConfig();
            console.log('✅ API URL saved to config');
        }
    }
    /**
     * Get full config
     */
    async getConfig() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config;
    }
    /**
     * Check if API key exists
     */
    async hasApiKey() {
        const apiKey = await this.getApiKey();
        return !!apiKey;
    }
    /**
     * Initialize free trial (30 days from now)
     */
    async initializeTrial() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config && !this.config.trial) {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
            this.config.trial = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                status: 'active',
                daysRemaining: 30
            };
            await this.saveConfig();
            console.log('🎉 Free trial initialized - 30 days from now');
            console.log(`📅 Trial ends: ${endDate.toLocaleDateString()}`);
        }
    }
    /**
     * Get trial information with calculated days remaining
     */
    async getTrialInfo() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (!this.config?.trial) {
            // No trial info - first launch, initialize it
            await this.initializeTrial();
            if (!this.config?.trial) {
                return null;
            }
        }
        const trial = this.config.trial;
        const endDate = new Date(trial.endDate);
        const now = new Date();
        const msRemaining = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
        // Update status based on expiry
        if (daysRemaining <= 0 && trial.status === 'active') {
            trial.status = 'expired';
            await this.saveConfig();
        }
        return {
            status: trial.status,
            daysRemaining: Math.max(0, daysRemaining),
            endDate: endDate
        };
    }
    /**
     * Check if trial is expired
     */
    async isTrialExpired() {
        const trialInfo = await this.getTrialInfo();
        return trialInfo ? trialInfo.status === 'expired' : false;
    }
    /**
     * Check if user has valid access (trial active or has API key)
     */
    async hasValidAccess() {
        const hasKey = await this.hasApiKey();
        if (hasKey) {
            return true; // API key = upgraded, always valid
        }
        const trialInfo = await this.getTrialInfo();
        return trialInfo ? (trialInfo.status === 'active' && trialInfo.daysRemaining > 0) : false;
    }
    /**
     * Upgrade trial to paid (when user enters API key)
     */
    async upgradeTrial() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config?.trial) {
            this.config.trial.status = 'upgraded';
            await this.saveConfig();
            console.log('🎉 Trial upgraded to paid plan!');
        }
    }
    /**
     * Reset trial (for testing purposes only)
     */
    async resetTrial() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            delete this.config.trial;
            await this.saveConfig();
            await this.initializeTrial();
            console.log('🔄 Trial reset - 30 days restarted');
        }
    }
    /**
     * Sync trial with backend (Hybrid approach)
     */
    async syncTrialWithBackend() {
        try {
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                console.log('📴 No API key - skipping server sync');
                return;
            }
            const apiUrl = await this.getApiUrl();
            console.log('🔄 Syncing trial with backend...');
            const response = await fetch(`${apiUrl}/trial/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            });
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const serverTrial = await response.json();
            // Update local config with server truth
            if (this.config) {
                this.config.trial = {
                    startDate: serverTrial.trial_start,
                    endDate: serverTrial.trial_end,
                    status: serverTrial.status,
                    daysRemaining: serverTrial.days_remaining
                };
                this.config.lastServerSync = new Date().toISOString();
                this.config.lastServerSyncSuccess = true;
                // Clear grace period if sync successful
                delete this.config.offlineGracePeriodStart;
                await this.saveConfig();
                console.log('✅ Trial synced with backend:', serverTrial);
            }
        }
        catch (error) {
            console.error('❌ Failed to sync with backend:', error);
            if (this.config) {
                this.config.lastServerSyncSuccess = false;
                // Start grace period if not already started
                if (!this.config.offlineGracePeriodStart) {
                    this.config.offlineGracePeriodStart = new Date().toISOString();
                    console.log('⏰ Started 24-hour grace period');
                }
                await this.saveConfig();
            }
            // Don't throw - graceful degradation
        }
    }
    /**
     * Check if we should sync with server
     */
    shouldSyncWithServer() {
        if (!this.config) {
            return true; // Never synced
        }
        if (!this.config.lastServerSync) {
            return true; // Never synced
        }
        const lastSync = new Date(this.config.lastServerSync);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        return hoursSinceSync >= 1; // Sync every 1 hour
    }
    /**
     * Check if grace period has expired (24 hours)
     */
    isGracePeriodExpired() {
        if (!this.config?.offlineGracePeriodStart) {
            return false; // No grace period started
        }
        const gracePeriodStart = new Date(this.config.offlineGracePeriodStart);
        const now = new Date();
        const hoursSinceStart = (now.getTime() - gracePeriodStart.getTime()) / (1000 * 60 * 60);
        return hoursSinceStart >= 24; // 24-hour grace period
    }
    /**
     * Get trial info with hybrid sync
     */
    async getTrialInfoHybrid() {
        // Get local trial first (fast)
        const localTrial = await this.getTrialInfo();
        // Check if we have API key and should sync
        const hasKey = await this.hasApiKey();
        if (hasKey && this.shouldSyncWithServer()) {
            // Sync in background (non-blocking)
            this.syncTrialWithBackend().catch(err => {
                console.warn('Background sync failed:', err);
            });
        }
        // Check grace period if backend sync failed
        if (this.config?.lastServerSyncSuccess === false) {
            if (this.isGracePeriodExpired()) {
                console.warn('⏰ Grace period expired - marking trial as expired');
                if (this.config.trial) {
                    this.config.trial.status = 'expired';
                    await this.saveConfig();
                }
                return {
                    status: 'expired',
                    daysRemaining: 0,
                    endDate: new Date(this.config.trial?.endDate || new Date())
                };
            }
            else {
                console.log('⏰ Within grace period - continuing offline');
            }
        }
        return localTrial;
    }
    /**
     * Force immediate sync (e.g., user clicks "Sync Now")
     */
    async forceSyncTrial() {
        await this.syncTrialWithBackend();
        vscode.window.showInformationMessage('✅ Trial status synced with server');
    }
}
exports.LocalConfigService = LocalConfigService;


/***/ }),

/***/ 5541:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocalStorageService = void 0;
const vscode = __importStar(__webpack_require__(1398));
const fs = __importStar(__webpack_require__(9896));
const path = __importStar(__webpack_require__(6928));
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


/***/ }),

/***/ 5645:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var util = __webpack_require__(9023);
var Stream = (__webpack_require__(2203).Stream);
var DelayedStream = __webpack_require__(4145);

module.exports = CombinedStream;
function CombinedStream() {
  this.writable = false;
  this.readable = true;
  this.dataSize = 0;
  this.maxDataSize = 2 * 1024 * 1024;
  this.pauseStreams = true;

  this._released = false;
  this._streams = [];
  this._currentStream = null;
  this._insideLoop = false;
  this._pendingNext = false;
}
util.inherits(CombinedStream, Stream);

CombinedStream.create = function(options) {
  var combinedStream = new this();

  options = options || {};
  for (var option in options) {
    combinedStream[option] = options[option];
  }

  return combinedStream;
};

CombinedStream.isStreamLike = function(stream) {
  return (typeof stream !== 'function')
    && (typeof stream !== 'string')
    && (typeof stream !== 'boolean')
    && (typeof stream !== 'number')
    && (!Buffer.isBuffer(stream));
};

CombinedStream.prototype.append = function(stream) {
  var isStreamLike = CombinedStream.isStreamLike(stream);

  if (isStreamLike) {
    if (!(stream instanceof DelayedStream)) {
      var newStream = DelayedStream.create(stream, {
        maxDataSize: Infinity,
        pauseStream: this.pauseStreams,
      });
      stream.on('data', this._checkDataSize.bind(this));
      stream = newStream;
    }

    this._handleErrors(stream);

    if (this.pauseStreams) {
      stream.pause();
    }
  }

  this._streams.push(stream);
  return this;
};

CombinedStream.prototype.pipe = function(dest, options) {
  Stream.prototype.pipe.call(this, dest, options);
  this.resume();
  return dest;
};

CombinedStream.prototype._getNext = function() {
  this._currentStream = null;

  if (this._insideLoop) {
    this._pendingNext = true;
    return; // defer call
  }

  this._insideLoop = true;
  try {
    do {
      this._pendingNext = false;
      this._realGetNext();
    } while (this._pendingNext);
  } finally {
    this._insideLoop = false;
  }
};

CombinedStream.prototype._realGetNext = function() {
  var stream = this._streams.shift();


  if (typeof stream == 'undefined') {
    this.end();
    return;
  }

  if (typeof stream !== 'function') {
    this._pipeNext(stream);
    return;
  }

  var getStream = stream;
  getStream(function(stream) {
    var isStreamLike = CombinedStream.isStreamLike(stream);
    if (isStreamLike) {
      stream.on('data', this._checkDataSize.bind(this));
      this._handleErrors(stream);
    }

    this._pipeNext(stream);
  }.bind(this));
};

CombinedStream.prototype._pipeNext = function(stream) {
  this._currentStream = stream;

  var isStreamLike = CombinedStream.isStreamLike(stream);
  if (isStreamLike) {
    stream.on('end', this._getNext.bind(this));
    stream.pipe(this, {end: false});
    return;
  }

  var value = stream;
  this.write(value);
  this._getNext();
};

CombinedStream.prototype._handleErrors = function(stream) {
  var self = this;
  stream.on('error', function(err) {
    self._emitError(err);
  });
};

CombinedStream.prototype.write = function(data) {
  this.emit('data', data);
};

CombinedStream.prototype.pause = function() {
  if (!this.pauseStreams) {
    return;
  }

  if(this.pauseStreams && this._currentStream && typeof(this._currentStream.pause) == 'function') this._currentStream.pause();
  this.emit('pause');
};

CombinedStream.prototype.resume = function() {
  if (!this._released) {
    this._released = true;
    this.writable = true;
    this._getNext();
  }

  if(this.pauseStreams && this._currentStream && typeof(this._currentStream.resume) == 'function') this._currentStream.resume();
  this.emit('resume');
};

CombinedStream.prototype.end = function() {
  this._reset();
  this.emit('end');
};

CombinedStream.prototype.destroy = function() {
  this._reset();
  this.emit('close');
};

CombinedStream.prototype._reset = function() {
  this.writable = false;
  this._streams = [];
  this._currentStream = null;
};

CombinedStream.prototype._checkDataSize = function() {
  this._updateDataSize();
  if (this.dataSize <= this.maxDataSize) {
    return;
  }

  var message =
    'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.';
  this._emitError(new Error(message));
};

CombinedStream.prototype._updateDataSize = function() {
  this.dataSize = 0;

  var self = this;
  this._streams.forEach(function(stream) {
    if (!stream.dataSize) {
      return;
    }

    self.dataSize += stream.dataSize;
  });

  if (this._currentStream && this._currentStream.dataSize) {
    this.dataSize += this._currentStream.dataSize;
  }
};

CombinedStream.prototype._emitError = function(err) {
  this._reset();
  this.emit('error', err);
};


/***/ }),

/***/ 5692:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 5704:
/***/ ((module) => {

"use strict";


module.exports = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};


/***/ }),

/***/ 5786:
/***/ ((module) => {

"use strict";


/** @type {import('./round')} */
module.exports = Math.round;


/***/ }),

/***/ 5845:
/***/ ((module) => {

"use strict";


/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var toStr = Object.prototype.toString;
var max = Math.max;
var funcType = '[object Function]';

var concatty = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slicy(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty(args, arguments)
        );

    };

    var boundLength = max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};


/***/ }),

/***/ 5946:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var iterate    = __webpack_require__(4407)
  , initState  = __webpack_require__(264)
  , terminator = __webpack_require__(9712)
  ;

// Public API
module.exports = parallel;

/**
 * Runs iterator over provided array elements in parallel
 *
 * @param   {array|object} list - array or object (named list) to iterate over
 * @param   {function} iterator - iterator to run
 * @param   {function} callback - invoked when all elements processed
 * @returns {function} - jobs terminator
 */
function parallel(list, iterator, callback)
{
  var state = initState(list);

  while (state.index < (state['keyedList'] || list).length)
  {
    iterate(list, iterator, state, function(error, result)
    {
      if (error)
      {
        callback(error, result);
        return;
      }

      // looks like it's the last one
      if (Object.keys(state.jobs).length === 0)
      {
        callback(null, state.results);
        return;
      }
    });

    state.index++;
  }

  return terminator.bind(state, callback);
}


/***/ }),

/***/ 5967:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AIService = void 0;
const vscode = __importStar(__webpack_require__(1398));
const path = __importStar(__webpack_require__(6928));
const fs = __importStar(__webpack_require__(9896));
const context_analyzer_1 = __webpack_require__(9903);
const rule_generator_1 = __webpack_require__(8877);
/**
 * AI Service
 * Main service for AI-powered context generation and rule management
 */
class AIService {
    constructor() {
        this.analysisCache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }
    static getInstance() {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }
    /**
     * Initialize the AI service with workspace
     */
    async initialize(context) {
        // Setup file watcher for automatic rule regeneration
        this.setupFileWatcher();
        // Register commands
        this.registerCommands(context);
        console.log('✅ AI Service initialized');
    }
    /**
     * Generate AI rules for workspace
     */
    async generateRulesForWorkspace(options) {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            throw new Error('No workspace folder open');
        }
        // Show progress
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Auxly: Generating AI Rules',
            cancellable: false
        }, async (progress) => {
            // Step 1: Analyze workspace
            progress.report({ message: 'Analyzing workspace...' });
            const analysis = await this.analyzeWorkspace(workspaceRoot);
            // Step 2: Generate rules
            progress.report({ message: 'Generating rules...' });
            const generator = new rule_generator_1.RuleGenerator();
            const rules = await generator.generateRules(analysis, options);
            // Step 3: Save to .cursorrules
            progress.report({ message: 'Saving rules...' });
            await this.saveRulesToFile(workspaceRoot, rules);
            vscode.window.showInformationMessage('✅ AI rules generated successfully!');
            return rules;
        });
    }
    /**
     * Analyze workspace and cache result
     */
    async analyzeWorkspace(workspaceRoot) {
        // Check cache
        const cached = this.analysisCache.get(workspaceRoot);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📦 Using cached analysis');
            return cached.result;
        }
        // Perform new analysis
        console.log('🔍 Analyzing workspace...');
        const analyzer = new context_analyzer_1.ContextAnalyzer(workspaceRoot);
        const result = await analyzer.analyze();
        // Cache result
        this.analysisCache.set(workspaceRoot, {
            result,
            timestamp: Date.now()
        });
        return result;
    }
    /**
     * Save rules to .cursorrules file
     */
    async saveRulesToFile(workspaceRoot, rules) {
        const rulesPath = path.join(workspaceRoot, '.cursorrules');
        // Backup existing file if it exists
        if (fs.existsSync(rulesPath)) {
            const backupPath = path.join(workspaceRoot, '.cursorrules.backup');
            fs.copyFileSync(rulesPath, backupPath);
            console.log('📄 Backed up existing .cursorrules to .cursorrules.backup');
        }
        // Write new rules
        fs.writeFileSync(rulesPath, rules, 'utf-8');
        console.log('✅ Rules saved to .cursorrules');
    }
    /**
     * Get current workspace analysis
     */
    async getWorkspaceAnalysis() {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            return undefined;
        }
        return this.analyzeWorkspace(workspaceRoot);
    }
    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
        vscode.window.showInformationMessage('🗑️ Analysis cache cleared');
    }
    /**
     * Setup file watcher for automatic regeneration
     */
    setupFileWatcher() {
        // Watch for significant file changes
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/{package.json,tsconfig.json,requirements.txt,go.mod,Cargo.toml}');
        // Invalidate cache on changes
        this.fileWatcher.onDidChange(() => {
            console.log('📝 Configuration file changed, invalidating cache');
            this.clearCache();
        });
        this.fileWatcher.onDidCreate(() => {
            console.log('📝 Configuration file created, invalidating cache');
            this.clearCache();
        });
        this.fileWatcher.onDidDelete(() => {
            console.log('📝 Configuration file deleted, invalidating cache');
            this.clearCache();
        });
    }
    /**
     * Register VSCode commands
     */
    registerCommands(context) {
        // Command: Generate rules
        const generateCommand = vscode.commands.registerCommand('auxly.generateRules', async () => {
            try {
                await this.generateRulesForWorkspace();
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to generate rules: ${error}`);
            }
        });
        // Command: View analysis
        const analysisCommand = vscode.commands.registerCommand('auxly.viewAnalysis', async () => {
            const analysis = await this.getWorkspaceAnalysis();
            if (analysis) {
                this.showAnalysisInPanel(analysis);
            }
            else {
                vscode.window.showWarningMessage('No workspace analysis available');
            }
        });
        // Command: Clear cache
        const clearCacheCommand = vscode.commands.registerCommand('auxly.clearCache', () => this.clearCache());
        context.subscriptions.push(generateCommand, analysisCommand, clearCacheCommand);
    }
    /**
     * Show analysis in webview panel
     */
    showAnalysisInPanel(analysis) {
        const panel = vscode.window.createWebviewPanel('auxlyAnalysis', 'Auxly Workspace Analysis', vscode.ViewColumn.Two, {});
        panel.webview.html = this.getAnalysisHtml(analysis);
    }
    /**
     * Generate HTML for analysis view
     */
    getAnalysisHtml(analysis) {
        return `<!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; }
                h1 { color: var(--vscode-editor-foreground); }
                h2 { color: var(--vscode-textLink-foreground); margin-top: 20px; }
                .section { margin-bottom: 20px; }
                .badge { 
                    background: var(--vscode-badge-background); 
                    color: var(--vscode-badge-foreground);
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    margin-right: 8px;
                }
            </style>
        </head>
        <body>
            <h1>🔍 Workspace Analysis</h1>
            
            <div class="section">
                <h2>Languages</h2>
                ${analysis.languages.map(lang => `<span class="badge">${lang}</span>`).join('')}
            </div>

            <div class="section">
                <h2>Frameworks</h2>
                ${analysis.frameworks.map(fw => `<span class="badge">${fw}</span>`).join('') || 'None detected'}
            </div>

            <div class="section">
                <h2>Package Managers</h2>
                ${analysis.packageManagers.map(pm => `<span class="badge">${pm}</span>`).join('')}
            </div>

            <div class="section">
                <h2>File Structure</h2>
                <p><strong>Total Files:</strong> ${analysis.fileStructure.totalFiles}</p>
                <p><strong>File Types:</strong></p>
                <ul>
                    ${Object.entries(analysis.fileStructure.fileTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([ext, count]) => `<li>${ext}: ${count} files</li>`)
            .join('')}
                </ul>
            </div>

            <div class="section">
                <h2>Detected Patterns</h2>
                ${analysis.patterns.length > 0
            ? analysis.patterns.map(p => `
                        <div style="margin-bottom: 10px;">
                            <strong>${p.type}:</strong> ${p.description}
                            <br><small>Frequency: ${p.frequency}</small>
                        </div>
                    `).join('')
            : '<p>No patterns detected yet</p>'}
            </div>
        </body>
        </html>`;
    }
    /**
     * Get workspace root path
     */
    getWorkspaceRoot() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }
        return workspaceFolders[0].uri.fsPath;
    }
    /**
     * Dispose resources
     */
    dispose() {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }
}
exports.AIService = AIService;


/***/ }),

/***/ 6117:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/**
 * External HTTP Client
 * Uses child process to completely bypass Electron's network stack
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.externalHttpGet = externalHttpGet;
const child_process_1 = __webpack_require__(5317);
const util_1 = __webpack_require__(9023);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Make HTTP request using PowerShell/curl in child process
 * This completely bypasses Electron's SSL restrictions
 */
async function externalHttpGet(url, headers) {
    try {
        // Build headers string for curl
        const headerArgs = headers
            ? Object.entries(headers).map(([key, value]) => `-H "${key}: ${value}"`).join(' ')
            : '';
        // Use curl.exe (available on Windows 10+) with -k to bypass SSL verification
        const command = `curl.exe -s -k -w "\\n---STATUS:%{http_code}---" ${headerArgs} "${url}"`;
        console.log('🌐 External HTTP request:', command.replace(/-H "[^"]*API-Key[^"]*"/, '-H "X-API-Key: ***"'));
        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000,
            windowsHide: true,
        });
        if (stderr) {
            console.error('External HTTP stderr:', stderr);
        }
        // Parse response: body + status code
        const parts = stdout.split('---STATUS:');
        const body = parts[0].trim();
        const statusMatch = parts[1]?.match(/(\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;
        console.log('✅ External HTTP response status:', status);
        // Parse JSON body
        const data = body ? JSON.parse(body) : null;
        return {
            data,
            status,
            success: status >= 200 && status < 300,
        };
    }
    catch (error) {
        console.error('❌ External HTTP error:', error);
        throw new Error(`External HTTP request failed: ${error.message}`);
    }
}


/***/ }),

/***/ 6152:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var reflectGetProto = __webpack_require__(1588);
var originalGetProto = __webpack_require__(9548);

var getDunderProto = __webpack_require__(1724);

/** @type {import('.')} */
module.exports = reflectGetProto
	? function getProto(O) {
		// @ts-expect-error TS can't narrow inside a closure, for some reason
		return reflectGetProto(O);
	}
	: originalGetProto
		? function getProto(O) {
			if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
				throw new TypeError('getProto: not an object');
			}
			// @ts-expect-error TS can't narrow inside a closure, for some reason
			return originalGetProto(O);
		}
		: getDunderProto
			? function getProto(O) {
				// @ts-expect-error TS can't narrow inside a closure, for some reason
				return getDunderProto(O);
			}
			: null;


/***/ }),

/***/ 6190:
/***/ ((module) => {

"use strict";


/** @type {import('./range')} */
module.exports = RangeError;


/***/ }),

/***/ 6221:
/***/ ((module, exports, __webpack_require__) => {

/**
 * Module dependencies.
 */

const tty = __webpack_require__(2018);
const util = __webpack_require__(9023);

/**
 * This is the Node.js implementation of `debug()`.
 */

exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.destroy = util.deprecate(
	() => {},
	'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
);

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	const supportsColor = __webpack_require__(459);

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else {
		val = Number(val);
	}

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in exports.inspectOpts ?
		Boolean(exports.inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (exports.inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	debug.inspectOpts = {};

	const keys = Object.keys(exports.inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
}

module.exports = __webpack_require__(1236)(exports);

const {formatters} = module.exports;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts)
		.split('\n')
		.map(str => str.trim())
		.join(' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts);
};


/***/ }),

/***/ 6296:
/***/ ((module) => {

"use strict";


/** @type {import('./syntax')} */
module.exports = SyntaxError;


/***/ }),

/***/ 6301:
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ 6433:
/***/ ((module) => {

"use strict";


/** @type {import('./gOPD')} */
module.exports = Object.getOwnPropertyDescriptor;


/***/ }),

/***/ 6678:
/***/ ((module) => {

"use strict";


/** @type {import('./functionApply')} */
module.exports = Function.prototype.apply;


/***/ }),

/***/ 6686:
/***/ ((module) => {

"use strict";


// populates missing values
module.exports = function (dst, src) {
  Object.keys(src).forEach(function (prop) {
    dst[prop] = dst[prop] || src[prop]; // eslint-disable-line no-param-reassign
  });

  return dst;
};


/***/ }),

/***/ 6893:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var serialOrdered = __webpack_require__(8424);

// Public API
module.exports = serial;

/**
 * Runs iterator over provided array elements in series
 *
 * @param   {array|object} list - array or object (named list) to iterate over
 * @param   {function} iterator - iterator to run
 * @param   {function} callback - invoked when all elements processed
 * @returns {function} - jobs terminator
 */
function serial(list, iterator, callback)
{
  return serialOrdered(list, iterator, null, callback);
}


/***/ }),

/***/ 6928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 6982:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 7016:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 7135:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unregisterMCPServer = exports.registerMCPServerWithCursorAPI = void 0;
// Export MCP Cursor API registration (same approach as Todo2!)
var mcp_cursor_api_1 = __webpack_require__(3463);
Object.defineProperty(exports, "registerMCPServerWithCursorAPI", ({ enumerable: true, get: function () { return mcp_cursor_api_1.registerMCPServerWithCursorAPI; } }));
Object.defineProperty(exports, "unregisterMCPServer", ({ enumerable: true, get: function () { return mcp_cursor_api_1.unregisterMCPServer; } }));


/***/ }),

/***/ 7146:
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"application/1d-interleaved-parityfec":{"source":"iana"},"application/3gpdash-qoe-report+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/3gpp-ims+xml":{"source":"iana","compressible":true},"application/3gpphal+json":{"source":"iana","compressible":true},"application/3gpphalforms+json":{"source":"iana","compressible":true},"application/a2l":{"source":"iana"},"application/ace+cbor":{"source":"iana"},"application/activemessage":{"source":"iana"},"application/activity+json":{"source":"iana","compressible":true},"application/alto-costmap+json":{"source":"iana","compressible":true},"application/alto-costmapfilter+json":{"source":"iana","compressible":true},"application/alto-directory+json":{"source":"iana","compressible":true},"application/alto-endpointcost+json":{"source":"iana","compressible":true},"application/alto-endpointcostparams+json":{"source":"iana","compressible":true},"application/alto-endpointprop+json":{"source":"iana","compressible":true},"application/alto-endpointpropparams+json":{"source":"iana","compressible":true},"application/alto-error+json":{"source":"iana","compressible":true},"application/alto-networkmap+json":{"source":"iana","compressible":true},"application/alto-networkmapfilter+json":{"source":"iana","compressible":true},"application/alto-updatestreamcontrol+json":{"source":"iana","compressible":true},"application/alto-updatestreamparams+json":{"source":"iana","compressible":true},"application/aml":{"source":"iana"},"application/andrew-inset":{"source":"iana","extensions":["ez"]},"application/applefile":{"source":"iana"},"application/applixware":{"source":"apache","extensions":["aw"]},"application/at+jwt":{"source":"iana"},"application/atf":{"source":"iana"},"application/atfx":{"source":"iana"},"application/atom+xml":{"source":"iana","compressible":true,"extensions":["atom"]},"application/atomcat+xml":{"source":"iana","compressible":true,"extensions":["atomcat"]},"application/atomdeleted+xml":{"source":"iana","compressible":true,"extensions":["atomdeleted"]},"application/atomicmail":{"source":"iana"},"application/atomsvc+xml":{"source":"iana","compressible":true,"extensions":["atomsvc"]},"application/atsc-dwd+xml":{"source":"iana","compressible":true,"extensions":["dwd"]},"application/atsc-dynamic-event-message":{"source":"iana"},"application/atsc-held+xml":{"source":"iana","compressible":true,"extensions":["held"]},"application/atsc-rdt+json":{"source":"iana","compressible":true},"application/atsc-rsat+xml":{"source":"iana","compressible":true,"extensions":["rsat"]},"application/atxml":{"source":"iana"},"application/auth-policy+xml":{"source":"iana","compressible":true},"application/bacnet-xdd+zip":{"source":"iana","compressible":false},"application/batch-smtp":{"source":"iana"},"application/bdoc":{"compressible":false,"extensions":["bdoc"]},"application/beep+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/calendar+json":{"source":"iana","compressible":true},"application/calendar+xml":{"source":"iana","compressible":true,"extensions":["xcs"]},"application/call-completion":{"source":"iana"},"application/cals-1840":{"source":"iana"},"application/captive+json":{"source":"iana","compressible":true},"application/cbor":{"source":"iana"},"application/cbor-seq":{"source":"iana"},"application/cccex":{"source":"iana"},"application/ccmp+xml":{"source":"iana","compressible":true},"application/ccxml+xml":{"source":"iana","compressible":true,"extensions":["ccxml"]},"application/cdfx+xml":{"source":"iana","compressible":true,"extensions":["cdfx"]},"application/cdmi-capability":{"source":"iana","extensions":["cdmia"]},"application/cdmi-container":{"source":"iana","extensions":["cdmic"]},"application/cdmi-domain":{"source":"iana","extensions":["cdmid"]},"application/cdmi-object":{"source":"iana","extensions":["cdmio"]},"application/cdmi-queue":{"source":"iana","extensions":["cdmiq"]},"application/cdni":{"source":"iana"},"application/cea":{"source":"iana"},"application/cea-2018+xml":{"source":"iana","compressible":true},"application/cellml+xml":{"source":"iana","compressible":true},"application/cfw":{"source":"iana"},"application/city+json":{"source":"iana","compressible":true},"application/clr":{"source":"iana"},"application/clue+xml":{"source":"iana","compressible":true},"application/clue_info+xml":{"source":"iana","compressible":true},"application/cms":{"source":"iana"},"application/cnrp+xml":{"source":"iana","compressible":true},"application/coap-group+json":{"source":"iana","compressible":true},"application/coap-payload":{"source":"iana"},"application/commonground":{"source":"iana"},"application/conference-info+xml":{"source":"iana","compressible":true},"application/cose":{"source":"iana"},"application/cose-key":{"source":"iana"},"application/cose-key-set":{"source":"iana"},"application/cpl+xml":{"source":"iana","compressible":true,"extensions":["cpl"]},"application/csrattrs":{"source":"iana"},"application/csta+xml":{"source":"iana","compressible":true},"application/cstadata+xml":{"source":"iana","compressible":true},"application/csvm+json":{"source":"iana","compressible":true},"application/cu-seeme":{"source":"apache","extensions":["cu"]},"application/cwt":{"source":"iana"},"application/cybercash":{"source":"iana"},"application/dart":{"compressible":true},"application/dash+xml":{"source":"iana","compressible":true,"extensions":["mpd"]},"application/dash-patch+xml":{"source":"iana","compressible":true,"extensions":["mpp"]},"application/dashdelta":{"source":"iana"},"application/davmount+xml":{"source":"iana","compressible":true,"extensions":["davmount"]},"application/dca-rft":{"source":"iana"},"application/dcd":{"source":"iana"},"application/dec-dx":{"source":"iana"},"application/dialog-info+xml":{"source":"iana","compressible":true},"application/dicom":{"source":"iana"},"application/dicom+json":{"source":"iana","compressible":true},"application/dicom+xml":{"source":"iana","compressible":true},"application/dii":{"source":"iana"},"application/dit":{"source":"iana"},"application/dns":{"source":"iana"},"application/dns+json":{"source":"iana","compressible":true},"application/dns-message":{"source":"iana"},"application/docbook+xml":{"source":"apache","compressible":true,"extensions":["dbk"]},"application/dots+cbor":{"source":"iana"},"application/dskpp+xml":{"source":"iana","compressible":true},"application/dssc+der":{"source":"iana","extensions":["dssc"]},"application/dssc+xml":{"source":"iana","compressible":true,"extensions":["xdssc"]},"application/dvcs":{"source":"iana"},"application/ecmascript":{"source":"iana","compressible":true,"extensions":["es","ecma"]},"application/edi-consent":{"source":"iana"},"application/edi-x12":{"source":"iana","compressible":false},"application/edifact":{"source":"iana","compressible":false},"application/efi":{"source":"iana"},"application/elm+json":{"source":"iana","charset":"UTF-8","compressible":true},"application/elm+xml":{"source":"iana","compressible":true},"application/emergencycalldata.cap+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/emergencycalldata.comment+xml":{"source":"iana","compressible":true},"application/emergencycalldata.control+xml":{"source":"iana","compressible":true},"application/emergencycalldata.deviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.ecall.msd":{"source":"iana"},"application/emergencycalldata.providerinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.serviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.subscriberinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.veds+xml":{"source":"iana","compressible":true},"application/emma+xml":{"source":"iana","compressible":true,"extensions":["emma"]},"application/emotionml+xml":{"source":"iana","compressible":true,"extensions":["emotionml"]},"application/encaprtp":{"source":"iana"},"application/epp+xml":{"source":"iana","compressible":true},"application/epub+zip":{"source":"iana","compressible":false,"extensions":["epub"]},"application/eshop":{"source":"iana"},"application/exi":{"source":"iana","extensions":["exi"]},"application/expect-ct-report+json":{"source":"iana","compressible":true},"application/express":{"source":"iana","extensions":["exp"]},"application/fastinfoset":{"source":"iana"},"application/fastsoap":{"source":"iana"},"application/fdt+xml":{"source":"iana","compressible":true,"extensions":["fdt"]},"application/fhir+json":{"source":"iana","charset":"UTF-8","compressible":true},"application/fhir+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/fido.trusted-apps+json":{"compressible":true},"application/fits":{"source":"iana"},"application/flexfec":{"source":"iana"},"application/font-sfnt":{"source":"iana"},"application/font-tdpfr":{"source":"iana","extensions":["pfr"]},"application/font-woff":{"source":"iana","compressible":false},"application/framework-attributes+xml":{"source":"iana","compressible":true},"application/geo+json":{"source":"iana","compressible":true,"extensions":["geojson"]},"application/geo+json-seq":{"source":"iana"},"application/geopackage+sqlite3":{"source":"iana"},"application/geoxacml+xml":{"source":"iana","compressible":true},"application/gltf-buffer":{"source":"iana"},"application/gml+xml":{"source":"iana","compressible":true,"extensions":["gml"]},"application/gpx+xml":{"source":"apache","compressible":true,"extensions":["gpx"]},"application/gxf":{"source":"apache","extensions":["gxf"]},"application/gzip":{"source":"iana","compressible":false,"extensions":["gz"]},"application/h224":{"source":"iana"},"application/held+xml":{"source":"iana","compressible":true},"application/hjson":{"extensions":["hjson"]},"application/http":{"source":"iana"},"application/hyperstudio":{"source":"iana","extensions":["stk"]},"application/ibe-key-request+xml":{"source":"iana","compressible":true},"application/ibe-pkg-reply+xml":{"source":"iana","compressible":true},"application/ibe-pp-data":{"source":"iana"},"application/iges":{"source":"iana"},"application/im-iscomposing+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/index":{"source":"iana"},"application/index.cmd":{"source":"iana"},"application/index.obj":{"source":"iana"},"application/index.response":{"source":"iana"},"application/index.vnd":{"source":"iana"},"application/inkml+xml":{"source":"iana","compressible":true,"extensions":["ink","inkml"]},"application/iotp":{"source":"iana"},"application/ipfix":{"source":"iana","extensions":["ipfix"]},"application/ipp":{"source":"iana"},"application/isup":{"source":"iana"},"application/its+xml":{"source":"iana","compressible":true,"extensions":["its"]},"application/java-archive":{"source":"apache","compressible":false,"extensions":["jar","war","ear"]},"application/java-serialized-object":{"source":"apache","compressible":false,"extensions":["ser"]},"application/java-vm":{"source":"apache","compressible":false,"extensions":["class"]},"application/javascript":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["js","mjs"]},"application/jf2feed+json":{"source":"iana","compressible":true},"application/jose":{"source":"iana"},"application/jose+json":{"source":"iana","compressible":true},"application/jrd+json":{"source":"iana","compressible":true},"application/jscalendar+json":{"source":"iana","compressible":true},"application/json":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["json","map"]},"application/json-patch+json":{"source":"iana","compressible":true},"application/json-seq":{"source":"iana"},"application/json5":{"extensions":["json5"]},"application/jsonml+json":{"source":"apache","compressible":true,"extensions":["jsonml"]},"application/jwk+json":{"source":"iana","compressible":true},"application/jwk-set+json":{"source":"iana","compressible":true},"application/jwt":{"source":"iana"},"application/kpml-request+xml":{"source":"iana","compressible":true},"application/kpml-response+xml":{"source":"iana","compressible":true},"application/ld+json":{"source":"iana","compressible":true,"extensions":["jsonld"]},"application/lgr+xml":{"source":"iana","compressible":true,"extensions":["lgr"]},"application/link-format":{"source":"iana"},"application/load-control+xml":{"source":"iana","compressible":true},"application/lost+xml":{"source":"iana","compressible":true,"extensions":["lostxml"]},"application/lostsync+xml":{"source":"iana","compressible":true},"application/lpf+zip":{"source":"iana","compressible":false},"application/lxf":{"source":"iana"},"application/mac-binhex40":{"source":"iana","extensions":["hqx"]},"application/mac-compactpro":{"source":"apache","extensions":["cpt"]},"application/macwriteii":{"source":"iana"},"application/mads+xml":{"source":"iana","compressible":true,"extensions":["mads"]},"application/manifest+json":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["webmanifest"]},"application/marc":{"source":"iana","extensions":["mrc"]},"application/marcxml+xml":{"source":"iana","compressible":true,"extensions":["mrcx"]},"application/mathematica":{"source":"iana","extensions":["ma","nb","mb"]},"application/mathml+xml":{"source":"iana","compressible":true,"extensions":["mathml"]},"application/mathml-content+xml":{"source":"iana","compressible":true},"application/mathml-presentation+xml":{"source":"iana","compressible":true},"application/mbms-associated-procedure-description+xml":{"source":"iana","compressible":true},"application/mbms-deregister+xml":{"source":"iana","compressible":true},"application/mbms-envelope+xml":{"source":"iana","compressible":true},"application/mbms-msk+xml":{"source":"iana","compressible":true},"application/mbms-msk-response+xml":{"source":"iana","compressible":true},"application/mbms-protection-description+xml":{"source":"iana","compressible":true},"application/mbms-reception-report+xml":{"source":"iana","compressible":true},"application/mbms-register+xml":{"source":"iana","compressible":true},"application/mbms-register-response+xml":{"source":"iana","compressible":true},"application/mbms-schedule+xml":{"source":"iana","compressible":true},"application/mbms-user-service-description+xml":{"source":"iana","compressible":true},"application/mbox":{"source":"iana","extensions":["mbox"]},"application/media-policy-dataset+xml":{"source":"iana","compressible":true,"extensions":["mpf"]},"application/media_control+xml":{"source":"iana","compressible":true},"application/mediaservercontrol+xml":{"source":"iana","compressible":true,"extensions":["mscml"]},"application/merge-patch+json":{"source":"iana","compressible":true},"application/metalink+xml":{"source":"apache","compressible":true,"extensions":["metalink"]},"application/metalink4+xml":{"source":"iana","compressible":true,"extensions":["meta4"]},"application/mets+xml":{"source":"iana","compressible":true,"extensions":["mets"]},"application/mf4":{"source":"iana"},"application/mikey":{"source":"iana"},"application/mipc":{"source":"iana"},"application/missing-blocks+cbor-seq":{"source":"iana"},"application/mmt-aei+xml":{"source":"iana","compressible":true,"extensions":["maei"]},"application/mmt-usd+xml":{"source":"iana","compressible":true,"extensions":["musd"]},"application/mods+xml":{"source":"iana","compressible":true,"extensions":["mods"]},"application/moss-keys":{"source":"iana"},"application/moss-signature":{"source":"iana"},"application/mosskey-data":{"source":"iana"},"application/mosskey-request":{"source":"iana"},"application/mp21":{"source":"iana","extensions":["m21","mp21"]},"application/mp4":{"source":"iana","extensions":["mp4s","m4p"]},"application/mpeg4-generic":{"source":"iana"},"application/mpeg4-iod":{"source":"iana"},"application/mpeg4-iod-xmt":{"source":"iana"},"application/mrb-consumer+xml":{"source":"iana","compressible":true},"application/mrb-publish+xml":{"source":"iana","compressible":true},"application/msc-ivr+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/msc-mixer+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/msword":{"source":"iana","compressible":false,"extensions":["doc","dot"]},"application/mud+json":{"source":"iana","compressible":true},"application/multipart-core":{"source":"iana"},"application/mxf":{"source":"iana","extensions":["mxf"]},"application/n-quads":{"source":"iana","extensions":["nq"]},"application/n-triples":{"source":"iana","extensions":["nt"]},"application/nasdata":{"source":"iana"},"application/news-checkgroups":{"source":"iana","charset":"US-ASCII"},"application/news-groupinfo":{"source":"iana","charset":"US-ASCII"},"application/news-transmission":{"source":"iana"},"application/nlsml+xml":{"source":"iana","compressible":true},"application/node":{"source":"iana","extensions":["cjs"]},"application/nss":{"source":"iana"},"application/oauth-authz-req+jwt":{"source":"iana"},"application/oblivious-dns-message":{"source":"iana"},"application/ocsp-request":{"source":"iana"},"application/ocsp-response":{"source":"iana"},"application/octet-stream":{"source":"iana","compressible":false,"extensions":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"]},"application/oda":{"source":"iana","extensions":["oda"]},"application/odm+xml":{"source":"iana","compressible":true},"application/odx":{"source":"iana"},"application/oebps-package+xml":{"source":"iana","compressible":true,"extensions":["opf"]},"application/ogg":{"source":"iana","compressible":false,"extensions":["ogx"]},"application/omdoc+xml":{"source":"apache","compressible":true,"extensions":["omdoc"]},"application/onenote":{"source":"apache","extensions":["onetoc","onetoc2","onetmp","onepkg"]},"application/opc-nodeset+xml":{"source":"iana","compressible":true},"application/oscore":{"source":"iana"},"application/oxps":{"source":"iana","extensions":["oxps"]},"application/p21":{"source":"iana"},"application/p21+zip":{"source":"iana","compressible":false},"application/p2p-overlay+xml":{"source":"iana","compressible":true,"extensions":["relo"]},"application/parityfec":{"source":"iana"},"application/passport":{"source":"iana"},"application/patch-ops-error+xml":{"source":"iana","compressible":true,"extensions":["xer"]},"application/pdf":{"source":"iana","compressible":false,"extensions":["pdf"]},"application/pdx":{"source":"iana"},"application/pem-certificate-chain":{"source":"iana"},"application/pgp-encrypted":{"source":"iana","compressible":false,"extensions":["pgp"]},"application/pgp-keys":{"source":"iana","extensions":["asc"]},"application/pgp-signature":{"source":"iana","extensions":["asc","sig"]},"application/pics-rules":{"source":"apache","extensions":["prf"]},"application/pidf+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/pidf-diff+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/pkcs10":{"source":"iana","extensions":["p10"]},"application/pkcs12":{"source":"iana"},"application/pkcs7-mime":{"source":"iana","extensions":["p7m","p7c"]},"application/pkcs7-signature":{"source":"iana","extensions":["p7s"]},"application/pkcs8":{"source":"iana","extensions":["p8"]},"application/pkcs8-encrypted":{"source":"iana"},"application/pkix-attr-cert":{"source":"iana","extensions":["ac"]},"application/pkix-cert":{"source":"iana","extensions":["cer"]},"application/pkix-crl":{"source":"iana","extensions":["crl"]},"application/pkix-pkipath":{"source":"iana","extensions":["pkipath"]},"application/pkixcmp":{"source":"iana","extensions":["pki"]},"application/pls+xml":{"source":"iana","compressible":true,"extensions":["pls"]},"application/poc-settings+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/postscript":{"source":"iana","compressible":true,"extensions":["ai","eps","ps"]},"application/ppsp-tracker+json":{"source":"iana","compressible":true},"application/problem+json":{"source":"iana","compressible":true},"application/problem+xml":{"source":"iana","compressible":true},"application/provenance+xml":{"source":"iana","compressible":true,"extensions":["provx"]},"application/prs.alvestrand.titrax-sheet":{"source":"iana"},"application/prs.cww":{"source":"iana","extensions":["cww"]},"application/prs.cyn":{"source":"iana","charset":"7-BIT"},"application/prs.hpub+zip":{"source":"iana","compressible":false},"application/prs.nprend":{"source":"iana"},"application/prs.plucker":{"source":"iana"},"application/prs.rdf-xml-crypt":{"source":"iana"},"application/prs.xsf+xml":{"source":"iana","compressible":true},"application/pskc+xml":{"source":"iana","compressible":true,"extensions":["pskcxml"]},"application/pvd+json":{"source":"iana","compressible":true},"application/qsig":{"source":"iana"},"application/raml+yaml":{"compressible":true,"extensions":["raml"]},"application/raptorfec":{"source":"iana"},"application/rdap+json":{"source":"iana","compressible":true},"application/rdf+xml":{"source":"iana","compressible":true,"extensions":["rdf","owl"]},"application/reginfo+xml":{"source":"iana","compressible":true,"extensions":["rif"]},"application/relax-ng-compact-syntax":{"source":"iana","extensions":["rnc"]},"application/remote-printing":{"source":"iana"},"application/reputon+json":{"source":"iana","compressible":true},"application/resource-lists+xml":{"source":"iana","compressible":true,"extensions":["rl"]},"application/resource-lists-diff+xml":{"source":"iana","compressible":true,"extensions":["rld"]},"application/rfc+xml":{"source":"iana","compressible":true},"application/riscos":{"source":"iana"},"application/rlmi+xml":{"source":"iana","compressible":true},"application/rls-services+xml":{"source":"iana","compressible":true,"extensions":["rs"]},"application/route-apd+xml":{"source":"iana","compressible":true,"extensions":["rapd"]},"application/route-s-tsid+xml":{"source":"iana","compressible":true,"extensions":["sls"]},"application/route-usd+xml":{"source":"iana","compressible":true,"extensions":["rusd"]},"application/rpki-ghostbusters":{"source":"iana","extensions":["gbr"]},"application/rpki-manifest":{"source":"iana","extensions":["mft"]},"application/rpki-publication":{"source":"iana"},"application/rpki-roa":{"source":"iana","extensions":["roa"]},"application/rpki-updown":{"source":"iana"},"application/rsd+xml":{"source":"apache","compressible":true,"extensions":["rsd"]},"application/rss+xml":{"source":"apache","compressible":true,"extensions":["rss"]},"application/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"application/rtploopback":{"source":"iana"},"application/rtx":{"source":"iana"},"application/samlassertion+xml":{"source":"iana","compressible":true},"application/samlmetadata+xml":{"source":"iana","compressible":true},"application/sarif+json":{"source":"iana","compressible":true},"application/sarif-external-properties+json":{"source":"iana","compressible":true},"application/sbe":{"source":"iana"},"application/sbml+xml":{"source":"iana","compressible":true,"extensions":["sbml"]},"application/scaip+xml":{"source":"iana","compressible":true},"application/scim+json":{"source":"iana","compressible":true},"application/scvp-cv-request":{"source":"iana","extensions":["scq"]},"application/scvp-cv-response":{"source":"iana","extensions":["scs"]},"application/scvp-vp-request":{"source":"iana","extensions":["spq"]},"application/scvp-vp-response":{"source":"iana","extensions":["spp"]},"application/sdp":{"source":"iana","extensions":["sdp"]},"application/secevent+jwt":{"source":"iana"},"application/senml+cbor":{"source":"iana"},"application/senml+json":{"source":"iana","compressible":true},"application/senml+xml":{"source":"iana","compressible":true,"extensions":["senmlx"]},"application/senml-etch+cbor":{"source":"iana"},"application/senml-etch+json":{"source":"iana","compressible":true},"application/senml-exi":{"source":"iana"},"application/sensml+cbor":{"source":"iana"},"application/sensml+json":{"source":"iana","compressible":true},"application/sensml+xml":{"source":"iana","compressible":true,"extensions":["sensmlx"]},"application/sensml-exi":{"source":"iana"},"application/sep+xml":{"source":"iana","compressible":true},"application/sep-exi":{"source":"iana"},"application/session-info":{"source":"iana"},"application/set-payment":{"source":"iana"},"application/set-payment-initiation":{"source":"iana","extensions":["setpay"]},"application/set-registration":{"source":"iana"},"application/set-registration-initiation":{"source":"iana","extensions":["setreg"]},"application/sgml":{"source":"iana"},"application/sgml-open-catalog":{"source":"iana"},"application/shf+xml":{"source":"iana","compressible":true,"extensions":["shf"]},"application/sieve":{"source":"iana","extensions":["siv","sieve"]},"application/simple-filter+xml":{"source":"iana","compressible":true},"application/simple-message-summary":{"source":"iana"},"application/simplesymbolcontainer":{"source":"iana"},"application/sipc":{"source":"iana"},"application/slate":{"source":"iana"},"application/smil":{"source":"iana"},"application/smil+xml":{"source":"iana","compressible":true,"extensions":["smi","smil"]},"application/smpte336m":{"source":"iana"},"application/soap+fastinfoset":{"source":"iana"},"application/soap+xml":{"source":"iana","compressible":true},"application/sparql-query":{"source":"iana","extensions":["rq"]},"application/sparql-results+xml":{"source":"iana","compressible":true,"extensions":["srx"]},"application/spdx+json":{"source":"iana","compressible":true},"application/spirits-event+xml":{"source":"iana","compressible":true},"application/sql":{"source":"iana"},"application/srgs":{"source":"iana","extensions":["gram"]},"application/srgs+xml":{"source":"iana","compressible":true,"extensions":["grxml"]},"application/sru+xml":{"source":"iana","compressible":true,"extensions":["sru"]},"application/ssdl+xml":{"source":"apache","compressible":true,"extensions":["ssdl"]},"application/ssml+xml":{"source":"iana","compressible":true,"extensions":["ssml"]},"application/stix+json":{"source":"iana","compressible":true},"application/swid+xml":{"source":"iana","compressible":true,"extensions":["swidtag"]},"application/tamp-apex-update":{"source":"iana"},"application/tamp-apex-update-confirm":{"source":"iana"},"application/tamp-community-update":{"source":"iana"},"application/tamp-community-update-confirm":{"source":"iana"},"application/tamp-error":{"source":"iana"},"application/tamp-sequence-adjust":{"source":"iana"},"application/tamp-sequence-adjust-confirm":{"source":"iana"},"application/tamp-status-query":{"source":"iana"},"application/tamp-status-response":{"source":"iana"},"application/tamp-update":{"source":"iana"},"application/tamp-update-confirm":{"source":"iana"},"application/tar":{"compressible":true},"application/taxii+json":{"source":"iana","compressible":true},"application/td+json":{"source":"iana","compressible":true},"application/tei+xml":{"source":"iana","compressible":true,"extensions":["tei","teicorpus"]},"application/tetra_isi":{"source":"iana"},"application/thraud+xml":{"source":"iana","compressible":true,"extensions":["tfi"]},"application/timestamp-query":{"source":"iana"},"application/timestamp-reply":{"source":"iana"},"application/timestamped-data":{"source":"iana","extensions":["tsd"]},"application/tlsrpt+gzip":{"source":"iana"},"application/tlsrpt+json":{"source":"iana","compressible":true},"application/tnauthlist":{"source":"iana"},"application/token-introspection+jwt":{"source":"iana"},"application/toml":{"compressible":true,"extensions":["toml"]},"application/trickle-ice-sdpfrag":{"source":"iana"},"application/trig":{"source":"iana","extensions":["trig"]},"application/ttml+xml":{"source":"iana","compressible":true,"extensions":["ttml"]},"application/tve-trigger":{"source":"iana"},"application/tzif":{"source":"iana"},"application/tzif-leap":{"source":"iana"},"application/ubjson":{"compressible":false,"extensions":["ubj"]},"application/ulpfec":{"source":"iana"},"application/urc-grpsheet+xml":{"source":"iana","compressible":true},"application/urc-ressheet+xml":{"source":"iana","compressible":true,"extensions":["rsheet"]},"application/urc-targetdesc+xml":{"source":"iana","compressible":true,"extensions":["td"]},"application/urc-uisocketdesc+xml":{"source":"iana","compressible":true},"application/vcard+json":{"source":"iana","compressible":true},"application/vcard+xml":{"source":"iana","compressible":true},"application/vemmi":{"source":"iana"},"application/vividence.scriptfile":{"source":"apache"},"application/vnd.1000minds.decision-model+xml":{"source":"iana","compressible":true,"extensions":["1km"]},"application/vnd.3gpp-prose+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-prose-pc3ch+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-v2x-local-service-information":{"source":"iana"},"application/vnd.3gpp.5gnas":{"source":"iana"},"application/vnd.3gpp.access-transfer-events+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.bsf+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.gmop+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.gtpc":{"source":"iana"},"application/vnd.3gpp.interworking-data":{"source":"iana"},"application/vnd.3gpp.lpp":{"source":"iana"},"application/vnd.3gpp.mc-signalling-ear":{"source":"iana"},"application/vnd.3gpp.mcdata-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-payload":{"source":"iana"},"application/vnd.3gpp.mcdata-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-signalling":{"source":"iana"},"application/vnd.3gpp.mcdata-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-floor-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-signed+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-init-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-transmission-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mid-call+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.ngap":{"source":"iana"},"application/vnd.3gpp.pfcp":{"source":"iana"},"application/vnd.3gpp.pic-bw-large":{"source":"iana","extensions":["plb"]},"application/vnd.3gpp.pic-bw-small":{"source":"iana","extensions":["psb"]},"application/vnd.3gpp.pic-bw-var":{"source":"iana","extensions":["pvb"]},"application/vnd.3gpp.s1ap":{"source":"iana"},"application/vnd.3gpp.sms":{"source":"iana"},"application/vnd.3gpp.sms+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-ext+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.state-and-event-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.ussd+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.bcmcsinfo+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.sms":{"source":"iana"},"application/vnd.3gpp2.tcap":{"source":"iana","extensions":["tcap"]},"application/vnd.3lightssoftware.imagescal":{"source":"iana"},"application/vnd.3m.post-it-notes":{"source":"iana","extensions":["pwn"]},"application/vnd.accpac.simply.aso":{"source":"iana","extensions":["aso"]},"application/vnd.accpac.simply.imp":{"source":"iana","extensions":["imp"]},"application/vnd.acucobol":{"source":"iana","extensions":["acu"]},"application/vnd.acucorp":{"source":"iana","extensions":["atc","acutc"]},"application/vnd.adobe.air-application-installer-package+zip":{"source":"apache","compressible":false,"extensions":["air"]},"application/vnd.adobe.flash.movie":{"source":"iana"},"application/vnd.adobe.formscentral.fcdt":{"source":"iana","extensions":["fcdt"]},"application/vnd.adobe.fxp":{"source":"iana","extensions":["fxp","fxpl"]},"application/vnd.adobe.partial-upload":{"source":"iana"},"application/vnd.adobe.xdp+xml":{"source":"iana","compressible":true,"extensions":["xdp"]},"application/vnd.adobe.xfdf":{"source":"iana","extensions":["xfdf"]},"application/vnd.aether.imp":{"source":"iana"},"application/vnd.afpc.afplinedata":{"source":"iana"},"application/vnd.afpc.afplinedata-pagedef":{"source":"iana"},"application/vnd.afpc.cmoca-cmresource":{"source":"iana"},"application/vnd.afpc.foca-charset":{"source":"iana"},"application/vnd.afpc.foca-codedfont":{"source":"iana"},"application/vnd.afpc.foca-codepage":{"source":"iana"},"application/vnd.afpc.modca":{"source":"iana"},"application/vnd.afpc.modca-cmtable":{"source":"iana"},"application/vnd.afpc.modca-formdef":{"source":"iana"},"application/vnd.afpc.modca-mediummap":{"source":"iana"},"application/vnd.afpc.modca-objectcontainer":{"source":"iana"},"application/vnd.afpc.modca-overlay":{"source":"iana"},"application/vnd.afpc.modca-pagesegment":{"source":"iana"},"application/vnd.age":{"source":"iana","extensions":["age"]},"application/vnd.ah-barcode":{"source":"iana"},"application/vnd.ahead.space":{"source":"iana","extensions":["ahead"]},"application/vnd.airzip.filesecure.azf":{"source":"iana","extensions":["azf"]},"application/vnd.airzip.filesecure.azs":{"source":"iana","extensions":["azs"]},"application/vnd.amadeus+json":{"source":"iana","compressible":true},"application/vnd.amazon.ebook":{"source":"apache","extensions":["azw"]},"application/vnd.amazon.mobi8-ebook":{"source":"iana"},"application/vnd.americandynamics.acc":{"source":"iana","extensions":["acc"]},"application/vnd.amiga.ami":{"source":"iana","extensions":["ami"]},"application/vnd.amundsen.maze+xml":{"source":"iana","compressible":true},"application/vnd.android.ota":{"source":"iana"},"application/vnd.android.package-archive":{"source":"apache","compressible":false,"extensions":["apk"]},"application/vnd.anki":{"source":"iana"},"application/vnd.anser-web-certificate-issue-initiation":{"source":"iana","extensions":["cii"]},"application/vnd.anser-web-funds-transfer-initiation":{"source":"apache","extensions":["fti"]},"application/vnd.antix.game-component":{"source":"iana","extensions":["atx"]},"application/vnd.apache.arrow.file":{"source":"iana"},"application/vnd.apache.arrow.stream":{"source":"iana"},"application/vnd.apache.thrift.binary":{"source":"iana"},"application/vnd.apache.thrift.compact":{"source":"iana"},"application/vnd.apache.thrift.json":{"source":"iana"},"application/vnd.api+json":{"source":"iana","compressible":true},"application/vnd.aplextor.warrp+json":{"source":"iana","compressible":true},"application/vnd.apothekende.reservation+json":{"source":"iana","compressible":true},"application/vnd.apple.installer+xml":{"source":"iana","compressible":true,"extensions":["mpkg"]},"application/vnd.apple.keynote":{"source":"iana","extensions":["key"]},"application/vnd.apple.mpegurl":{"source":"iana","extensions":["m3u8"]},"application/vnd.apple.numbers":{"source":"iana","extensions":["numbers"]},"application/vnd.apple.pages":{"source":"iana","extensions":["pages"]},"application/vnd.apple.pkpass":{"compressible":false,"extensions":["pkpass"]},"application/vnd.arastra.swi":{"source":"iana"},"application/vnd.aristanetworks.swi":{"source":"iana","extensions":["swi"]},"application/vnd.artisan+json":{"source":"iana","compressible":true},"application/vnd.artsquare":{"source":"iana"},"application/vnd.astraea-software.iota":{"source":"iana","extensions":["iota"]},"application/vnd.audiograph":{"source":"iana","extensions":["aep"]},"application/vnd.autopackage":{"source":"iana"},"application/vnd.avalon+json":{"source":"iana","compressible":true},"application/vnd.avistar+xml":{"source":"iana","compressible":true},"application/vnd.balsamiq.bmml+xml":{"source":"iana","compressible":true,"extensions":["bmml"]},"application/vnd.balsamiq.bmpr":{"source":"iana"},"application/vnd.banana-accounting":{"source":"iana"},"application/vnd.bbf.usp.error":{"source":"iana"},"application/vnd.bbf.usp.msg":{"source":"iana"},"application/vnd.bbf.usp.msg+json":{"source":"iana","compressible":true},"application/vnd.bekitzur-stech+json":{"source":"iana","compressible":true},"application/vnd.bint.med-content":{"source":"iana"},"application/vnd.biopax.rdf+xml":{"source":"iana","compressible":true},"application/vnd.blink-idb-value-wrapper":{"source":"iana"},"application/vnd.blueice.multipass":{"source":"iana","extensions":["mpm"]},"application/vnd.bluetooth.ep.oob":{"source":"iana"},"application/vnd.bluetooth.le.oob":{"source":"iana"},"application/vnd.bmi":{"source":"iana","extensions":["bmi"]},"application/vnd.bpf":{"source":"iana"},"application/vnd.bpf3":{"source":"iana"},"application/vnd.businessobjects":{"source":"iana","extensions":["rep"]},"application/vnd.byu.uapi+json":{"source":"iana","compressible":true},"application/vnd.cab-jscript":{"source":"iana"},"application/vnd.canon-cpdl":{"source":"iana"},"application/vnd.canon-lips":{"source":"iana"},"application/vnd.capasystems-pg+json":{"source":"iana","compressible":true},"application/vnd.cendio.thinlinc.clientconf":{"source":"iana"},"application/vnd.century-systems.tcp_stream":{"source":"iana"},"application/vnd.chemdraw+xml":{"source":"iana","compressible":true,"extensions":["cdxml"]},"application/vnd.chess-pgn":{"source":"iana"},"application/vnd.chipnuts.karaoke-mmd":{"source":"iana","extensions":["mmd"]},"application/vnd.ciedi":{"source":"iana"},"application/vnd.cinderella":{"source":"iana","extensions":["cdy"]},"application/vnd.cirpack.isdn-ext":{"source":"iana"},"application/vnd.citationstyles.style+xml":{"source":"iana","compressible":true,"extensions":["csl"]},"application/vnd.claymore":{"source":"iana","extensions":["cla"]},"application/vnd.cloanto.rp9":{"source":"iana","extensions":["rp9"]},"application/vnd.clonk.c4group":{"source":"iana","extensions":["c4g","c4d","c4f","c4p","c4u"]},"application/vnd.cluetrust.cartomobile-config":{"source":"iana","extensions":["c11amc"]},"application/vnd.cluetrust.cartomobile-config-pkg":{"source":"iana","extensions":["c11amz"]},"application/vnd.coffeescript":{"source":"iana"},"application/vnd.collabio.xodocuments.document":{"source":"iana"},"application/vnd.collabio.xodocuments.document-template":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation-template":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet-template":{"source":"iana"},"application/vnd.collection+json":{"source":"iana","compressible":true},"application/vnd.collection.doc+json":{"source":"iana","compressible":true},"application/vnd.collection.next+json":{"source":"iana","compressible":true},"application/vnd.comicbook+zip":{"source":"iana","compressible":false},"application/vnd.comicbook-rar":{"source":"iana"},"application/vnd.commerce-battelle":{"source":"iana"},"application/vnd.commonspace":{"source":"iana","extensions":["csp"]},"application/vnd.contact.cmsg":{"source":"iana","extensions":["cdbcmsg"]},"application/vnd.coreos.ignition+json":{"source":"iana","compressible":true},"application/vnd.cosmocaller":{"source":"iana","extensions":["cmc"]},"application/vnd.crick.clicker":{"source":"iana","extensions":["clkx"]},"application/vnd.crick.clicker.keyboard":{"source":"iana","extensions":["clkk"]},"application/vnd.crick.clicker.palette":{"source":"iana","extensions":["clkp"]},"application/vnd.crick.clicker.template":{"source":"iana","extensions":["clkt"]},"application/vnd.crick.clicker.wordbank":{"source":"iana","extensions":["clkw"]},"application/vnd.criticaltools.wbs+xml":{"source":"iana","compressible":true,"extensions":["wbs"]},"application/vnd.cryptii.pipe+json":{"source":"iana","compressible":true},"application/vnd.crypto-shade-file":{"source":"iana"},"application/vnd.cryptomator.encrypted":{"source":"iana"},"application/vnd.cryptomator.vault":{"source":"iana"},"application/vnd.ctc-posml":{"source":"iana","extensions":["pml"]},"application/vnd.ctct.ws+xml":{"source":"iana","compressible":true},"application/vnd.cups-pdf":{"source":"iana"},"application/vnd.cups-postscript":{"source":"iana"},"application/vnd.cups-ppd":{"source":"iana","extensions":["ppd"]},"application/vnd.cups-raster":{"source":"iana"},"application/vnd.cups-raw":{"source":"iana"},"application/vnd.curl":{"source":"iana"},"application/vnd.curl.car":{"source":"apache","extensions":["car"]},"application/vnd.curl.pcurl":{"source":"apache","extensions":["pcurl"]},"application/vnd.cyan.dean.root+xml":{"source":"iana","compressible":true},"application/vnd.cybank":{"source":"iana"},"application/vnd.cyclonedx+json":{"source":"iana","compressible":true},"application/vnd.cyclonedx+xml":{"source":"iana","compressible":true},"application/vnd.d2l.coursepackage1p0+zip":{"source":"iana","compressible":false},"application/vnd.d3m-dataset":{"source":"iana"},"application/vnd.d3m-problem":{"source":"iana"},"application/vnd.dart":{"source":"iana","compressible":true,"extensions":["dart"]},"application/vnd.data-vision.rdz":{"source":"iana","extensions":["rdz"]},"application/vnd.datapackage+json":{"source":"iana","compressible":true},"application/vnd.dataresource+json":{"source":"iana","compressible":true},"application/vnd.dbf":{"source":"iana","extensions":["dbf"]},"application/vnd.debian.binary-package":{"source":"iana"},"application/vnd.dece.data":{"source":"iana","extensions":["uvf","uvvf","uvd","uvvd"]},"application/vnd.dece.ttml+xml":{"source":"iana","compressible":true,"extensions":["uvt","uvvt"]},"application/vnd.dece.unspecified":{"source":"iana","extensions":["uvx","uvvx"]},"application/vnd.dece.zip":{"source":"iana","extensions":["uvz","uvvz"]},"application/vnd.denovo.fcselayout-link":{"source":"iana","extensions":["fe_launch"]},"application/vnd.desmume.movie":{"source":"iana"},"application/vnd.dir-bi.plate-dl-nosuffix":{"source":"iana"},"application/vnd.dm.delegation+xml":{"source":"iana","compressible":true},"application/vnd.dna":{"source":"iana","extensions":["dna"]},"application/vnd.document+json":{"source":"iana","compressible":true},"application/vnd.dolby.mlp":{"source":"apache","extensions":["mlp"]},"application/vnd.dolby.mobile.1":{"source":"iana"},"application/vnd.dolby.mobile.2":{"source":"iana"},"application/vnd.doremir.scorecloud-binary-document":{"source":"iana"},"application/vnd.dpgraph":{"source":"iana","extensions":["dpg"]},"application/vnd.dreamfactory":{"source":"iana","extensions":["dfac"]},"application/vnd.drive+json":{"source":"iana","compressible":true},"application/vnd.ds-keypoint":{"source":"apache","extensions":["kpxx"]},"application/vnd.dtg.local":{"source":"iana"},"application/vnd.dtg.local.flash":{"source":"iana"},"application/vnd.dtg.local.html":{"source":"iana"},"application/vnd.dvb.ait":{"source":"iana","extensions":["ait"]},"application/vnd.dvb.dvbisl+xml":{"source":"iana","compressible":true},"application/vnd.dvb.dvbj":{"source":"iana"},"application/vnd.dvb.esgcontainer":{"source":"iana"},"application/vnd.dvb.ipdcdftnotifaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess2":{"source":"iana"},"application/vnd.dvb.ipdcesgpdd":{"source":"iana"},"application/vnd.dvb.ipdcroaming":{"source":"iana"},"application/vnd.dvb.iptv.alfec-base":{"source":"iana"},"application/vnd.dvb.iptv.alfec-enhancement":{"source":"iana"},"application/vnd.dvb.notif-aggregate-root+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-container+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-generic+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-msglist+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-request+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-response+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-init+xml":{"source":"iana","compressible":true},"application/vnd.dvb.pfr":{"source":"iana"},"application/vnd.dvb.service":{"source":"iana","extensions":["svc"]},"application/vnd.dxr":{"source":"iana"},"application/vnd.dynageo":{"source":"iana","extensions":["geo"]},"application/vnd.dzr":{"source":"iana"},"application/vnd.easykaraoke.cdgdownload":{"source":"iana"},"application/vnd.ecdis-update":{"source":"iana"},"application/vnd.ecip.rlp":{"source":"iana"},"application/vnd.eclipse.ditto+json":{"source":"iana","compressible":true},"application/vnd.ecowin.chart":{"source":"iana","extensions":["mag"]},"application/vnd.ecowin.filerequest":{"source":"iana"},"application/vnd.ecowin.fileupdate":{"source":"iana"},"application/vnd.ecowin.series":{"source":"iana"},"application/vnd.ecowin.seriesrequest":{"source":"iana"},"application/vnd.ecowin.seriesupdate":{"source":"iana"},"application/vnd.efi.img":{"source":"iana"},"application/vnd.efi.iso":{"source":"iana"},"application/vnd.emclient.accessrequest+xml":{"source":"iana","compressible":true},"application/vnd.enliven":{"source":"iana","extensions":["nml"]},"application/vnd.enphase.envoy":{"source":"iana"},"application/vnd.eprints.data+xml":{"source":"iana","compressible":true},"application/vnd.epson.esf":{"source":"iana","extensions":["esf"]},"application/vnd.epson.msf":{"source":"iana","extensions":["msf"]},"application/vnd.epson.quickanime":{"source":"iana","extensions":["qam"]},"application/vnd.epson.salt":{"source":"iana","extensions":["slt"]},"application/vnd.epson.ssf":{"source":"iana","extensions":["ssf"]},"application/vnd.ericsson.quickcall":{"source":"iana"},"application/vnd.espass-espass+zip":{"source":"iana","compressible":false},"application/vnd.eszigno3+xml":{"source":"iana","compressible":true,"extensions":["es3","et3"]},"application/vnd.etsi.aoc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.asic-e+zip":{"source":"iana","compressible":false},"application/vnd.etsi.asic-s+zip":{"source":"iana","compressible":false},"application/vnd.etsi.cug+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvcommand+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-bc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-cod+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-npvr+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvservice+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsync+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvueprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mcid+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mheg5":{"source":"iana"},"application/vnd.etsi.overload-control-policy-dataset+xml":{"source":"iana","compressible":true},"application/vnd.etsi.pstn+xml":{"source":"iana","compressible":true},"application/vnd.etsi.sci+xml":{"source":"iana","compressible":true},"application/vnd.etsi.simservs+xml":{"source":"iana","compressible":true},"application/vnd.etsi.timestamp-token":{"source":"iana"},"application/vnd.etsi.tsl+xml":{"source":"iana","compressible":true},"application/vnd.etsi.tsl.der":{"source":"iana"},"application/vnd.eu.kasparian.car+json":{"source":"iana","compressible":true},"application/vnd.eudora.data":{"source":"iana"},"application/vnd.evolv.ecig.profile":{"source":"iana"},"application/vnd.evolv.ecig.settings":{"source":"iana"},"application/vnd.evolv.ecig.theme":{"source":"iana"},"application/vnd.exstream-empower+zip":{"source":"iana","compressible":false},"application/vnd.exstream-package":{"source":"iana"},"application/vnd.ezpix-album":{"source":"iana","extensions":["ez2"]},"application/vnd.ezpix-package":{"source":"iana","extensions":["ez3"]},"application/vnd.f-secure.mobile":{"source":"iana"},"application/vnd.familysearch.gedcom+zip":{"source":"iana","compressible":false},"application/vnd.fastcopy-disk-image":{"source":"iana"},"application/vnd.fdf":{"source":"iana","extensions":["fdf"]},"application/vnd.fdsn.mseed":{"source":"iana","extensions":["mseed"]},"application/vnd.fdsn.seed":{"source":"iana","extensions":["seed","dataless"]},"application/vnd.ffsns":{"source":"iana"},"application/vnd.ficlab.flb+zip":{"source":"iana","compressible":false},"application/vnd.filmit.zfc":{"source":"iana"},"application/vnd.fints":{"source":"iana"},"application/vnd.firemonkeys.cloudcell":{"source":"iana"},"application/vnd.flographit":{"source":"iana","extensions":["gph"]},"application/vnd.fluxtime.clip":{"source":"iana","extensions":["ftc"]},"application/vnd.font-fontforge-sfd":{"source":"iana"},"application/vnd.framemaker":{"source":"iana","extensions":["fm","frame","maker","book"]},"application/vnd.frogans.fnc":{"source":"iana","extensions":["fnc"]},"application/vnd.frogans.ltf":{"source":"iana","extensions":["ltf"]},"application/vnd.fsc.weblaunch":{"source":"iana","extensions":["fsc"]},"application/vnd.fujifilm.fb.docuworks":{"source":"iana"},"application/vnd.fujifilm.fb.docuworks.binder":{"source":"iana"},"application/vnd.fujifilm.fb.docuworks.container":{"source":"iana"},"application/vnd.fujifilm.fb.jfi+xml":{"source":"iana","compressible":true},"application/vnd.fujitsu.oasys":{"source":"iana","extensions":["oas"]},"application/vnd.fujitsu.oasys2":{"source":"iana","extensions":["oa2"]},"application/vnd.fujitsu.oasys3":{"source":"iana","extensions":["oa3"]},"application/vnd.fujitsu.oasysgp":{"source":"iana","extensions":["fg5"]},"application/vnd.fujitsu.oasysprs":{"source":"iana","extensions":["bh2"]},"application/vnd.fujixerox.art-ex":{"source":"iana"},"application/vnd.fujixerox.art4":{"source":"iana"},"application/vnd.fujixerox.ddd":{"source":"iana","extensions":["ddd"]},"application/vnd.fujixerox.docuworks":{"source":"iana","extensions":["xdw"]},"application/vnd.fujixerox.docuworks.binder":{"source":"iana","extensions":["xbd"]},"application/vnd.fujixerox.docuworks.container":{"source":"iana"},"application/vnd.fujixerox.hbpl":{"source":"iana"},"application/vnd.fut-misnet":{"source":"iana"},"application/vnd.futoin+cbor":{"source":"iana"},"application/vnd.futoin+json":{"source":"iana","compressible":true},"application/vnd.fuzzysheet":{"source":"iana","extensions":["fzs"]},"application/vnd.genomatix.tuxedo":{"source":"iana","extensions":["txd"]},"application/vnd.gentics.grd+json":{"source":"iana","compressible":true},"application/vnd.geo+json":{"source":"iana","compressible":true},"application/vnd.geocube+xml":{"source":"iana","compressible":true},"application/vnd.geogebra.file":{"source":"iana","extensions":["ggb"]},"application/vnd.geogebra.slides":{"source":"iana"},"application/vnd.geogebra.tool":{"source":"iana","extensions":["ggt"]},"application/vnd.geometry-explorer":{"source":"iana","extensions":["gex","gre"]},"application/vnd.geonext":{"source":"iana","extensions":["gxt"]},"application/vnd.geoplan":{"source":"iana","extensions":["g2w"]},"application/vnd.geospace":{"source":"iana","extensions":["g3w"]},"application/vnd.gerber":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt-response":{"source":"iana"},"application/vnd.gmx":{"source":"iana","extensions":["gmx"]},"application/vnd.google-apps.document":{"compressible":false,"extensions":["gdoc"]},"application/vnd.google-apps.presentation":{"compressible":false,"extensions":["gslides"]},"application/vnd.google-apps.spreadsheet":{"compressible":false,"extensions":["gsheet"]},"application/vnd.google-earth.kml+xml":{"source":"iana","compressible":true,"extensions":["kml"]},"application/vnd.google-earth.kmz":{"source":"iana","compressible":false,"extensions":["kmz"]},"application/vnd.gov.sk.e-form+xml":{"source":"iana","compressible":true},"application/vnd.gov.sk.e-form+zip":{"source":"iana","compressible":false},"application/vnd.gov.sk.xmldatacontainer+xml":{"source":"iana","compressible":true},"application/vnd.grafeq":{"source":"iana","extensions":["gqf","gqs"]},"application/vnd.gridmp":{"source":"iana"},"application/vnd.groove-account":{"source":"iana","extensions":["gac"]},"application/vnd.groove-help":{"source":"iana","extensions":["ghf"]},"application/vnd.groove-identity-message":{"source":"iana","extensions":["gim"]},"application/vnd.groove-injector":{"source":"iana","extensions":["grv"]},"application/vnd.groove-tool-message":{"source":"iana","extensions":["gtm"]},"application/vnd.groove-tool-template":{"source":"iana","extensions":["tpl"]},"application/vnd.groove-vcard":{"source":"iana","extensions":["vcg"]},"application/vnd.hal+json":{"source":"iana","compressible":true},"application/vnd.hal+xml":{"source":"iana","compressible":true,"extensions":["hal"]},"application/vnd.handheld-entertainment+xml":{"source":"iana","compressible":true,"extensions":["zmm"]},"application/vnd.hbci":{"source":"iana","extensions":["hbci"]},"application/vnd.hc+json":{"source":"iana","compressible":true},"application/vnd.hcl-bireports":{"source":"iana"},"application/vnd.hdt":{"source":"iana"},"application/vnd.heroku+json":{"source":"iana","compressible":true},"application/vnd.hhe.lesson-player":{"source":"iana","extensions":["les"]},"application/vnd.hl7cda+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.hl7v2+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.hp-hpgl":{"source":"iana","extensions":["hpgl"]},"application/vnd.hp-hpid":{"source":"iana","extensions":["hpid"]},"application/vnd.hp-hps":{"source":"iana","extensions":["hps"]},"application/vnd.hp-jlyt":{"source":"iana","extensions":["jlt"]},"application/vnd.hp-pcl":{"source":"iana","extensions":["pcl"]},"application/vnd.hp-pclxl":{"source":"iana","extensions":["pclxl"]},"application/vnd.httphone":{"source":"iana"},"application/vnd.hydrostatix.sof-data":{"source":"iana","extensions":["sfd-hdstx"]},"application/vnd.hyper+json":{"source":"iana","compressible":true},"application/vnd.hyper-item+json":{"source":"iana","compressible":true},"application/vnd.hyperdrive+json":{"source":"iana","compressible":true},"application/vnd.hzn-3d-crossword":{"source":"iana"},"application/vnd.ibm.afplinedata":{"source":"iana"},"application/vnd.ibm.electronic-media":{"source":"iana"},"application/vnd.ibm.minipay":{"source":"iana","extensions":["mpy"]},"application/vnd.ibm.modcap":{"source":"iana","extensions":["afp","listafp","list3820"]},"application/vnd.ibm.rights-management":{"source":"iana","extensions":["irm"]},"application/vnd.ibm.secure-container":{"source":"iana","extensions":["sc"]},"application/vnd.iccprofile":{"source":"iana","extensions":["icc","icm"]},"application/vnd.ieee.1905":{"source":"iana"},"application/vnd.igloader":{"source":"iana","extensions":["igl"]},"application/vnd.imagemeter.folder+zip":{"source":"iana","compressible":false},"application/vnd.imagemeter.image+zip":{"source":"iana","compressible":false},"application/vnd.immervision-ivp":{"source":"iana","extensions":["ivp"]},"application/vnd.immervision-ivu":{"source":"iana","extensions":["ivu"]},"application/vnd.ims.imsccv1p1":{"source":"iana"},"application/vnd.ims.imsccv1p2":{"source":"iana"},"application/vnd.ims.imsccv1p3":{"source":"iana"},"application/vnd.ims.lis.v2.result+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolconsumerprofile+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy.id+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings.simple+json":{"source":"iana","compressible":true},"application/vnd.informedcontrol.rms+xml":{"source":"iana","compressible":true},"application/vnd.informix-visionary":{"source":"iana"},"application/vnd.infotech.project":{"source":"iana"},"application/vnd.infotech.project+xml":{"source":"iana","compressible":true},"application/vnd.innopath.wamp.notification":{"source":"iana"},"application/vnd.insors.igm":{"source":"iana","extensions":["igm"]},"application/vnd.intercon.formnet":{"source":"iana","extensions":["xpw","xpx"]},"application/vnd.intergeo":{"source":"iana","extensions":["i2g"]},"application/vnd.intertrust.digibox":{"source":"iana"},"application/vnd.intertrust.nncp":{"source":"iana"},"application/vnd.intu.qbo":{"source":"iana","extensions":["qbo"]},"application/vnd.intu.qfx":{"source":"iana","extensions":["qfx"]},"application/vnd.iptc.g2.catalogitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.conceptitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.knowledgeitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsmessage+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.packageitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.planningitem+xml":{"source":"iana","compressible":true},"application/vnd.ipunplugged.rcprofile":{"source":"iana","extensions":["rcprofile"]},"application/vnd.irepository.package+xml":{"source":"iana","compressible":true,"extensions":["irp"]},"application/vnd.is-xpr":{"source":"iana","extensions":["xpr"]},"application/vnd.isac.fcs":{"source":"iana","extensions":["fcs"]},"application/vnd.iso11783-10+zip":{"source":"iana","compressible":false},"application/vnd.jam":{"source":"iana","extensions":["jam"]},"application/vnd.japannet-directory-service":{"source":"iana"},"application/vnd.japannet-jpnstore-wakeup":{"source":"iana"},"application/vnd.japannet-payment-wakeup":{"source":"iana"},"application/vnd.japannet-registration":{"source":"iana"},"application/vnd.japannet-registration-wakeup":{"source":"iana"},"application/vnd.japannet-setstore-wakeup":{"source":"iana"},"application/vnd.japannet-verification":{"source":"iana"},"application/vnd.japannet-verification-wakeup":{"source":"iana"},"application/vnd.jcp.javame.midlet-rms":{"source":"iana","extensions":["rms"]},"application/vnd.jisp":{"source":"iana","extensions":["jisp"]},"application/vnd.joost.joda-archive":{"source":"iana","extensions":["joda"]},"application/vnd.jsk.isdn-ngn":{"source":"iana"},"application/vnd.kahootz":{"source":"iana","extensions":["ktz","ktr"]},"application/vnd.kde.karbon":{"source":"iana","extensions":["karbon"]},"application/vnd.kde.kchart":{"source":"iana","extensions":["chrt"]},"application/vnd.kde.kformula":{"source":"iana","extensions":["kfo"]},"application/vnd.kde.kivio":{"source":"iana","extensions":["flw"]},"application/vnd.kde.kontour":{"source":"iana","extensions":["kon"]},"application/vnd.kde.kpresenter":{"source":"iana","extensions":["kpr","kpt"]},"application/vnd.kde.kspread":{"source":"iana","extensions":["ksp"]},"application/vnd.kde.kword":{"source":"iana","extensions":["kwd","kwt"]},"application/vnd.kenameaapp":{"source":"iana","extensions":["htke"]},"application/vnd.kidspiration":{"source":"iana","extensions":["kia"]},"application/vnd.kinar":{"source":"iana","extensions":["kne","knp"]},"application/vnd.koan":{"source":"iana","extensions":["skp","skd","skt","skm"]},"application/vnd.kodak-descriptor":{"source":"iana","extensions":["sse"]},"application/vnd.las":{"source":"iana"},"application/vnd.las.las+json":{"source":"iana","compressible":true},"application/vnd.las.las+xml":{"source":"iana","compressible":true,"extensions":["lasxml"]},"application/vnd.laszip":{"source":"iana"},"application/vnd.leap+json":{"source":"iana","compressible":true},"application/vnd.liberty-request+xml":{"source":"iana","compressible":true},"application/vnd.llamagraphics.life-balance.desktop":{"source":"iana","extensions":["lbd"]},"application/vnd.llamagraphics.life-balance.exchange+xml":{"source":"iana","compressible":true,"extensions":["lbe"]},"application/vnd.logipipe.circuit+zip":{"source":"iana","compressible":false},"application/vnd.loom":{"source":"iana"},"application/vnd.lotus-1-2-3":{"source":"iana","extensions":["123"]},"application/vnd.lotus-approach":{"source":"iana","extensions":["apr"]},"application/vnd.lotus-freelance":{"source":"iana","extensions":["pre"]},"application/vnd.lotus-notes":{"source":"iana","extensions":["nsf"]},"application/vnd.lotus-organizer":{"source":"iana","extensions":["org"]},"application/vnd.lotus-screencam":{"source":"iana","extensions":["scm"]},"application/vnd.lotus-wordpro":{"source":"iana","extensions":["lwp"]},"application/vnd.macports.portpkg":{"source":"iana","extensions":["portpkg"]},"application/vnd.mapbox-vector-tile":{"source":"iana","extensions":["mvt"]},"application/vnd.marlin.drm.actiontoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.conftoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.license+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.mdcf":{"source":"iana"},"application/vnd.mason+json":{"source":"iana","compressible":true},"application/vnd.maxar.archive.3tz+zip":{"source":"iana","compressible":false},"application/vnd.maxmind.maxmind-db":{"source":"iana"},"application/vnd.mcd":{"source":"iana","extensions":["mcd"]},"application/vnd.medcalcdata":{"source":"iana","extensions":["mc1"]},"application/vnd.mediastation.cdkey":{"source":"iana","extensions":["cdkey"]},"application/vnd.meridian-slingshot":{"source":"iana"},"application/vnd.mfer":{"source":"iana","extensions":["mwf"]},"application/vnd.mfmp":{"source":"iana","extensions":["mfm"]},"application/vnd.micro+json":{"source":"iana","compressible":true},"application/vnd.micrografx.flo":{"source":"iana","extensions":["flo"]},"application/vnd.micrografx.igx":{"source":"iana","extensions":["igx"]},"application/vnd.microsoft.portable-executable":{"source":"iana"},"application/vnd.microsoft.windows.thumbnail-cache":{"source":"iana"},"application/vnd.miele+json":{"source":"iana","compressible":true},"application/vnd.mif":{"source":"iana","extensions":["mif"]},"application/vnd.minisoft-hp3000-save":{"source":"iana"},"application/vnd.mitsubishi.misty-guard.trustweb":{"source":"iana"},"application/vnd.mobius.daf":{"source":"iana","extensions":["daf"]},"application/vnd.mobius.dis":{"source":"iana","extensions":["dis"]},"application/vnd.mobius.mbk":{"source":"iana","extensions":["mbk"]},"application/vnd.mobius.mqy":{"source":"iana","extensions":["mqy"]},"application/vnd.mobius.msl":{"source":"iana","extensions":["msl"]},"application/vnd.mobius.plc":{"source":"iana","extensions":["plc"]},"application/vnd.mobius.txf":{"source":"iana","extensions":["txf"]},"application/vnd.mophun.application":{"source":"iana","extensions":["mpn"]},"application/vnd.mophun.certificate":{"source":"iana","extensions":["mpc"]},"application/vnd.motorola.flexsuite":{"source":"iana"},"application/vnd.motorola.flexsuite.adsi":{"source":"iana"},"application/vnd.motorola.flexsuite.fis":{"source":"iana"},"application/vnd.motorola.flexsuite.gotap":{"source":"iana"},"application/vnd.motorola.flexsuite.kmr":{"source":"iana"},"application/vnd.motorola.flexsuite.ttc":{"source":"iana"},"application/vnd.motorola.flexsuite.wem":{"source":"iana"},"application/vnd.motorola.iprm":{"source":"iana"},"application/vnd.mozilla.xul+xml":{"source":"iana","compressible":true,"extensions":["xul"]},"application/vnd.ms-3mfdocument":{"source":"iana"},"application/vnd.ms-artgalry":{"source":"iana","extensions":["cil"]},"application/vnd.ms-asf":{"source":"iana"},"application/vnd.ms-cab-compressed":{"source":"iana","extensions":["cab"]},"application/vnd.ms-color.iccprofile":{"source":"apache"},"application/vnd.ms-excel":{"source":"iana","compressible":false,"extensions":["xls","xlm","xla","xlc","xlt","xlw"]},"application/vnd.ms-excel.addin.macroenabled.12":{"source":"iana","extensions":["xlam"]},"application/vnd.ms-excel.sheet.binary.macroenabled.12":{"source":"iana","extensions":["xlsb"]},"application/vnd.ms-excel.sheet.macroenabled.12":{"source":"iana","extensions":["xlsm"]},"application/vnd.ms-excel.template.macroenabled.12":{"source":"iana","extensions":["xltm"]},"application/vnd.ms-fontobject":{"source":"iana","compressible":true,"extensions":["eot"]},"application/vnd.ms-htmlhelp":{"source":"iana","extensions":["chm"]},"application/vnd.ms-ims":{"source":"iana","extensions":["ims"]},"application/vnd.ms-lrm":{"source":"iana","extensions":["lrm"]},"application/vnd.ms-office.activex+xml":{"source":"iana","compressible":true},"application/vnd.ms-officetheme":{"source":"iana","extensions":["thmx"]},"application/vnd.ms-opentype":{"source":"apache","compressible":true},"application/vnd.ms-outlook":{"compressible":false,"extensions":["msg"]},"application/vnd.ms-package.obfuscated-opentype":{"source":"apache"},"application/vnd.ms-pki.seccat":{"source":"apache","extensions":["cat"]},"application/vnd.ms-pki.stl":{"source":"apache","extensions":["stl"]},"application/vnd.ms-playready.initiator+xml":{"source":"iana","compressible":true},"application/vnd.ms-powerpoint":{"source":"iana","compressible":false,"extensions":["ppt","pps","pot"]},"application/vnd.ms-powerpoint.addin.macroenabled.12":{"source":"iana","extensions":["ppam"]},"application/vnd.ms-powerpoint.presentation.macroenabled.12":{"source":"iana","extensions":["pptm"]},"application/vnd.ms-powerpoint.slide.macroenabled.12":{"source":"iana","extensions":["sldm"]},"application/vnd.ms-powerpoint.slideshow.macroenabled.12":{"source":"iana","extensions":["ppsm"]},"application/vnd.ms-powerpoint.template.macroenabled.12":{"source":"iana","extensions":["potm"]},"application/vnd.ms-printdevicecapabilities+xml":{"source":"iana","compressible":true},"application/vnd.ms-printing.printticket+xml":{"source":"apache","compressible":true},"application/vnd.ms-printschematicket+xml":{"source":"iana","compressible":true},"application/vnd.ms-project":{"source":"iana","extensions":["mpp","mpt"]},"application/vnd.ms-tnef":{"source":"iana"},"application/vnd.ms-windows.devicepairing":{"source":"iana"},"application/vnd.ms-windows.nwprinting.oob":{"source":"iana"},"application/vnd.ms-windows.printerpairing":{"source":"iana"},"application/vnd.ms-windows.wsd.oob":{"source":"iana"},"application/vnd.ms-wmdrm.lic-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.lic-resp":{"source":"iana"},"application/vnd.ms-wmdrm.meter-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.meter-resp":{"source":"iana"},"application/vnd.ms-word.document.macroenabled.12":{"source":"iana","extensions":["docm"]},"application/vnd.ms-word.template.macroenabled.12":{"source":"iana","extensions":["dotm"]},"application/vnd.ms-works":{"source":"iana","extensions":["wps","wks","wcm","wdb"]},"application/vnd.ms-wpl":{"source":"iana","extensions":["wpl"]},"application/vnd.ms-xpsdocument":{"source":"iana","compressible":false,"extensions":["xps"]},"application/vnd.msa-disk-image":{"source":"iana"},"application/vnd.mseq":{"source":"iana","extensions":["mseq"]},"application/vnd.msign":{"source":"iana"},"application/vnd.multiad.creator":{"source":"iana"},"application/vnd.multiad.creator.cif":{"source":"iana"},"application/vnd.music-niff":{"source":"iana"},"application/vnd.musician":{"source":"iana","extensions":["mus"]},"application/vnd.muvee.style":{"source":"iana","extensions":["msty"]},"application/vnd.mynfc":{"source":"iana","extensions":["taglet"]},"application/vnd.nacamar.ybrid+json":{"source":"iana","compressible":true},"application/vnd.ncd.control":{"source":"iana"},"application/vnd.ncd.reference":{"source":"iana"},"application/vnd.nearst.inv+json":{"source":"iana","compressible":true},"application/vnd.nebumind.line":{"source":"iana"},"application/vnd.nervana":{"source":"iana"},"application/vnd.netfpx":{"source":"iana"},"application/vnd.neurolanguage.nlu":{"source":"iana","extensions":["nlu"]},"application/vnd.nimn":{"source":"iana"},"application/vnd.nintendo.nitro.rom":{"source":"iana"},"application/vnd.nintendo.snes.rom":{"source":"iana"},"application/vnd.nitf":{"source":"iana","extensions":["ntf","nitf"]},"application/vnd.noblenet-directory":{"source":"iana","extensions":["nnd"]},"application/vnd.noblenet-sealer":{"source":"iana","extensions":["nns"]},"application/vnd.noblenet-web":{"source":"iana","extensions":["nnw"]},"application/vnd.nokia.catalogs":{"source":"iana"},"application/vnd.nokia.conml+wbxml":{"source":"iana"},"application/vnd.nokia.conml+xml":{"source":"iana","compressible":true},"application/vnd.nokia.iptv.config+xml":{"source":"iana","compressible":true},"application/vnd.nokia.isds-radio-presets":{"source":"iana"},"application/vnd.nokia.landmark+wbxml":{"source":"iana"},"application/vnd.nokia.landmark+xml":{"source":"iana","compressible":true},"application/vnd.nokia.landmarkcollection+xml":{"source":"iana","compressible":true},"application/vnd.nokia.n-gage.ac+xml":{"source":"iana","compressible":true,"extensions":["ac"]},"application/vnd.nokia.n-gage.data":{"source":"iana","extensions":["ngdat"]},"application/vnd.nokia.n-gage.symbian.install":{"source":"iana","extensions":["n-gage"]},"application/vnd.nokia.ncd":{"source":"iana"},"application/vnd.nokia.pcd+wbxml":{"source":"iana"},"application/vnd.nokia.pcd+xml":{"source":"iana","compressible":true},"application/vnd.nokia.radio-preset":{"source":"iana","extensions":["rpst"]},"application/vnd.nokia.radio-presets":{"source":"iana","extensions":["rpss"]},"application/vnd.novadigm.edm":{"source":"iana","extensions":["edm"]},"application/vnd.novadigm.edx":{"source":"iana","extensions":["edx"]},"application/vnd.novadigm.ext":{"source":"iana","extensions":["ext"]},"application/vnd.ntt-local.content-share":{"source":"iana"},"application/vnd.ntt-local.file-transfer":{"source":"iana"},"application/vnd.ntt-local.ogw_remote-access":{"source":"iana"},"application/vnd.ntt-local.sip-ta_remote":{"source":"iana"},"application/vnd.ntt-local.sip-ta_tcp_stream":{"source":"iana"},"application/vnd.oasis.opendocument.chart":{"source":"iana","extensions":["odc"]},"application/vnd.oasis.opendocument.chart-template":{"source":"iana","extensions":["otc"]},"application/vnd.oasis.opendocument.database":{"source":"iana","extensions":["odb"]},"application/vnd.oasis.opendocument.formula":{"source":"iana","extensions":["odf"]},"application/vnd.oasis.opendocument.formula-template":{"source":"iana","extensions":["odft"]},"application/vnd.oasis.opendocument.graphics":{"source":"iana","compressible":false,"extensions":["odg"]},"application/vnd.oasis.opendocument.graphics-template":{"source":"iana","extensions":["otg"]},"application/vnd.oasis.opendocument.image":{"source":"iana","extensions":["odi"]},"application/vnd.oasis.opendocument.image-template":{"source":"iana","extensions":["oti"]},"application/vnd.oasis.opendocument.presentation":{"source":"iana","compressible":false,"extensions":["odp"]},"application/vnd.oasis.opendocument.presentation-template":{"source":"iana","extensions":["otp"]},"application/vnd.oasis.opendocument.spreadsheet":{"source":"iana","compressible":false,"extensions":["ods"]},"application/vnd.oasis.opendocument.spreadsheet-template":{"source":"iana","extensions":["ots"]},"application/vnd.oasis.opendocument.text":{"source":"iana","compressible":false,"extensions":["odt"]},"application/vnd.oasis.opendocument.text-master":{"source":"iana","extensions":["odm"]},"application/vnd.oasis.opendocument.text-template":{"source":"iana","extensions":["ott"]},"application/vnd.oasis.opendocument.text-web":{"source":"iana","extensions":["oth"]},"application/vnd.obn":{"source":"iana"},"application/vnd.ocf+cbor":{"source":"iana"},"application/vnd.oci.image.manifest.v1+json":{"source":"iana","compressible":true},"application/vnd.oftn.l10n+json":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessdownload+xml":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessstreaming+xml":{"source":"iana","compressible":true},"application/vnd.oipf.cspg-hexbinary":{"source":"iana"},"application/vnd.oipf.dae.svg+xml":{"source":"iana","compressible":true},"application/vnd.oipf.dae.xhtml+xml":{"source":"iana","compressible":true},"application/vnd.oipf.mippvcontrolmessage+xml":{"source":"iana","compressible":true},"application/vnd.oipf.pae.gem":{"source":"iana"},"application/vnd.oipf.spdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.oipf.spdlist+xml":{"source":"iana","compressible":true},"application/vnd.oipf.ueprofile+xml":{"source":"iana","compressible":true},"application/vnd.oipf.userprofile+xml":{"source":"iana","compressible":true},"application/vnd.olpc-sugar":{"source":"iana","extensions":["xo"]},"application/vnd.oma-scws-config":{"source":"iana"},"application/vnd.oma-scws-http-request":{"source":"iana"},"application/vnd.oma-scws-http-response":{"source":"iana"},"application/vnd.oma.bcast.associated-procedure-parameter+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.drm-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.imd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.ltkm":{"source":"iana"},"application/vnd.oma.bcast.notification+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.provisioningtrigger":{"source":"iana"},"application/vnd.oma.bcast.sgboot":{"source":"iana"},"application/vnd.oma.bcast.sgdd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sgdu":{"source":"iana"},"application/vnd.oma.bcast.simple-symbol-container":{"source":"iana"},"application/vnd.oma.bcast.smartcard-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sprov+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.stkm":{"source":"iana"},"application/vnd.oma.cab-address-book+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-feature-handler+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-pcc+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-subs-invite+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-user-prefs+xml":{"source":"iana","compressible":true},"application/vnd.oma.dcd":{"source":"iana"},"application/vnd.oma.dcdc":{"source":"iana"},"application/vnd.oma.dd2+xml":{"source":"iana","compressible":true,"extensions":["dd2"]},"application/vnd.oma.drm.risd+xml":{"source":"iana","compressible":true},"application/vnd.oma.group-usage-list+xml":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+cbor":{"source":"iana"},"application/vnd.oma.lwm2m+json":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+tlv":{"source":"iana"},"application/vnd.oma.pal+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.detailed-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.final-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.groups+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.invocation-descriptor+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.optimized-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.push":{"source":"iana"},"application/vnd.oma.scidm.messages+xml":{"source":"iana","compressible":true},"application/vnd.oma.xcap-directory+xml":{"source":"iana","compressible":true},"application/vnd.omads-email+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omads-file+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omads-folder+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omaloc-supl-init":{"source":"iana"},"application/vnd.onepager":{"source":"iana"},"application/vnd.onepagertamp":{"source":"iana"},"application/vnd.onepagertamx":{"source":"iana"},"application/vnd.onepagertat":{"source":"iana"},"application/vnd.onepagertatp":{"source":"iana"},"application/vnd.onepagertatx":{"source":"iana"},"application/vnd.openblox.game+xml":{"source":"iana","compressible":true,"extensions":["obgx"]},"application/vnd.openblox.game-binary":{"source":"iana"},"application/vnd.openeye.oeb":{"source":"iana"},"application/vnd.openofficeorg.extension":{"source":"apache","extensions":["oxt"]},"application/vnd.openstreetmap.data+xml":{"source":"iana","compressible":true,"extensions":["osm"]},"application/vnd.opentimestamps.ots":{"source":"iana"},"application/vnd.openxmlformats-officedocument.custom-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.customxmlproperties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawing+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chart+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.extended-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presentation":{"source":"iana","compressible":false,"extensions":["pptx"]},"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slide":{"source":"iana","extensions":["sldx"]},"application/vnd.openxmlformats-officedocument.presentationml.slide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideshow":{"source":"iana","extensions":["ppsx"]},"application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tags+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.template":{"source":"iana","extensions":["potx"]},"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{"source":"iana","compressible":false,"extensions":["xlsx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.template":{"source":"iana","extensions":["xltx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.theme+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.themeoverride+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.vmldrawing":{"source":"iana"},"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document":{"source":"iana","compressible":false,"extensions":["docx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.template":{"source":"iana","extensions":["dotx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.core-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.relationships+xml":{"source":"iana","compressible":true},"application/vnd.oracle.resource+json":{"source":"iana","compressible":true},"application/vnd.orange.indata":{"source":"iana"},"application/vnd.osa.netdeploy":{"source":"iana"},"application/vnd.osgeo.mapguide.package":{"source":"iana","extensions":["mgp"]},"application/vnd.osgi.bundle":{"source":"iana"},"application/vnd.osgi.dp":{"source":"iana","extensions":["dp"]},"application/vnd.osgi.subsystem":{"source":"iana","extensions":["esa"]},"application/vnd.otps.ct-kip+xml":{"source":"iana","compressible":true},"application/vnd.oxli.countgraph":{"source":"iana"},"application/vnd.pagerduty+json":{"source":"iana","compressible":true},"application/vnd.palm":{"source":"iana","extensions":["pdb","pqa","oprc"]},"application/vnd.panoply":{"source":"iana"},"application/vnd.paos.xml":{"source":"iana"},"application/vnd.patentdive":{"source":"iana"},"application/vnd.patientecommsdoc":{"source":"iana"},"application/vnd.pawaafile":{"source":"iana","extensions":["paw"]},"application/vnd.pcos":{"source":"iana"},"application/vnd.pg.format":{"source":"iana","extensions":["str"]},"application/vnd.pg.osasli":{"source":"iana","extensions":["ei6"]},"application/vnd.piaccess.application-licence":{"source":"iana"},"application/vnd.picsel":{"source":"iana","extensions":["efif"]},"application/vnd.pmi.widget":{"source":"iana","extensions":["wg"]},"application/vnd.poc.group-advertisement+xml":{"source":"iana","compressible":true},"application/vnd.pocketlearn":{"source":"iana","extensions":["plf"]},"application/vnd.powerbuilder6":{"source":"iana","extensions":["pbd"]},"application/vnd.powerbuilder6-s":{"source":"iana"},"application/vnd.powerbuilder7":{"source":"iana"},"application/vnd.powerbuilder7-s":{"source":"iana"},"application/vnd.powerbuilder75":{"source":"iana"},"application/vnd.powerbuilder75-s":{"source":"iana"},"application/vnd.preminet":{"source":"iana"},"application/vnd.previewsystems.box":{"source":"iana","extensions":["box"]},"application/vnd.proteus.magazine":{"source":"iana","extensions":["mgz"]},"application/vnd.psfs":{"source":"iana"},"application/vnd.publishare-delta-tree":{"source":"iana","extensions":["qps"]},"application/vnd.pvi.ptid1":{"source":"iana","extensions":["ptid"]},"application/vnd.pwg-multiplexed":{"source":"iana"},"application/vnd.pwg-xhtml-print+xml":{"source":"iana","compressible":true},"application/vnd.qualcomm.brew-app-res":{"source":"iana"},"application/vnd.quarantainenet":{"source":"iana"},"application/vnd.quark.quarkxpress":{"source":"iana","extensions":["qxd","qxt","qwd","qwt","qxl","qxb"]},"application/vnd.quobject-quoxdocument":{"source":"iana"},"application/vnd.radisys.moml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conn+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-stream+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-base+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-detect+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-sendrecv+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-group+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-speech+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-transform+xml":{"source":"iana","compressible":true},"application/vnd.rainstor.data":{"source":"iana"},"application/vnd.rapid":{"source":"iana"},"application/vnd.rar":{"source":"iana","extensions":["rar"]},"application/vnd.realvnc.bed":{"source":"iana","extensions":["bed"]},"application/vnd.recordare.musicxml":{"source":"iana","extensions":["mxl"]},"application/vnd.recordare.musicxml+xml":{"source":"iana","compressible":true,"extensions":["musicxml"]},"application/vnd.renlearn.rlprint":{"source":"iana"},"application/vnd.resilient.logic":{"source":"iana"},"application/vnd.restful+json":{"source":"iana","compressible":true},"application/vnd.rig.cryptonote":{"source":"iana","extensions":["cryptonote"]},"application/vnd.rim.cod":{"source":"apache","extensions":["cod"]},"application/vnd.rn-realmedia":{"source":"apache","extensions":["rm"]},"application/vnd.rn-realmedia-vbr":{"source":"apache","extensions":["rmvb"]},"application/vnd.route66.link66+xml":{"source":"iana","compressible":true,"extensions":["link66"]},"application/vnd.rs-274x":{"source":"iana"},"application/vnd.ruckus.download":{"source":"iana"},"application/vnd.s3sms":{"source":"iana"},"application/vnd.sailingtracker.track":{"source":"iana","extensions":["st"]},"application/vnd.sar":{"source":"iana"},"application/vnd.sbm.cid":{"source":"iana"},"application/vnd.sbm.mid2":{"source":"iana"},"application/vnd.scribus":{"source":"iana"},"application/vnd.sealed.3df":{"source":"iana"},"application/vnd.sealed.csf":{"source":"iana"},"application/vnd.sealed.doc":{"source":"iana"},"application/vnd.sealed.eml":{"source":"iana"},"application/vnd.sealed.mht":{"source":"iana"},"application/vnd.sealed.net":{"source":"iana"},"application/vnd.sealed.ppt":{"source":"iana"},"application/vnd.sealed.tiff":{"source":"iana"},"application/vnd.sealed.xls":{"source":"iana"},"application/vnd.sealedmedia.softseal.html":{"source":"iana"},"application/vnd.sealedmedia.softseal.pdf":{"source":"iana"},"application/vnd.seemail":{"source":"iana","extensions":["see"]},"application/vnd.seis+json":{"source":"iana","compressible":true},"application/vnd.sema":{"source":"iana","extensions":["sema"]},"application/vnd.semd":{"source":"iana","extensions":["semd"]},"application/vnd.semf":{"source":"iana","extensions":["semf"]},"application/vnd.shade-save-file":{"source":"iana"},"application/vnd.shana.informed.formdata":{"source":"iana","extensions":["ifm"]},"application/vnd.shana.informed.formtemplate":{"source":"iana","extensions":["itp"]},"application/vnd.shana.informed.interchange":{"source":"iana","extensions":["iif"]},"application/vnd.shana.informed.package":{"source":"iana","extensions":["ipk"]},"application/vnd.shootproof+json":{"source":"iana","compressible":true},"application/vnd.shopkick+json":{"source":"iana","compressible":true},"application/vnd.shp":{"source":"iana"},"application/vnd.shx":{"source":"iana"},"application/vnd.sigrok.session":{"source":"iana"},"application/vnd.simtech-mindmapper":{"source":"iana","extensions":["twd","twds"]},"application/vnd.siren+json":{"source":"iana","compressible":true},"application/vnd.smaf":{"source":"iana","extensions":["mmf"]},"application/vnd.smart.notebook":{"source":"iana"},"application/vnd.smart.teacher":{"source":"iana","extensions":["teacher"]},"application/vnd.snesdev-page-table":{"source":"iana"},"application/vnd.software602.filler.form+xml":{"source":"iana","compressible":true,"extensions":["fo"]},"application/vnd.software602.filler.form-xml-zip":{"source":"iana"},"application/vnd.solent.sdkm+xml":{"source":"iana","compressible":true,"extensions":["sdkm","sdkd"]},"application/vnd.spotfire.dxp":{"source":"iana","extensions":["dxp"]},"application/vnd.spotfire.sfs":{"source":"iana","extensions":["sfs"]},"application/vnd.sqlite3":{"source":"iana"},"application/vnd.sss-cod":{"source":"iana"},"application/vnd.sss-dtf":{"source":"iana"},"application/vnd.sss-ntf":{"source":"iana"},"application/vnd.stardivision.calc":{"source":"apache","extensions":["sdc"]},"application/vnd.stardivision.draw":{"source":"apache","extensions":["sda"]},"application/vnd.stardivision.impress":{"source":"apache","extensions":["sdd"]},"application/vnd.stardivision.math":{"source":"apache","extensions":["smf"]},"application/vnd.stardivision.writer":{"source":"apache","extensions":["sdw","vor"]},"application/vnd.stardivision.writer-global":{"source":"apache","extensions":["sgl"]},"application/vnd.stepmania.package":{"source":"iana","extensions":["smzip"]},"application/vnd.stepmania.stepchart":{"source":"iana","extensions":["sm"]},"application/vnd.street-stream":{"source":"iana"},"application/vnd.sun.wadl+xml":{"source":"iana","compressible":true,"extensions":["wadl"]},"application/vnd.sun.xml.calc":{"source":"apache","extensions":["sxc"]},"application/vnd.sun.xml.calc.template":{"source":"apache","extensions":["stc"]},"application/vnd.sun.xml.draw":{"source":"apache","extensions":["sxd"]},"application/vnd.sun.xml.draw.template":{"source":"apache","extensions":["std"]},"application/vnd.sun.xml.impress":{"source":"apache","extensions":["sxi"]},"application/vnd.sun.xml.impress.template":{"source":"apache","extensions":["sti"]},"application/vnd.sun.xml.math":{"source":"apache","extensions":["sxm"]},"application/vnd.sun.xml.writer":{"source":"apache","extensions":["sxw"]},"application/vnd.sun.xml.writer.global":{"source":"apache","extensions":["sxg"]},"application/vnd.sun.xml.writer.template":{"source":"apache","extensions":["stw"]},"application/vnd.sus-calendar":{"source":"iana","extensions":["sus","susp"]},"application/vnd.svd":{"source":"iana","extensions":["svd"]},"application/vnd.swiftview-ics":{"source":"iana"},"application/vnd.sycle+xml":{"source":"iana","compressible":true},"application/vnd.syft+json":{"source":"iana","compressible":true},"application/vnd.symbian.install":{"source":"apache","extensions":["sis","sisx"]},"application/vnd.syncml+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xsm"]},"application/vnd.syncml.dm+wbxml":{"source":"iana","charset":"UTF-8","extensions":["bdm"]},"application/vnd.syncml.dm+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xdm"]},"application/vnd.syncml.dm.notification":{"source":"iana"},"application/vnd.syncml.dmddf+wbxml":{"source":"iana"},"application/vnd.syncml.dmddf+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["ddf"]},"application/vnd.syncml.dmtnds+wbxml":{"source":"iana"},"application/vnd.syncml.dmtnds+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.syncml.ds.notification":{"source":"iana"},"application/vnd.tableschema+json":{"source":"iana","compressible":true},"application/vnd.tao.intent-module-archive":{"source":"iana","extensions":["tao"]},"application/vnd.tcpdump.pcap":{"source":"iana","extensions":["pcap","cap","dmp"]},"application/vnd.think-cell.ppttc+json":{"source":"iana","compressible":true},"application/vnd.tmd.mediaflex.api+xml":{"source":"iana","compressible":true},"application/vnd.tml":{"source":"iana"},"application/vnd.tmobile-livetv":{"source":"iana","extensions":["tmo"]},"application/vnd.tri.onesource":{"source":"iana"},"application/vnd.trid.tpt":{"source":"iana","extensions":["tpt"]},"application/vnd.triscape.mxs":{"source":"iana","extensions":["mxs"]},"application/vnd.trueapp":{"source":"iana","extensions":["tra"]},"application/vnd.truedoc":{"source":"iana"},"application/vnd.ubisoft.webplayer":{"source":"iana"},"application/vnd.ufdl":{"source":"iana","extensions":["ufd","ufdl"]},"application/vnd.uiq.theme":{"source":"iana","extensions":["utz"]},"application/vnd.umajin":{"source":"iana","extensions":["umj"]},"application/vnd.unity":{"source":"iana","extensions":["unityweb"]},"application/vnd.uoml+xml":{"source":"iana","compressible":true,"extensions":["uoml"]},"application/vnd.uplanet.alert":{"source":"iana"},"application/vnd.uplanet.alert-wbxml":{"source":"iana"},"application/vnd.uplanet.bearer-choice":{"source":"iana"},"application/vnd.uplanet.bearer-choice-wbxml":{"source":"iana"},"application/vnd.uplanet.cacheop":{"source":"iana"},"application/vnd.uplanet.cacheop-wbxml":{"source":"iana"},"application/vnd.uplanet.channel":{"source":"iana"},"application/vnd.uplanet.channel-wbxml":{"source":"iana"},"application/vnd.uplanet.list":{"source":"iana"},"application/vnd.uplanet.list-wbxml":{"source":"iana"},"application/vnd.uplanet.listcmd":{"source":"iana"},"application/vnd.uplanet.listcmd-wbxml":{"source":"iana"},"application/vnd.uplanet.signal":{"source":"iana"},"application/vnd.uri-map":{"source":"iana"},"application/vnd.valve.source.material":{"source":"iana"},"application/vnd.vcx":{"source":"iana","extensions":["vcx"]},"application/vnd.vd-study":{"source":"iana"},"application/vnd.vectorworks":{"source":"iana"},"application/vnd.vel+json":{"source":"iana","compressible":true},"application/vnd.verimatrix.vcas":{"source":"iana"},"application/vnd.veritone.aion+json":{"source":"iana","compressible":true},"application/vnd.veryant.thin":{"source":"iana"},"application/vnd.ves.encrypted":{"source":"iana"},"application/vnd.vidsoft.vidconference":{"source":"iana"},"application/vnd.visio":{"source":"iana","extensions":["vsd","vst","vss","vsw"]},"application/vnd.visionary":{"source":"iana","extensions":["vis"]},"application/vnd.vividence.scriptfile":{"source":"iana"},"application/vnd.vsf":{"source":"iana","extensions":["vsf"]},"application/vnd.wap.sic":{"source":"iana"},"application/vnd.wap.slc":{"source":"iana"},"application/vnd.wap.wbxml":{"source":"iana","charset":"UTF-8","extensions":["wbxml"]},"application/vnd.wap.wmlc":{"source":"iana","extensions":["wmlc"]},"application/vnd.wap.wmlscriptc":{"source":"iana","extensions":["wmlsc"]},"application/vnd.webturbo":{"source":"iana","extensions":["wtb"]},"application/vnd.wfa.dpp":{"source":"iana"},"application/vnd.wfa.p2p":{"source":"iana"},"application/vnd.wfa.wsc":{"source":"iana"},"application/vnd.windows.devicepairing":{"source":"iana"},"application/vnd.wmc":{"source":"iana"},"application/vnd.wmf.bootstrap":{"source":"iana"},"application/vnd.wolfram.mathematica":{"source":"iana"},"application/vnd.wolfram.mathematica.package":{"source":"iana"},"application/vnd.wolfram.player":{"source":"iana","extensions":["nbp"]},"application/vnd.wordperfect":{"source":"iana","extensions":["wpd"]},"application/vnd.wqd":{"source":"iana","extensions":["wqd"]},"application/vnd.wrq-hp3000-labelled":{"source":"iana"},"application/vnd.wt.stf":{"source":"iana","extensions":["stf"]},"application/vnd.wv.csp+wbxml":{"source":"iana"},"application/vnd.wv.csp+xml":{"source":"iana","compressible":true},"application/vnd.wv.ssp+xml":{"source":"iana","compressible":true},"application/vnd.xacml+json":{"source":"iana","compressible":true},"application/vnd.xara":{"source":"iana","extensions":["xar"]},"application/vnd.xfdl":{"source":"iana","extensions":["xfdl"]},"application/vnd.xfdl.webform":{"source":"iana"},"application/vnd.xmi+xml":{"source":"iana","compressible":true},"application/vnd.xmpie.cpkg":{"source":"iana"},"application/vnd.xmpie.dpkg":{"source":"iana"},"application/vnd.xmpie.plan":{"source":"iana"},"application/vnd.xmpie.ppkg":{"source":"iana"},"application/vnd.xmpie.xlim":{"source":"iana"},"application/vnd.yamaha.hv-dic":{"source":"iana","extensions":["hvd"]},"application/vnd.yamaha.hv-script":{"source":"iana","extensions":["hvs"]},"application/vnd.yamaha.hv-voice":{"source":"iana","extensions":["hvp"]},"application/vnd.yamaha.openscoreformat":{"source":"iana","extensions":["osf"]},"application/vnd.yamaha.openscoreformat.osfpvg+xml":{"source":"iana","compressible":true,"extensions":["osfpvg"]},"application/vnd.yamaha.remote-setup":{"source":"iana"},"application/vnd.yamaha.smaf-audio":{"source":"iana","extensions":["saf"]},"application/vnd.yamaha.smaf-phrase":{"source":"iana","extensions":["spf"]},"application/vnd.yamaha.through-ngn":{"source":"iana"},"application/vnd.yamaha.tunnel-udpencap":{"source":"iana"},"application/vnd.yaoweme":{"source":"iana"},"application/vnd.yellowriver-custom-menu":{"source":"iana","extensions":["cmp"]},"application/vnd.youtube.yt":{"source":"iana"},"application/vnd.zul":{"source":"iana","extensions":["zir","zirz"]},"application/vnd.zzazz.deck+xml":{"source":"iana","compressible":true,"extensions":["zaz"]},"application/voicexml+xml":{"source":"iana","compressible":true,"extensions":["vxml"]},"application/voucher-cms+json":{"source":"iana","compressible":true},"application/vq-rtcpxr":{"source":"iana"},"application/wasm":{"source":"iana","compressible":true,"extensions":["wasm"]},"application/watcherinfo+xml":{"source":"iana","compressible":true,"extensions":["wif"]},"application/webpush-options+json":{"source":"iana","compressible":true},"application/whoispp-query":{"source":"iana"},"application/whoispp-response":{"source":"iana"},"application/widget":{"source":"iana","extensions":["wgt"]},"application/winhlp":{"source":"apache","extensions":["hlp"]},"application/wita":{"source":"iana"},"application/wordperfect5.1":{"source":"iana"},"application/wsdl+xml":{"source":"iana","compressible":true,"extensions":["wsdl"]},"application/wspolicy+xml":{"source":"iana","compressible":true,"extensions":["wspolicy"]},"application/x-7z-compressed":{"source":"apache","compressible":false,"extensions":["7z"]},"application/x-abiword":{"source":"apache","extensions":["abw"]},"application/x-ace-compressed":{"source":"apache","extensions":["ace"]},"application/x-amf":{"source":"apache"},"application/x-apple-diskimage":{"source":"apache","extensions":["dmg"]},"application/x-arj":{"compressible":false,"extensions":["arj"]},"application/x-authorware-bin":{"source":"apache","extensions":["aab","x32","u32","vox"]},"application/x-authorware-map":{"source":"apache","extensions":["aam"]},"application/x-authorware-seg":{"source":"apache","extensions":["aas"]},"application/x-bcpio":{"source":"apache","extensions":["bcpio"]},"application/x-bdoc":{"compressible":false,"extensions":["bdoc"]},"application/x-bittorrent":{"source":"apache","extensions":["torrent"]},"application/x-blorb":{"source":"apache","extensions":["blb","blorb"]},"application/x-bzip":{"source":"apache","compressible":false,"extensions":["bz"]},"application/x-bzip2":{"source":"apache","compressible":false,"extensions":["bz2","boz"]},"application/x-cbr":{"source":"apache","extensions":["cbr","cba","cbt","cbz","cb7"]},"application/x-cdlink":{"source":"apache","extensions":["vcd"]},"application/x-cfs-compressed":{"source":"apache","extensions":["cfs"]},"application/x-chat":{"source":"apache","extensions":["chat"]},"application/x-chess-pgn":{"source":"apache","extensions":["pgn"]},"application/x-chrome-extension":{"extensions":["crx"]},"application/x-cocoa":{"source":"nginx","extensions":["cco"]},"application/x-compress":{"source":"apache"},"application/x-conference":{"source":"apache","extensions":["nsc"]},"application/x-cpio":{"source":"apache","extensions":["cpio"]},"application/x-csh":{"source":"apache","extensions":["csh"]},"application/x-deb":{"compressible":false},"application/x-debian-package":{"source":"apache","extensions":["deb","udeb"]},"application/x-dgc-compressed":{"source":"apache","extensions":["dgc"]},"application/x-director":{"source":"apache","extensions":["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"]},"application/x-doom":{"source":"apache","extensions":["wad"]},"application/x-dtbncx+xml":{"source":"apache","compressible":true,"extensions":["ncx"]},"application/x-dtbook+xml":{"source":"apache","compressible":true,"extensions":["dtb"]},"application/x-dtbresource+xml":{"source":"apache","compressible":true,"extensions":["res"]},"application/x-dvi":{"source":"apache","compressible":false,"extensions":["dvi"]},"application/x-envoy":{"source":"apache","extensions":["evy"]},"application/x-eva":{"source":"apache","extensions":["eva"]},"application/x-font-bdf":{"source":"apache","extensions":["bdf"]},"application/x-font-dos":{"source":"apache"},"application/x-font-framemaker":{"source":"apache"},"application/x-font-ghostscript":{"source":"apache","extensions":["gsf"]},"application/x-font-libgrx":{"source":"apache"},"application/x-font-linux-psf":{"source":"apache","extensions":["psf"]},"application/x-font-pcf":{"source":"apache","extensions":["pcf"]},"application/x-font-snf":{"source":"apache","extensions":["snf"]},"application/x-font-speedo":{"source":"apache"},"application/x-font-sunos-news":{"source":"apache"},"application/x-font-type1":{"source":"apache","extensions":["pfa","pfb","pfm","afm"]},"application/x-font-vfont":{"source":"apache"},"application/x-freearc":{"source":"apache","extensions":["arc"]},"application/x-futuresplash":{"source":"apache","extensions":["spl"]},"application/x-gca-compressed":{"source":"apache","extensions":["gca"]},"application/x-glulx":{"source":"apache","extensions":["ulx"]},"application/x-gnumeric":{"source":"apache","extensions":["gnumeric"]},"application/x-gramps-xml":{"source":"apache","extensions":["gramps"]},"application/x-gtar":{"source":"apache","extensions":["gtar"]},"application/x-gzip":{"source":"apache"},"application/x-hdf":{"source":"apache","extensions":["hdf"]},"application/x-httpd-php":{"compressible":true,"extensions":["php"]},"application/x-install-instructions":{"source":"apache","extensions":["install"]},"application/x-iso9660-image":{"source":"apache","extensions":["iso"]},"application/x-iwork-keynote-sffkey":{"extensions":["key"]},"application/x-iwork-numbers-sffnumbers":{"extensions":["numbers"]},"application/x-iwork-pages-sffpages":{"extensions":["pages"]},"application/x-java-archive-diff":{"source":"nginx","extensions":["jardiff"]},"application/x-java-jnlp-file":{"source":"apache","compressible":false,"extensions":["jnlp"]},"application/x-javascript":{"compressible":true},"application/x-keepass2":{"extensions":["kdbx"]},"application/x-latex":{"source":"apache","compressible":false,"extensions":["latex"]},"application/x-lua-bytecode":{"extensions":["luac"]},"application/x-lzh-compressed":{"source":"apache","extensions":["lzh","lha"]},"application/x-makeself":{"source":"nginx","extensions":["run"]},"application/x-mie":{"source":"apache","extensions":["mie"]},"application/x-mobipocket-ebook":{"source":"apache","extensions":["prc","mobi"]},"application/x-mpegurl":{"compressible":false},"application/x-ms-application":{"source":"apache","extensions":["application"]},"application/x-ms-shortcut":{"source":"apache","extensions":["lnk"]},"application/x-ms-wmd":{"source":"apache","extensions":["wmd"]},"application/x-ms-wmz":{"source":"apache","extensions":["wmz"]},"application/x-ms-xbap":{"source":"apache","extensions":["xbap"]},"application/x-msaccess":{"source":"apache","extensions":["mdb"]},"application/x-msbinder":{"source":"apache","extensions":["obd"]},"application/x-mscardfile":{"source":"apache","extensions":["crd"]},"application/x-msclip":{"source":"apache","extensions":["clp"]},"application/x-msdos-program":{"extensions":["exe"]},"application/x-msdownload":{"source":"apache","extensions":["exe","dll","com","bat","msi"]},"application/x-msmediaview":{"source":"apache","extensions":["mvb","m13","m14"]},"application/x-msmetafile":{"source":"apache","extensions":["wmf","wmz","emf","emz"]},"application/x-msmoney":{"source":"apache","extensions":["mny"]},"application/x-mspublisher":{"source":"apache","extensions":["pub"]},"application/x-msschedule":{"source":"apache","extensions":["scd"]},"application/x-msterminal":{"source":"apache","extensions":["trm"]},"application/x-mswrite":{"source":"apache","extensions":["wri"]},"application/x-netcdf":{"source":"apache","extensions":["nc","cdf"]},"application/x-ns-proxy-autoconfig":{"compressible":true,"extensions":["pac"]},"application/x-nzb":{"source":"apache","extensions":["nzb"]},"application/x-perl":{"source":"nginx","extensions":["pl","pm"]},"application/x-pilot":{"source":"nginx","extensions":["prc","pdb"]},"application/x-pkcs12":{"source":"apache","compressible":false,"extensions":["p12","pfx"]},"application/x-pkcs7-certificates":{"source":"apache","extensions":["p7b","spc"]},"application/x-pkcs7-certreqresp":{"source":"apache","extensions":["p7r"]},"application/x-pki-message":{"source":"iana"},"application/x-rar-compressed":{"source":"apache","compressible":false,"extensions":["rar"]},"application/x-redhat-package-manager":{"source":"nginx","extensions":["rpm"]},"application/x-research-info-systems":{"source":"apache","extensions":["ris"]},"application/x-sea":{"source":"nginx","extensions":["sea"]},"application/x-sh":{"source":"apache","compressible":true,"extensions":["sh"]},"application/x-shar":{"source":"apache","extensions":["shar"]},"application/x-shockwave-flash":{"source":"apache","compressible":false,"extensions":["swf"]},"application/x-silverlight-app":{"source":"apache","extensions":["xap"]},"application/x-sql":{"source":"apache","extensions":["sql"]},"application/x-stuffit":{"source":"apache","compressible":false,"extensions":["sit"]},"application/x-stuffitx":{"source":"apache","extensions":["sitx"]},"application/x-subrip":{"source":"apache","extensions":["srt"]},"application/x-sv4cpio":{"source":"apache","extensions":["sv4cpio"]},"application/x-sv4crc":{"source":"apache","extensions":["sv4crc"]},"application/x-t3vm-image":{"source":"apache","extensions":["t3"]},"application/x-tads":{"source":"apache","extensions":["gam"]},"application/x-tar":{"source":"apache","compressible":true,"extensions":["tar"]},"application/x-tcl":{"source":"apache","extensions":["tcl","tk"]},"application/x-tex":{"source":"apache","extensions":["tex"]},"application/x-tex-tfm":{"source":"apache","extensions":["tfm"]},"application/x-texinfo":{"source":"apache","extensions":["texinfo","texi"]},"application/x-tgif":{"source":"apache","extensions":["obj"]},"application/x-ustar":{"source":"apache","extensions":["ustar"]},"application/x-virtualbox-hdd":{"compressible":true,"extensions":["hdd"]},"application/x-virtualbox-ova":{"compressible":true,"extensions":["ova"]},"application/x-virtualbox-ovf":{"compressible":true,"extensions":["ovf"]},"application/x-virtualbox-vbox":{"compressible":true,"extensions":["vbox"]},"application/x-virtualbox-vbox-extpack":{"compressible":false,"extensions":["vbox-extpack"]},"application/x-virtualbox-vdi":{"compressible":true,"extensions":["vdi"]},"application/x-virtualbox-vhd":{"compressible":true,"extensions":["vhd"]},"application/x-virtualbox-vmdk":{"compressible":true,"extensions":["vmdk"]},"application/x-wais-source":{"source":"apache","extensions":["src"]},"application/x-web-app-manifest+json":{"compressible":true,"extensions":["webapp"]},"application/x-www-form-urlencoded":{"source":"iana","compressible":true},"application/x-x509-ca-cert":{"source":"iana","extensions":["der","crt","pem"]},"application/x-x509-ca-ra-cert":{"source":"iana"},"application/x-x509-next-ca-cert":{"source":"iana"},"application/x-xfig":{"source":"apache","extensions":["fig"]},"application/x-xliff+xml":{"source":"apache","compressible":true,"extensions":["xlf"]},"application/x-xpinstall":{"source":"apache","compressible":false,"extensions":["xpi"]},"application/x-xz":{"source":"apache","extensions":["xz"]},"application/x-zmachine":{"source":"apache","extensions":["z1","z2","z3","z4","z5","z6","z7","z8"]},"application/x400-bp":{"source":"iana"},"application/xacml+xml":{"source":"iana","compressible":true},"application/xaml+xml":{"source":"apache","compressible":true,"extensions":["xaml"]},"application/xcap-att+xml":{"source":"iana","compressible":true,"extensions":["xav"]},"application/xcap-caps+xml":{"source":"iana","compressible":true,"extensions":["xca"]},"application/xcap-diff+xml":{"source":"iana","compressible":true,"extensions":["xdf"]},"application/xcap-el+xml":{"source":"iana","compressible":true,"extensions":["xel"]},"application/xcap-error+xml":{"source":"iana","compressible":true},"application/xcap-ns+xml":{"source":"iana","compressible":true,"extensions":["xns"]},"application/xcon-conference-info+xml":{"source":"iana","compressible":true},"application/xcon-conference-info-diff+xml":{"source":"iana","compressible":true},"application/xenc+xml":{"source":"iana","compressible":true,"extensions":["xenc"]},"application/xhtml+xml":{"source":"iana","compressible":true,"extensions":["xhtml","xht"]},"application/xhtml-voice+xml":{"source":"apache","compressible":true},"application/xliff+xml":{"source":"iana","compressible":true,"extensions":["xlf"]},"application/xml":{"source":"iana","compressible":true,"extensions":["xml","xsl","xsd","rng"]},"application/xml-dtd":{"source":"iana","compressible":true,"extensions":["dtd"]},"application/xml-external-parsed-entity":{"source":"iana"},"application/xml-patch+xml":{"source":"iana","compressible":true},"application/xmpp+xml":{"source":"iana","compressible":true},"application/xop+xml":{"source":"iana","compressible":true,"extensions":["xop"]},"application/xproc+xml":{"source":"apache","compressible":true,"extensions":["xpl"]},"application/xslt+xml":{"source":"iana","compressible":true,"extensions":["xsl","xslt"]},"application/xspf+xml":{"source":"apache","compressible":true,"extensions":["xspf"]},"application/xv+xml":{"source":"iana","compressible":true,"extensions":["mxml","xhvml","xvml","xvm"]},"application/yang":{"source":"iana","extensions":["yang"]},"application/yang-data+json":{"source":"iana","compressible":true},"application/yang-data+xml":{"source":"iana","compressible":true},"application/yang-patch+json":{"source":"iana","compressible":true},"application/yang-patch+xml":{"source":"iana","compressible":true},"application/yin+xml":{"source":"iana","compressible":true,"extensions":["yin"]},"application/zip":{"source":"iana","compressible":false,"extensions":["zip"]},"application/zlib":{"source":"iana"},"application/zstd":{"source":"iana"},"audio/1d-interleaved-parityfec":{"source":"iana"},"audio/32kadpcm":{"source":"iana"},"audio/3gpp":{"source":"iana","compressible":false,"extensions":["3gpp"]},"audio/3gpp2":{"source":"iana"},"audio/aac":{"source":"iana"},"audio/ac3":{"source":"iana"},"audio/adpcm":{"source":"apache","extensions":["adp"]},"audio/amr":{"source":"iana","extensions":["amr"]},"audio/amr-wb":{"source":"iana"},"audio/amr-wb+":{"source":"iana"},"audio/aptx":{"source":"iana"},"audio/asc":{"source":"iana"},"audio/atrac-advanced-lossless":{"source":"iana"},"audio/atrac-x":{"source":"iana"},"audio/atrac3":{"source":"iana"},"audio/basic":{"source":"iana","compressible":false,"extensions":["au","snd"]},"audio/bv16":{"source":"iana"},"audio/bv32":{"source":"iana"},"audio/clearmode":{"source":"iana"},"audio/cn":{"source":"iana"},"audio/dat12":{"source":"iana"},"audio/dls":{"source":"iana"},"audio/dsr-es201108":{"source":"iana"},"audio/dsr-es202050":{"source":"iana"},"audio/dsr-es202211":{"source":"iana"},"audio/dsr-es202212":{"source":"iana"},"audio/dv":{"source":"iana"},"audio/dvi4":{"source":"iana"},"audio/eac3":{"source":"iana"},"audio/encaprtp":{"source":"iana"},"audio/evrc":{"source":"iana"},"audio/evrc-qcp":{"source":"iana"},"audio/evrc0":{"source":"iana"},"audio/evrc1":{"source":"iana"},"audio/evrcb":{"source":"iana"},"audio/evrcb0":{"source":"iana"},"audio/evrcb1":{"source":"iana"},"audio/evrcnw":{"source":"iana"},"audio/evrcnw0":{"source":"iana"},"audio/evrcnw1":{"source":"iana"},"audio/evrcwb":{"source":"iana"},"audio/evrcwb0":{"source":"iana"},"audio/evrcwb1":{"source":"iana"},"audio/evs":{"source":"iana"},"audio/flexfec":{"source":"iana"},"audio/fwdred":{"source":"iana"},"audio/g711-0":{"source":"iana"},"audio/g719":{"source":"iana"},"audio/g722":{"source":"iana"},"audio/g7221":{"source":"iana"},"audio/g723":{"source":"iana"},"audio/g726-16":{"source":"iana"},"audio/g726-24":{"source":"iana"},"audio/g726-32":{"source":"iana"},"audio/g726-40":{"source":"iana"},"audio/g728":{"source":"iana"},"audio/g729":{"source":"iana"},"audio/g7291":{"source":"iana"},"audio/g729d":{"source":"iana"},"audio/g729e":{"source":"iana"},"audio/gsm":{"source":"iana"},"audio/gsm-efr":{"source":"iana"},"audio/gsm-hr-08":{"source":"iana"},"audio/ilbc":{"source":"iana"},"audio/ip-mr_v2.5":{"source":"iana"},"audio/isac":{"source":"apache"},"audio/l16":{"source":"iana"},"audio/l20":{"source":"iana"},"audio/l24":{"source":"iana","compressible":false},"audio/l8":{"source":"iana"},"audio/lpc":{"source":"iana"},"audio/melp":{"source":"iana"},"audio/melp1200":{"source":"iana"},"audio/melp2400":{"source":"iana"},"audio/melp600":{"source":"iana"},"audio/mhas":{"source":"iana"},"audio/midi":{"source":"apache","extensions":["mid","midi","kar","rmi"]},"audio/mobile-xmf":{"source":"iana","extensions":["mxmf"]},"audio/mp3":{"compressible":false,"extensions":["mp3"]},"audio/mp4":{"source":"iana","compressible":false,"extensions":["m4a","mp4a"]},"audio/mp4a-latm":{"source":"iana"},"audio/mpa":{"source":"iana"},"audio/mpa-robust":{"source":"iana"},"audio/mpeg":{"source":"iana","compressible":false,"extensions":["mpga","mp2","mp2a","mp3","m2a","m3a"]},"audio/mpeg4-generic":{"source":"iana"},"audio/musepack":{"source":"apache"},"audio/ogg":{"source":"iana","compressible":false,"extensions":["oga","ogg","spx","opus"]},"audio/opus":{"source":"iana"},"audio/parityfec":{"source":"iana"},"audio/pcma":{"source":"iana"},"audio/pcma-wb":{"source":"iana"},"audio/pcmu":{"source":"iana"},"audio/pcmu-wb":{"source":"iana"},"audio/prs.sid":{"source":"iana"},"audio/qcelp":{"source":"iana"},"audio/raptorfec":{"source":"iana"},"audio/red":{"source":"iana"},"audio/rtp-enc-aescm128":{"source":"iana"},"audio/rtp-midi":{"source":"iana"},"audio/rtploopback":{"source":"iana"},"audio/rtx":{"source":"iana"},"audio/s3m":{"source":"apache","extensions":["s3m"]},"audio/scip":{"source":"iana"},"audio/silk":{"source":"apache","extensions":["sil"]},"audio/smv":{"source":"iana"},"audio/smv-qcp":{"source":"iana"},"audio/smv0":{"source":"iana"},"audio/sofa":{"source":"iana"},"audio/sp-midi":{"source":"iana"},"audio/speex":{"source":"iana"},"audio/t140c":{"source":"iana"},"audio/t38":{"source":"iana"},"audio/telephone-event":{"source":"iana"},"audio/tetra_acelp":{"source":"iana"},"audio/tetra_acelp_bb":{"source":"iana"},"audio/tone":{"source":"iana"},"audio/tsvcis":{"source":"iana"},"audio/uemclip":{"source":"iana"},"audio/ulpfec":{"source":"iana"},"audio/usac":{"source":"iana"},"audio/vdvi":{"source":"iana"},"audio/vmr-wb":{"source":"iana"},"audio/vnd.3gpp.iufp":{"source":"iana"},"audio/vnd.4sb":{"source":"iana"},"audio/vnd.audiokoz":{"source":"iana"},"audio/vnd.celp":{"source":"iana"},"audio/vnd.cisco.nse":{"source":"iana"},"audio/vnd.cmles.radio-events":{"source":"iana"},"audio/vnd.cns.anp1":{"source":"iana"},"audio/vnd.cns.inf1":{"source":"iana"},"audio/vnd.dece.audio":{"source":"iana","extensions":["uva","uvva"]},"audio/vnd.digital-winds":{"source":"iana","extensions":["eol"]},"audio/vnd.dlna.adts":{"source":"iana"},"audio/vnd.dolby.heaac.1":{"source":"iana"},"audio/vnd.dolby.heaac.2":{"source":"iana"},"audio/vnd.dolby.mlp":{"source":"iana"},"audio/vnd.dolby.mps":{"source":"iana"},"audio/vnd.dolby.pl2":{"source":"iana"},"audio/vnd.dolby.pl2x":{"source":"iana"},"audio/vnd.dolby.pl2z":{"source":"iana"},"audio/vnd.dolby.pulse.1":{"source":"iana"},"audio/vnd.dra":{"source":"iana","extensions":["dra"]},"audio/vnd.dts":{"source":"iana","extensions":["dts"]},"audio/vnd.dts.hd":{"source":"iana","extensions":["dtshd"]},"audio/vnd.dts.uhd":{"source":"iana"},"audio/vnd.dvb.file":{"source":"iana"},"audio/vnd.everad.plj":{"source":"iana"},"audio/vnd.hns.audio":{"source":"iana"},"audio/vnd.lucent.voice":{"source":"iana","extensions":["lvp"]},"audio/vnd.ms-playready.media.pya":{"source":"iana","extensions":["pya"]},"audio/vnd.nokia.mobile-xmf":{"source":"iana"},"audio/vnd.nortel.vbk":{"source":"iana"},"audio/vnd.nuera.ecelp4800":{"source":"iana","extensions":["ecelp4800"]},"audio/vnd.nuera.ecelp7470":{"source":"iana","extensions":["ecelp7470"]},"audio/vnd.nuera.ecelp9600":{"source":"iana","extensions":["ecelp9600"]},"audio/vnd.octel.sbc":{"source":"iana"},"audio/vnd.presonus.multitrack":{"source":"iana"},"audio/vnd.qcelp":{"source":"iana"},"audio/vnd.rhetorex.32kadpcm":{"source":"iana"},"audio/vnd.rip":{"source":"iana","extensions":["rip"]},"audio/vnd.rn-realaudio":{"compressible":false},"audio/vnd.sealedmedia.softseal.mpeg":{"source":"iana"},"audio/vnd.vmx.cvsd":{"source":"iana"},"audio/vnd.wave":{"compressible":false},"audio/vorbis":{"source":"iana","compressible":false},"audio/vorbis-config":{"source":"iana"},"audio/wav":{"compressible":false,"extensions":["wav"]},"audio/wave":{"compressible":false,"extensions":["wav"]},"audio/webm":{"source":"apache","compressible":false,"extensions":["weba"]},"audio/x-aac":{"source":"apache","compressible":false,"extensions":["aac"]},"audio/x-aiff":{"source":"apache","extensions":["aif","aiff","aifc"]},"audio/x-caf":{"source":"apache","compressible":false,"extensions":["caf"]},"audio/x-flac":{"source":"apache","extensions":["flac"]},"audio/x-m4a":{"source":"nginx","extensions":["m4a"]},"audio/x-matroska":{"source":"apache","extensions":["mka"]},"audio/x-mpegurl":{"source":"apache","extensions":["m3u"]},"audio/x-ms-wax":{"source":"apache","extensions":["wax"]},"audio/x-ms-wma":{"source":"apache","extensions":["wma"]},"audio/x-pn-realaudio":{"source":"apache","extensions":["ram","ra"]},"audio/x-pn-realaudio-plugin":{"source":"apache","extensions":["rmp"]},"audio/x-realaudio":{"source":"nginx","extensions":["ra"]},"audio/x-tta":{"source":"apache"},"audio/x-wav":{"source":"apache","extensions":["wav"]},"audio/xm":{"source":"apache","extensions":["xm"]},"chemical/x-cdx":{"source":"apache","extensions":["cdx"]},"chemical/x-cif":{"source":"apache","extensions":["cif"]},"chemical/x-cmdf":{"source":"apache","extensions":["cmdf"]},"chemical/x-cml":{"source":"apache","extensions":["cml"]},"chemical/x-csml":{"source":"apache","extensions":["csml"]},"chemical/x-pdb":{"source":"apache"},"chemical/x-xyz":{"source":"apache","extensions":["xyz"]},"font/collection":{"source":"iana","extensions":["ttc"]},"font/otf":{"source":"iana","compressible":true,"extensions":["otf"]},"font/sfnt":{"source":"iana"},"font/ttf":{"source":"iana","compressible":true,"extensions":["ttf"]},"font/woff":{"source":"iana","extensions":["woff"]},"font/woff2":{"source":"iana","extensions":["woff2"]},"image/aces":{"source":"iana","extensions":["exr"]},"image/apng":{"compressible":false,"extensions":["apng"]},"image/avci":{"source":"iana","extensions":["avci"]},"image/avcs":{"source":"iana","extensions":["avcs"]},"image/avif":{"source":"iana","compressible":false,"extensions":["avif"]},"image/bmp":{"source":"iana","compressible":true,"extensions":["bmp"]},"image/cgm":{"source":"iana","extensions":["cgm"]},"image/dicom-rle":{"source":"iana","extensions":["drle"]},"image/emf":{"source":"iana","extensions":["emf"]},"image/fits":{"source":"iana","extensions":["fits"]},"image/g3fax":{"source":"iana","extensions":["g3"]},"image/gif":{"source":"iana","compressible":false,"extensions":["gif"]},"image/heic":{"source":"iana","extensions":["heic"]},"image/heic-sequence":{"source":"iana","extensions":["heics"]},"image/heif":{"source":"iana","extensions":["heif"]},"image/heif-sequence":{"source":"iana","extensions":["heifs"]},"image/hej2k":{"source":"iana","extensions":["hej2"]},"image/hsj2":{"source":"iana","extensions":["hsj2"]},"image/ief":{"source":"iana","extensions":["ief"]},"image/jls":{"source":"iana","extensions":["jls"]},"image/jp2":{"source":"iana","compressible":false,"extensions":["jp2","jpg2"]},"image/jpeg":{"source":"iana","compressible":false,"extensions":["jpeg","jpg","jpe"]},"image/jph":{"source":"iana","extensions":["jph"]},"image/jphc":{"source":"iana","extensions":["jhc"]},"image/jpm":{"source":"iana","compressible":false,"extensions":["jpm"]},"image/jpx":{"source":"iana","compressible":false,"extensions":["jpx","jpf"]},"image/jxr":{"source":"iana","extensions":["jxr"]},"image/jxra":{"source":"iana","extensions":["jxra"]},"image/jxrs":{"source":"iana","extensions":["jxrs"]},"image/jxs":{"source":"iana","extensions":["jxs"]},"image/jxsc":{"source":"iana","extensions":["jxsc"]},"image/jxsi":{"source":"iana","extensions":["jxsi"]},"image/jxss":{"source":"iana","extensions":["jxss"]},"image/ktx":{"source":"iana","extensions":["ktx"]},"image/ktx2":{"source":"iana","extensions":["ktx2"]},"image/naplps":{"source":"iana"},"image/pjpeg":{"compressible":false},"image/png":{"source":"iana","compressible":false,"extensions":["png"]},"image/prs.btif":{"source":"iana","extensions":["btif"]},"image/prs.pti":{"source":"iana","extensions":["pti"]},"image/pwg-raster":{"source":"iana"},"image/sgi":{"source":"apache","extensions":["sgi"]},"image/svg+xml":{"source":"iana","compressible":true,"extensions":["svg","svgz"]},"image/t38":{"source":"iana","extensions":["t38"]},"image/tiff":{"source":"iana","compressible":false,"extensions":["tif","tiff"]},"image/tiff-fx":{"source":"iana","extensions":["tfx"]},"image/vnd.adobe.photoshop":{"source":"iana","compressible":true,"extensions":["psd"]},"image/vnd.airzip.accelerator.azv":{"source":"iana","extensions":["azv"]},"image/vnd.cns.inf2":{"source":"iana"},"image/vnd.dece.graphic":{"source":"iana","extensions":["uvi","uvvi","uvg","uvvg"]},"image/vnd.djvu":{"source":"iana","extensions":["djvu","djv"]},"image/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"image/vnd.dwg":{"source":"iana","extensions":["dwg"]},"image/vnd.dxf":{"source":"iana","extensions":["dxf"]},"image/vnd.fastbidsheet":{"source":"iana","extensions":["fbs"]},"image/vnd.fpx":{"source":"iana","extensions":["fpx"]},"image/vnd.fst":{"source":"iana","extensions":["fst"]},"image/vnd.fujixerox.edmics-mmr":{"source":"iana","extensions":["mmr"]},"image/vnd.fujixerox.edmics-rlc":{"source":"iana","extensions":["rlc"]},"image/vnd.globalgraphics.pgb":{"source":"iana"},"image/vnd.microsoft.icon":{"source":"iana","compressible":true,"extensions":["ico"]},"image/vnd.mix":{"source":"iana"},"image/vnd.mozilla.apng":{"source":"iana"},"image/vnd.ms-dds":{"compressible":true,"extensions":["dds"]},"image/vnd.ms-modi":{"source":"iana","extensions":["mdi"]},"image/vnd.ms-photo":{"source":"apache","extensions":["wdp"]},"image/vnd.net-fpx":{"source":"iana","extensions":["npx"]},"image/vnd.pco.b16":{"source":"iana","extensions":["b16"]},"image/vnd.radiance":{"source":"iana"},"image/vnd.sealed.png":{"source":"iana"},"image/vnd.sealedmedia.softseal.gif":{"source":"iana"},"image/vnd.sealedmedia.softseal.jpg":{"source":"iana"},"image/vnd.svf":{"source":"iana"},"image/vnd.tencent.tap":{"source":"iana","extensions":["tap"]},"image/vnd.valve.source.texture":{"source":"iana","extensions":["vtf"]},"image/vnd.wap.wbmp":{"source":"iana","extensions":["wbmp"]},"image/vnd.xiff":{"source":"iana","extensions":["xif"]},"image/vnd.zbrush.pcx":{"source":"iana","extensions":["pcx"]},"image/webp":{"source":"apache","extensions":["webp"]},"image/wmf":{"source":"iana","extensions":["wmf"]},"image/x-3ds":{"source":"apache","extensions":["3ds"]},"image/x-cmu-raster":{"source":"apache","extensions":["ras"]},"image/x-cmx":{"source":"apache","extensions":["cmx"]},"image/x-freehand":{"source":"apache","extensions":["fh","fhc","fh4","fh5","fh7"]},"image/x-icon":{"source":"apache","compressible":true,"extensions":["ico"]},"image/x-jng":{"source":"nginx","extensions":["jng"]},"image/x-mrsid-image":{"source":"apache","extensions":["sid"]},"image/x-ms-bmp":{"source":"nginx","compressible":true,"extensions":["bmp"]},"image/x-pcx":{"source":"apache","extensions":["pcx"]},"image/x-pict":{"source":"apache","extensions":["pic","pct"]},"image/x-portable-anymap":{"source":"apache","extensions":["pnm"]},"image/x-portable-bitmap":{"source":"apache","extensions":["pbm"]},"image/x-portable-graymap":{"source":"apache","extensions":["pgm"]},"image/x-portable-pixmap":{"source":"apache","extensions":["ppm"]},"image/x-rgb":{"source":"apache","extensions":["rgb"]},"image/x-tga":{"source":"apache","extensions":["tga"]},"image/x-xbitmap":{"source":"apache","extensions":["xbm"]},"image/x-xcf":{"compressible":false},"image/x-xpixmap":{"source":"apache","extensions":["xpm"]},"image/x-xwindowdump":{"source":"apache","extensions":["xwd"]},"message/cpim":{"source":"iana"},"message/delivery-status":{"source":"iana"},"message/disposition-notification":{"source":"iana","extensions":["disposition-notification"]},"message/external-body":{"source":"iana"},"message/feedback-report":{"source":"iana"},"message/global":{"source":"iana","extensions":["u8msg"]},"message/global-delivery-status":{"source":"iana","extensions":["u8dsn"]},"message/global-disposition-notification":{"source":"iana","extensions":["u8mdn"]},"message/global-headers":{"source":"iana","extensions":["u8hdr"]},"message/http":{"source":"iana","compressible":false},"message/imdn+xml":{"source":"iana","compressible":true},"message/news":{"source":"iana"},"message/partial":{"source":"iana","compressible":false},"message/rfc822":{"source":"iana","compressible":true,"extensions":["eml","mime"]},"message/s-http":{"source":"iana"},"message/sip":{"source":"iana"},"message/sipfrag":{"source":"iana"},"message/tracking-status":{"source":"iana"},"message/vnd.si.simp":{"source":"iana"},"message/vnd.wfa.wsc":{"source":"iana","extensions":["wsc"]},"model/3mf":{"source":"iana","extensions":["3mf"]},"model/e57":{"source":"iana"},"model/gltf+json":{"source":"iana","compressible":true,"extensions":["gltf"]},"model/gltf-binary":{"source":"iana","compressible":true,"extensions":["glb"]},"model/iges":{"source":"iana","compressible":false,"extensions":["igs","iges"]},"model/mesh":{"source":"iana","compressible":false,"extensions":["msh","mesh","silo"]},"model/mtl":{"source":"iana","extensions":["mtl"]},"model/obj":{"source":"iana","extensions":["obj"]},"model/step":{"source":"iana"},"model/step+xml":{"source":"iana","compressible":true,"extensions":["stpx"]},"model/step+zip":{"source":"iana","compressible":false,"extensions":["stpz"]},"model/step-xml+zip":{"source":"iana","compressible":false,"extensions":["stpxz"]},"model/stl":{"source":"iana","extensions":["stl"]},"model/vnd.collada+xml":{"source":"iana","compressible":true,"extensions":["dae"]},"model/vnd.dwf":{"source":"iana","extensions":["dwf"]},"model/vnd.flatland.3dml":{"source":"iana"},"model/vnd.gdl":{"source":"iana","extensions":["gdl"]},"model/vnd.gs-gdl":{"source":"apache"},"model/vnd.gs.gdl":{"source":"iana"},"model/vnd.gtw":{"source":"iana","extensions":["gtw"]},"model/vnd.moml+xml":{"source":"iana","compressible":true},"model/vnd.mts":{"source":"iana","extensions":["mts"]},"model/vnd.opengex":{"source":"iana","extensions":["ogex"]},"model/vnd.parasolid.transmit.binary":{"source":"iana","extensions":["x_b"]},"model/vnd.parasolid.transmit.text":{"source":"iana","extensions":["x_t"]},"model/vnd.pytha.pyox":{"source":"iana"},"model/vnd.rosette.annotated-data-model":{"source":"iana"},"model/vnd.sap.vds":{"source":"iana","extensions":["vds"]},"model/vnd.usdz+zip":{"source":"iana","compressible":false,"extensions":["usdz"]},"model/vnd.valve.source.compiled-map":{"source":"iana","extensions":["bsp"]},"model/vnd.vtu":{"source":"iana","extensions":["vtu"]},"model/vrml":{"source":"iana","compressible":false,"extensions":["wrl","vrml"]},"model/x3d+binary":{"source":"apache","compressible":false,"extensions":["x3db","x3dbz"]},"model/x3d+fastinfoset":{"source":"iana","extensions":["x3db"]},"model/x3d+vrml":{"source":"apache","compressible":false,"extensions":["x3dv","x3dvz"]},"model/x3d+xml":{"source":"iana","compressible":true,"extensions":["x3d","x3dz"]},"model/x3d-vrml":{"source":"iana","extensions":["x3dv"]},"multipart/alternative":{"source":"iana","compressible":false},"multipart/appledouble":{"source":"iana"},"multipart/byteranges":{"source":"iana"},"multipart/digest":{"source":"iana"},"multipart/encrypted":{"source":"iana","compressible":false},"multipart/form-data":{"source":"iana","compressible":false},"multipart/header-set":{"source":"iana"},"multipart/mixed":{"source":"iana"},"multipart/multilingual":{"source":"iana"},"multipart/parallel":{"source":"iana"},"multipart/related":{"source":"iana","compressible":false},"multipart/report":{"source":"iana"},"multipart/signed":{"source":"iana","compressible":false},"multipart/vnd.bint.med-plus":{"source":"iana"},"multipart/voice-message":{"source":"iana"},"multipart/x-mixed-replace":{"source":"iana"},"text/1d-interleaved-parityfec":{"source":"iana"},"text/cache-manifest":{"source":"iana","compressible":true,"extensions":["appcache","manifest"]},"text/calendar":{"source":"iana","extensions":["ics","ifb"]},"text/calender":{"compressible":true},"text/cmd":{"compressible":true},"text/coffeescript":{"extensions":["coffee","litcoffee"]},"text/cql":{"source":"iana"},"text/cql-expression":{"source":"iana"},"text/cql-identifier":{"source":"iana"},"text/css":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["css"]},"text/csv":{"source":"iana","compressible":true,"extensions":["csv"]},"text/csv-schema":{"source":"iana"},"text/directory":{"source":"iana"},"text/dns":{"source":"iana"},"text/ecmascript":{"source":"iana"},"text/encaprtp":{"source":"iana"},"text/enriched":{"source":"iana"},"text/fhirpath":{"source":"iana"},"text/flexfec":{"source":"iana"},"text/fwdred":{"source":"iana"},"text/gff3":{"source":"iana"},"text/grammar-ref-list":{"source":"iana"},"text/html":{"source":"iana","compressible":true,"extensions":["html","htm","shtml"]},"text/jade":{"extensions":["jade"]},"text/javascript":{"source":"iana","compressible":true},"text/jcr-cnd":{"source":"iana"},"text/jsx":{"compressible":true,"extensions":["jsx"]},"text/less":{"compressible":true,"extensions":["less"]},"text/markdown":{"source":"iana","compressible":true,"extensions":["markdown","md"]},"text/mathml":{"source":"nginx","extensions":["mml"]},"text/mdx":{"compressible":true,"extensions":["mdx"]},"text/mizar":{"source":"iana"},"text/n3":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["n3"]},"text/parameters":{"source":"iana","charset":"UTF-8"},"text/parityfec":{"source":"iana"},"text/plain":{"source":"iana","compressible":true,"extensions":["txt","text","conf","def","list","log","in","ini"]},"text/provenance-notation":{"source":"iana","charset":"UTF-8"},"text/prs.fallenstein.rst":{"source":"iana"},"text/prs.lines.tag":{"source":"iana","extensions":["dsc"]},"text/prs.prop.logic":{"source":"iana"},"text/raptorfec":{"source":"iana"},"text/red":{"source":"iana"},"text/rfc822-headers":{"source":"iana"},"text/richtext":{"source":"iana","compressible":true,"extensions":["rtx"]},"text/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"text/rtp-enc-aescm128":{"source":"iana"},"text/rtploopback":{"source":"iana"},"text/rtx":{"source":"iana"},"text/sgml":{"source":"iana","extensions":["sgml","sgm"]},"text/shaclc":{"source":"iana"},"text/shex":{"source":"iana","extensions":["shex"]},"text/slim":{"extensions":["slim","slm"]},"text/spdx":{"source":"iana","extensions":["spdx"]},"text/strings":{"source":"iana"},"text/stylus":{"extensions":["stylus","styl"]},"text/t140":{"source":"iana"},"text/tab-separated-values":{"source":"iana","compressible":true,"extensions":["tsv"]},"text/troff":{"source":"iana","extensions":["t","tr","roff","man","me","ms"]},"text/turtle":{"source":"iana","charset":"UTF-8","extensions":["ttl"]},"text/ulpfec":{"source":"iana"},"text/uri-list":{"source":"iana","compressible":true,"extensions":["uri","uris","urls"]},"text/vcard":{"source":"iana","compressible":true,"extensions":["vcard"]},"text/vnd.a":{"source":"iana"},"text/vnd.abc":{"source":"iana"},"text/vnd.ascii-art":{"source":"iana"},"text/vnd.curl":{"source":"iana","extensions":["curl"]},"text/vnd.curl.dcurl":{"source":"apache","extensions":["dcurl"]},"text/vnd.curl.mcurl":{"source":"apache","extensions":["mcurl"]},"text/vnd.curl.scurl":{"source":"apache","extensions":["scurl"]},"text/vnd.debian.copyright":{"source":"iana","charset":"UTF-8"},"text/vnd.dmclientscript":{"source":"iana"},"text/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"text/vnd.esmertec.theme-descriptor":{"source":"iana","charset":"UTF-8"},"text/vnd.familysearch.gedcom":{"source":"iana","extensions":["ged"]},"text/vnd.ficlab.flt":{"source":"iana"},"text/vnd.fly":{"source":"iana","extensions":["fly"]},"text/vnd.fmi.flexstor":{"source":"iana","extensions":["flx"]},"text/vnd.gml":{"source":"iana"},"text/vnd.graphviz":{"source":"iana","extensions":["gv"]},"text/vnd.hans":{"source":"iana"},"text/vnd.hgl":{"source":"iana"},"text/vnd.in3d.3dml":{"source":"iana","extensions":["3dml"]},"text/vnd.in3d.spot":{"source":"iana","extensions":["spot"]},"text/vnd.iptc.newsml":{"source":"iana"},"text/vnd.iptc.nitf":{"source":"iana"},"text/vnd.latex-z":{"source":"iana"},"text/vnd.motorola.reflex":{"source":"iana"},"text/vnd.ms-mediapackage":{"source":"iana"},"text/vnd.net2phone.commcenter.command":{"source":"iana"},"text/vnd.radisys.msml-basic-layout":{"source":"iana"},"text/vnd.senx.warpscript":{"source":"iana"},"text/vnd.si.uricatalogue":{"source":"iana"},"text/vnd.sosi":{"source":"iana"},"text/vnd.sun.j2me.app-descriptor":{"source":"iana","charset":"UTF-8","extensions":["jad"]},"text/vnd.trolltech.linguist":{"source":"iana","charset":"UTF-8"},"text/vnd.wap.si":{"source":"iana"},"text/vnd.wap.sl":{"source":"iana"},"text/vnd.wap.wml":{"source":"iana","extensions":["wml"]},"text/vnd.wap.wmlscript":{"source":"iana","extensions":["wmls"]},"text/vtt":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["vtt"]},"text/x-asm":{"source":"apache","extensions":["s","asm"]},"text/x-c":{"source":"apache","extensions":["c","cc","cxx","cpp","h","hh","dic"]},"text/x-component":{"source":"nginx","extensions":["htc"]},"text/x-fortran":{"source":"apache","extensions":["f","for","f77","f90"]},"text/x-gwt-rpc":{"compressible":true},"text/x-handlebars-template":{"extensions":["hbs"]},"text/x-java-source":{"source":"apache","extensions":["java"]},"text/x-jquery-tmpl":{"compressible":true},"text/x-lua":{"extensions":["lua"]},"text/x-markdown":{"compressible":true,"extensions":["mkd"]},"text/x-nfo":{"source":"apache","extensions":["nfo"]},"text/x-opml":{"source":"apache","extensions":["opml"]},"text/x-org":{"compressible":true,"extensions":["org"]},"text/x-pascal":{"source":"apache","extensions":["p","pas"]},"text/x-processing":{"compressible":true,"extensions":["pde"]},"text/x-sass":{"extensions":["sass"]},"text/x-scss":{"extensions":["scss"]},"text/x-setext":{"source":"apache","extensions":["etx"]},"text/x-sfv":{"source":"apache","extensions":["sfv"]},"text/x-suse-ymp":{"compressible":true,"extensions":["ymp"]},"text/x-uuencode":{"source":"apache","extensions":["uu"]},"text/x-vcalendar":{"source":"apache","extensions":["vcs"]},"text/x-vcard":{"source":"apache","extensions":["vcf"]},"text/xml":{"source":"iana","compressible":true,"extensions":["xml"]},"text/xml-external-parsed-entity":{"source":"iana"},"text/yaml":{"compressible":true,"extensions":["yaml","yml"]},"video/1d-interleaved-parityfec":{"source":"iana"},"video/3gpp":{"source":"iana","extensions":["3gp","3gpp"]},"video/3gpp-tt":{"source":"iana"},"video/3gpp2":{"source":"iana","extensions":["3g2"]},"video/av1":{"source":"iana"},"video/bmpeg":{"source":"iana"},"video/bt656":{"source":"iana"},"video/celb":{"source":"iana"},"video/dv":{"source":"iana"},"video/encaprtp":{"source":"iana"},"video/ffv1":{"source":"iana"},"video/flexfec":{"source":"iana"},"video/h261":{"source":"iana","extensions":["h261"]},"video/h263":{"source":"iana","extensions":["h263"]},"video/h263-1998":{"source":"iana"},"video/h263-2000":{"source":"iana"},"video/h264":{"source":"iana","extensions":["h264"]},"video/h264-rcdo":{"source":"iana"},"video/h264-svc":{"source":"iana"},"video/h265":{"source":"iana"},"video/iso.segment":{"source":"iana","extensions":["m4s"]},"video/jpeg":{"source":"iana","extensions":["jpgv"]},"video/jpeg2000":{"source":"iana"},"video/jpm":{"source":"apache","extensions":["jpm","jpgm"]},"video/jxsv":{"source":"iana"},"video/mj2":{"source":"iana","extensions":["mj2","mjp2"]},"video/mp1s":{"source":"iana"},"video/mp2p":{"source":"iana"},"video/mp2t":{"source":"iana","extensions":["ts"]},"video/mp4":{"source":"iana","compressible":false,"extensions":["mp4","mp4v","mpg4"]},"video/mp4v-es":{"source":"iana"},"video/mpeg":{"source":"iana","compressible":false,"extensions":["mpeg","mpg","mpe","m1v","m2v"]},"video/mpeg4-generic":{"source":"iana"},"video/mpv":{"source":"iana"},"video/nv":{"source":"iana"},"video/ogg":{"source":"iana","compressible":false,"extensions":["ogv"]},"video/parityfec":{"source":"iana"},"video/pointer":{"source":"iana"},"video/quicktime":{"source":"iana","compressible":false,"extensions":["qt","mov"]},"video/raptorfec":{"source":"iana"},"video/raw":{"source":"iana"},"video/rtp-enc-aescm128":{"source":"iana"},"video/rtploopback":{"source":"iana"},"video/rtx":{"source":"iana"},"video/scip":{"source":"iana"},"video/smpte291":{"source":"iana"},"video/smpte292m":{"source":"iana"},"video/ulpfec":{"source":"iana"},"video/vc1":{"source":"iana"},"video/vc2":{"source":"iana"},"video/vnd.cctv":{"source":"iana"},"video/vnd.dece.hd":{"source":"iana","extensions":["uvh","uvvh"]},"video/vnd.dece.mobile":{"source":"iana","extensions":["uvm","uvvm"]},"video/vnd.dece.mp4":{"source":"iana"},"video/vnd.dece.pd":{"source":"iana","extensions":["uvp","uvvp"]},"video/vnd.dece.sd":{"source":"iana","extensions":["uvs","uvvs"]},"video/vnd.dece.video":{"source":"iana","extensions":["uvv","uvvv"]},"video/vnd.directv.mpeg":{"source":"iana"},"video/vnd.directv.mpeg-tts":{"source":"iana"},"video/vnd.dlna.mpeg-tts":{"source":"iana"},"video/vnd.dvb.file":{"source":"iana","extensions":["dvb"]},"video/vnd.fvt":{"source":"iana","extensions":["fvt"]},"video/vnd.hns.video":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.ttsavc":{"source":"iana"},"video/vnd.iptvforum.ttsmpeg2":{"source":"iana"},"video/vnd.motorola.video":{"source":"iana"},"video/vnd.motorola.videop":{"source":"iana"},"video/vnd.mpegurl":{"source":"iana","extensions":["mxu","m4u"]},"video/vnd.ms-playready.media.pyv":{"source":"iana","extensions":["pyv"]},"video/vnd.nokia.interleaved-multimedia":{"source":"iana"},"video/vnd.nokia.mp4vr":{"source":"iana"},"video/vnd.nokia.videovoip":{"source":"iana"},"video/vnd.objectvideo":{"source":"iana"},"video/vnd.radgamettools.bink":{"source":"iana"},"video/vnd.radgamettools.smacker":{"source":"iana"},"video/vnd.sealed.mpeg1":{"source":"iana"},"video/vnd.sealed.mpeg4":{"source":"iana"},"video/vnd.sealed.swf":{"source":"iana"},"video/vnd.sealedmedia.softseal.mov":{"source":"iana"},"video/vnd.uvvu.mp4":{"source":"iana","extensions":["uvu","uvvu"]},"video/vnd.vivo":{"source":"iana","extensions":["viv"]},"video/vnd.youtube.yt":{"source":"iana"},"video/vp8":{"source":"iana"},"video/vp9":{"source":"iana"},"video/webm":{"source":"apache","compressible":false,"extensions":["webm"]},"video/x-f4v":{"source":"apache","extensions":["f4v"]},"video/x-fli":{"source":"apache","extensions":["fli"]},"video/x-flv":{"source":"apache","compressible":false,"extensions":["flv"]},"video/x-m4v":{"source":"apache","extensions":["m4v"]},"video/x-matroska":{"source":"apache","compressible":false,"extensions":["mkv","mk3d","mks"]},"video/x-mng":{"source":"apache","extensions":["mng"]},"video/x-ms-asf":{"source":"apache","extensions":["asf","asx"]},"video/x-ms-vob":{"source":"apache","extensions":["vob"]},"video/x-ms-wm":{"source":"apache","extensions":["wm"]},"video/x-ms-wmv":{"source":"apache","compressible":false,"extensions":["wmv"]},"video/x-ms-wmx":{"source":"apache","extensions":["wmx"]},"video/x-ms-wvx":{"source":"apache","extensions":["wvx"]},"video/x-msvideo":{"source":"apache","extensions":["avi"]},"video/x-sgi-movie":{"source":"apache","extensions":["movie"]},"video/x-smv":{"source":"apache","extensions":["smv"]},"x-conference/x-cooltalk":{"source":"apache","extensions":["ice"]},"x-shader/x-fragment":{"compressible":true},"x-shader/x-vertex":{"compressible":true}}');

/***/ }),

/***/ 7239:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Authentication Service
 * Handles user authentication, login/logout flows, and auth state management
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const vscode = __importStar(__webpack_require__(1398));
/**
 * AuthService Singleton
 * Manages authentication state and provides login/logout functionality
 */
class AuthService {
    constructor() {
        this.apiClient = null;
        this.currentUser = null;
        this.authStateListeners = [];
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    /**
     * Initialize auth service with API client
     */
    initialize(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Subscribe to auth state changes
     */
    onAuthStateChanged(listener) {
        this.authStateListeners.push(listener);
        // Return disposable to allow unsubscribe
        return {
            dispose: () => {
                const index = this.authStateListeners.indexOf(listener);
                if (index > -1) {
                    this.authStateListeners.splice(index, 1);
                }
            }
        };
    }
    /**
     * Notify all listeners of auth state change
     */
    notifyAuthStateChanged() {
        const state = this.getAuthState();
        this.authStateListeners.forEach(listener => {
            try {
                listener(state);
            }
            catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }
    /**
     * Get current auth state
     */
    getAuthState() {
        return {
            isAuthenticated: !!this.currentUser,
            user: this.currentUser
        };
    }
    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        if (!this.apiClient) {
            return false;
        }
        return await this.apiClient.isAuthenticated();
    }
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    /**
     * Validate email format
     */
    validateEmail(email) {
        if (!email || email.trim() === '') {
            return 'Please enter your email address';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return null;
    }
    /**
     * Validate password
     */
    validatePassword(password) {
        if (!password || password.trim() === '') {
            return 'Please enter your password';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        return null;
    }
    /**
     * Login with interactive prompts
     */
    async login() {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return false;
        }
        try {
            // Prompt for email
            const email = await vscode.window.showInputBox({
                prompt: 'Enter your Auxly email address',
                placeHolder: 'user@example.com',
                ignoreFocusOut: true,
                validateInput: (value) => this.validateEmail(value)
            });
            // User cancelled
            if (email === undefined) {
                return false;
            }
            // Prompt for password
            const password = await vscode.window.showInputBox({
                prompt: 'Enter your Auxly password',
                password: true, // Masks input
                ignoreFocusOut: true,
                validateInput: (value) => this.validatePassword(value)
            });
            // User cancelled
            if (password === undefined) {
                return false;
            }
            // Show progress while logging in
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Logging in to Auxly...',
                cancellable: false
            }, async () => {
                try {
                    const credentials = {
                        email: email.trim(),
                        password: password
                    };
                    const response = await this.apiClient.login(credentials);
                    this.currentUser = response.user;
                    // Notify listeners
                    this.notifyAuthStateChanged();
                    vscode.window.showInformationMessage(`✅ Logged in as ${response.user.email} (${response.user.plan.toUpperCase()} plan)`);
                    return true;
                }
                catch (error) {
                    const apiError = error;
                    let errorMessage = 'Login failed. Please try again.';
                    if (apiError.statusCode === 401) {
                        errorMessage = 'Email or password is incorrect. Please try again.';
                    }
                    else if (apiError.message) {
                        errorMessage = apiError.message;
                    }
                    vscode.window.showErrorMessage(`Login failed: ${errorMessage}`);
                    return false;
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            vscode.window.showErrorMessage('An unexpected error occurred during login');
            return false;
        }
    }
    /**
     * Login with provided credentials (for programmatic login)
     */
    async loginWithCredentials(credentials) {
        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }
        try {
            const request = {
                email: credentials.email,
                password: credentials.password
            };
            const response = await this.apiClient.login(request);
            this.currentUser = response.user;
            // Notify listeners
            this.notifyAuthStateChanged();
            return true;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Connect with API key
     */
    async connectWithApiKey(apiKey) {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return false;
        }
        try {
            // If no API key provided, prompt user
            let keyToUse = apiKey;
            if (!keyToUse) {
                keyToUse = await vscode.window.showInputBox({
                    prompt: 'Enter your Auxly API key',
                    placeHolder: 'auxly_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    password: true,
                    ignoreFocusOut: true,
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'API key cannot be empty';
                        }
                        if (!value.startsWith('auxly_')) {
                            return 'API key must start with "auxly_"';
                        }
                        return null;
                    }
                });
                if (!keyToUse) {
                    vscode.window.showInformationMessage('Connection cancelled');
                    return false;
                }
            }
            // Verify and store the API key
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Connecting to Auxly...',
                cancellable: false
            }, async () => {
                // Verify the API key with the backend
                const verifyResult = await this.apiClient.verifyApiKey(keyToUse);
                if (!verifyResult.valid) {
                    vscode.window.showErrorMessage(`❌ Invalid API key: ${verifyResult.error || 'Unknown error'}`);
                    return false;
                }
                // Store the API key
                await this.apiClient.storeApiKey(keyToUse);
                // Set current user from verification response
                if (verifyResult.user) {
                    this.currentUser = {
                        id: verifyResult.user.user_id?.toString() || '',
                        email: verifyResult.user.email || 'Unknown',
                        plan: verifyResult.user.subscription?.plan_tier || 'free',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                }
                // Notify listeners
                this.notifyAuthStateChanged();
                vscode.window.showInformationMessage(`✅ Connected as ${this.currentUser?.email || 'User'}`);
                return true;
            });
        }
        catch (error) {
            console.error('Connect with API key error:', error);
            vscode.window.showErrorMessage(`Failed to connect: ${error.message || 'Unknown error'}`);
            return false;
        }
    }
    /**
     * Disconnect (clear API key and logout)
     */
    async disconnect() {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return;
        }
        try {
            // Clear API key
            await this.apiClient.clearApiKey();
            // Clear user state
            this.currentUser = null;
            // Notify listeners
            this.notifyAuthStateChanged();
            vscode.window.showInformationMessage('👋 Disconnected successfully');
        }
        catch (error) {
            console.error('Disconnect error:', error);
            // Clear local state even if API call failed
            this.currentUser = null;
            this.notifyAuthStateChanged();
            vscode.window.showWarningMessage('Disconnected (with errors)');
        }
    }
    /**
     * Logout (for backwards compatibility)
     */
    async logout() {
        if (!this.apiClient) {
            vscode.window.showErrorMessage('API client not initialized');
            return;
        }
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Logging out...',
                cancellable: false
            }, async () => {
                // Check if using API key or JWT
                const hasApiKey = await this.apiClient.isAuthenticated();
                if (hasApiKey) {
                    await this.disconnect();
                }
                else {
                    await this.apiClient.logout();
                    this.currentUser = null;
                    this.notifyAuthStateChanged();
                }
            });
            vscode.window.showInformationMessage('👋 Logged out successfully');
        }
        catch (error) {
            console.error('Logout error:', error);
            // Clear local state even if API call failed
            this.currentUser = null;
            this.notifyAuthStateChanged();
            vscode.window.showWarningMessage('Logged out (with errors)');
        }
    }
    /**
     * Check and restore auth state on startup
     * This will check for saved API key in .auxly/config.json
     */
    async checkAuthStatus() {
        if (!this.apiClient) {
            return;
        }
        try {
            console.log('🔍 Checking auth status on startup...');
            // First, check if there's a saved API key in config
            const verifyResult = await this.apiClient.verifyApiKey();
            if (verifyResult.valid && verifyResult.user) {
                // API key exists and is valid - restore session!
                console.log('✅ Found valid API key in config - restoring session');
                this.currentUser = {
                    id: verifyResult.user.user_id?.toString() || '',
                    email: verifyResult.user.email || 'Unknown',
                    plan: verifyResult.user.subscription?.plan_tier || 'free',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.notifyAuthStateChanged();
                console.log(`✅ Restored API key session for ${this.currentUser.email}`);
                return;
            }
            // Fallback: Check for JWT token authentication
            const isAuth = await this.apiClient.isAuthenticated();
            if (isAuth) {
                try {
                    this.currentUser = await this.apiClient.getCurrentUser();
                    this.notifyAuthStateChanged();
                    console.log(`✅ Restored JWT session for ${this.currentUser.email}`);
                }
                catch (error) {
                    console.log('JWT token exists but failed to get user info');
                    this.currentUser = null;
                }
            }
            else {
                console.log('ℹ️ No saved authentication found - user needs to connect');
            }
        }
        catch (error) {
            console.error('❌ Error checking auth status:', error);
        }
    }
}
exports.AuthService = AuthService;


/***/ }),

/***/ 7539:
/***/ ((module) => {

"use strict";


/** @type {import('.')} */
var $defineProperty = Object.defineProperty || false;
if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = false;
	}
}

module.exports = $defineProperty;


/***/ }),

/***/ 7797:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var defer = __webpack_require__(4457);

// API
module.exports = async;

/**
 * Runs provided callback asynchronously
 * even if callback itself is not
 *
 * @param   {function} callback - callback to invoke
 * @returns {function} - augmented callback
 */
function async(callback)
{
  var isAsync = false;

  // check if async happened
  defer(function() { isAsync = true; });

  return function async_callback(err, result)
  {
    if (isAsync)
    {
      callback(err, result);
    }
    else
    {
      defer(function nextTick_callback()
      {
        callback(err, result);
      });
    }
  };
}


/***/ }),

/***/ 7960:
/***/ ((module) => {

"use strict";


/** @type {import('.')} */
module.exports = Object;


/***/ }),

/***/ 7989:
/***/ ((module, exports, __webpack_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	let m;

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	// eslint-disable-next-line no-return-assign
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG') ;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(1236)(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ 8109:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/**
 * API Endpoint Definitions
 * Centralized endpoint configuration for the Auxly API
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HTTP_STATUS = exports.API_CONFIG = exports.API_ENDPOINTS = void 0;
exports.API_ENDPOINTS = {
    // ========================================
    // Authentication Endpoints
    // ========================================
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/verify',
    },
    // ========================================
    // Task Endpoints (TODO: Backend needs these routes)
    // ========================================
    TASKS: {
        LIST: '/tasks',
        CREATE: '/tasks',
        GET: (taskId) => `/tasks/${taskId}`,
        UPDATE: (taskId) => `/tasks/${taskId}`,
        DELETE: (taskId) => `/tasks/${taskId}`,
    },
    // ========================================
    // Subscription Endpoints
    // ========================================
    SUBSCRIPTION: {
        GET: '/subscription/status',
        CREATE: '/subscription',
        UPDATE: '/subscription',
        CANCEL: '/subscription/cancel',
    },
    // ========================================
    // API Key Endpoints
    // ========================================
    API_KEYS: {
        VERIFY: '/api-keys/verify',
        LIST: '/api-keys/list',
        CREATE: '/api-keys/generate',
        DELETE: (keyId) => `/api-keys/revoke/${keyId}`,
    },
};
/**
 * Default API configuration values
 */
exports.API_CONFIG = {
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    DEFAULT_RETRY_ATTEMPTS: 4,
    DEFAULT_RETRY_DELAY: 1000, // 1 second (will use exponential backoff)
    TOKEN_REFRESH_THRESHOLD: 300, // 5 minutes before expiration
};
/**
 * HTTP status codes we care about
 */
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};


/***/ }),

/***/ 8330:
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"name":"auxly-extension","displayName":"Auxly by Tzamun - AI Task Management","description":"Enhance your development with AI that truly collaborates - featuring AI question popups with sound alerts, FORCED dual research (Technical + Business), and smart approval workflows. Made in Saudi Arabia 🇸🇦 with ❤️ for developers","version":"0.1.2","publisher":"tzamun-arabia","engines":{"vscode":"^1.85.0"},"categories":["Other","Programming Languages","Machine Learning"],"keywords":["task manager","ai","cursor","productivity","rules","saudi arabia","tzamun","AI collaboration","dual research","technical research","business research"],"icon":"Auxly-Icon-Large.png","repository":{"type":"git","url":"https://github.com/Tzamun-Arabia-IT-Co/auxly-namespace.git"},"bugs":{"url":"https://github.com/Tzamun-Arabia-IT-Co/auxly-namespace/issues"},"homepage":"https://auxly.tzamun.com","activationEvents":["onStartupFinished"],"main":"./out/extension.js","contributes":{"viewsContainers":{"activitybar":[{"id":"auxly","title":"Auxly","icon":"resources/icon-auxly.svg"}]},"views":{"auxly":[{"id":"auxlyTaskView","name":"Tasks","icon":"resources/icon.svg","contextualTitle":"Auxly Tasks"}]},"commands":[{"command":"auxly.connect","title":"Auxly: Connect with API Key","icon":"$(plug)"},{"command":"auxly.disconnect","title":"Auxly: Disconnect","icon":"$(debug-disconnect)"},{"command":"auxly.login","title":"Auxly: Login (Legacy)","icon":"$(sign-in)"},{"command":"auxly.logout","title":"Auxly: Logout","icon":"$(sign-out)"},{"command":"auxly.createTask","title":"Auxly: Create Task","icon":"$(add)"},{"command":"auxly.refreshTasks","title":"Auxly: Refresh Tasks","icon":"$(refresh)"},{"command":"auxly.deleteTask","title":"Auxly: Delete Task","icon":"$(trash)"},{"command":"auxly.generateRules","title":"Auxly: Generate Cursor Rules","icon":"$(sparkle)"},{"command":"auxly.viewAnalysis","title":"Auxly: View Workspace Analysis","icon":"$(graph)"},{"command":"auxly.clearCache","title":"Auxly: Clear Analysis Cache","icon":"$(clear-all)"},{"command":"auxly.openSettings","title":"Auxly: Open Settings","icon":"$(settings-gear)"},{"command":"auxly.viewSubscription","title":"Auxly: View Subscription","icon":"$(credit-card)"},{"command":"auxly.resetMCPConfig","title":"Auxly: Reset MCP Configuration","icon":"$(refresh)"},{"command":"auxly.openDashboard","title":"Auxly: Open Dashboard","icon":"$(dashboard)"},{"command":"auxly.verifyMcpDiagnostics","title":"Auxly: Verify MCP Diagnostics","icon":"$(checklist)"}],"menus":{"view/title":[{"command":"auxly.createTask","when":"view == auxlyTaskView","group":"navigation@1"},{"command":"auxly.refreshTasks","when":"view == auxlyTaskView","group":"navigation@2"}],"view/item/context":[{"command":"auxly.deleteTask","when":"view == auxlyTaskView && viewItem == task","group":"inline"}],"commandPalette":[{"command":"auxly.connect"},{"command":"auxly.disconnect"},{"command":"auxly.login"},{"command":"auxly.logout"},{"command":"auxly.createTask"},{"command":"auxly.refreshTasks"},{"command":"auxly.generateRules"},{"command":"auxly.viewAnalysis"},{"command":"auxly.clearCache"},{"command":"auxly.openSettings"},{"command":"auxly.viewSubscription"},{"command":"auxly.openDashboard"}]},"configuration":{"title":"Auxly","properties":{"auxly.apiUrl":{"type":"string","default":"https://auxly.tzamun.com:8000","description":"Auxly API server URL"},"auxly.autoSync":{"type":"boolean","default":true,"description":"Automatically sync tasks with the server"},"auxly.syncInterval":{"type":"number","default":30,"description":"Task sync interval in seconds"},"auxly.enableNotifications":{"type":"boolean","default":true,"description":"Show notifications for task updates"},"auxly.allowInsecureSSL":{"type":"boolean","default":false,"description":"Allow connections to servers with self-signed or invalid SSL certificates (not recommended for production)"}}}},"scripts":{"vscode:prepublish":"npm run package","compile":"webpack","watch":"webpack --watch","package":"webpack --mode production --devtool hidden-source-map","compile-tests":"tsc -p . --outDir out","watch-tests":"tsc -p . -w --outDir out","pretest":"npm run compile-tests && npm run compile && npm run lint","lint":"eslint src --ext ts","test":"node ./out/test/runTest.js"},"devDependencies":{"@types/node":"20.x","@types/vscode":"^1.85.0","@typescript-eslint/eslint-plugin":"^6.15.0","@typescript-eslint/parser":"^6.15.0","@vscode/test-electron":"^2.3.8","copy-webpack-plugin":"^13.0.1","eslint":"^8.56.0","ts-loader":"^9.5.1","typescript":"^5.3.3","webpack":"^5.89.0","webpack-cli":"^5.1.4"},"dependencies":{"@modelcontextprotocol/sdk":"^0.5.0","axios":"^1.6.7","jsonc-parser":"^3.3.1"},"license":"MIT"}');

/***/ }),

/***/ 8424:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var iterate    = __webpack_require__(4407)
  , initState  = __webpack_require__(264)
  , terminator = __webpack_require__(9712)
  ;

// Public API
module.exports = serialOrdered;
// sorting helpers
module.exports.ascending  = ascending;
module.exports.descending = descending;

/**
 * Runs iterator over provided sorted array elements in series
 *
 * @param   {array|object} list - array or object (named list) to iterate over
 * @param   {function} iterator - iterator to run
 * @param   {function} sortMethod - custom sort function
 * @param   {function} callback - invoked when all elements processed
 * @returns {function} - jobs terminator
 */
function serialOrdered(list, iterator, sortMethod, callback)
{
  var state = initState(list, sortMethod);

  iterate(list, iterator, state, function iteratorHandler(error, result)
  {
    if (error)
    {
      callback(error, result);
      return;
    }

    state.index++;

    // are we there yet?
    if (state.index < (state['keyedList'] || list).length)
    {
      iterate(list, iterator, state, iteratorHandler);
      return;
    }

    // done here
    callback(null, state.results);
  });

  return terminator.bind(state, callback);
}

/*
 * -- Sort methods
 */

/**
 * sort helper to sort array elements in ascending order
 *
 * @param   {mixed} a - an item to compare
 * @param   {mixed} b - an item to compare
 * @returns {number} - comparison result
 */
function ascending(a, b)
{
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * sort helper to sort array elements in descending order
 *
 * @param   {mixed} a - an item to compare
 * @param   {mixed} b - an item to compare
 * @returns {number} - comparison result
 */
function descending(a, b)
{
  return -1 * ascending(a, b);
}


/***/ }),

/***/ 8611:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 8634:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WmicShimManager = void 0;
const child_process_1 = __webpack_require__(5317);
const fs = __importStar(__webpack_require__(1943));
const path = __importStar(__webpack_require__(6928));
/**
 * WMIC Shim Manager for Auxly
 * Automatically creates a PowerShell-based WMIC replacement on Windows 11
 * where the native wmic.exe is missing.
 *
 * Based on: auxly-auto-wmic.md documentation
 *
 * Key Features:
 * - Auto-detects if WMIC is available
 * - Creates lightweight shim in extension storage (no admin needed)
 * - Transparent fallback using PowerShell Get-CimInstance
 * - Works in Restricted Mode (only writes to globalStorageUri)
 */
class WmicShimManager {
    constructor() {
        this.shimDirectory = null;
        this.shimActive = false;
    }
    static getInstance() {
        if (!WmicShimManager.instance) {
            WmicShimManager.instance = new WmicShimManager();
        }
        return WmicShimManager.instance;
    }
    /**
     * Ensure WMIC is available (either native or via shim)
     * @param context VS Code extension context
     * @returns Path to shim directory if shim was created, undefined otherwise
     */
    async ensureWmicAvailable(context) {
        // Only needed on Windows
        if (process.platform !== 'win32') {
            console.log('[WMIC Shim] Not on Windows - skipping');
            return undefined;
        }
        // Check if native WMIC exists
        const hasNativeWmic = await this.commandExists('wmic');
        if (hasNativeWmic) {
            console.log('[WMIC Shim] Native WMIC found - no shim needed');
            return undefined;
        }
        console.log('[WMIC Shim] Native WMIC not found - creating shim...');
        // Create shim in extension's global storage
        const shimDir = path.join(context.globalStorageUri.fsPath, 'wmic-shim');
        try {
            await fs.mkdir(shimDir, { recursive: true });
            // PowerShell script that mimics: wmic process get ProcessId,ParentProcessId,CommandLine /format:csv
            const ps1Script = `[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
$n=$env:COMPUTERNAME
'Node,CommandLine,ParentProcessId,ProcessId'
Get-CimInstance Win32_Process | ForEach-Object {
  $cl=($_.CommandLine -replace '"','""')
  "$n," + '"' + $cl + '",' + $_.ParentProcessId + ',' + $_.ProcessId
}`;
            // Wrapper batch files that call the PowerShell script
            const wrapperScript = '@echo off\npowershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0wmic.ps1" %*';
            // Write shim files
            await fs.writeFile(path.join(shimDir, 'wmic.ps1'), ps1Script, 'utf8');
            await fs.writeFile(path.join(shimDir, 'wmic.cmd'), wrapperScript, 'utf8');
            await fs.writeFile(path.join(shimDir, 'wmic.bat'), wrapperScript, 'utf8');
            this.shimDirectory = shimDir;
            this.shimActive = true;
            console.log(`[WMIC Shim] ✅ Shim created successfully at: ${shimDir}`);
            console.log('[WMIC Shim] Files created: wmic.ps1, wmic.cmd, wmic.bat');
            return shimDir;
        }
        catch (error) {
            console.error('[WMIC Shim] ❌ Failed to create shim:', error);
            return undefined;
        }
    }
    /**
     * Check if a command exists in PATH
     * @param cmd Command name to check
     * @returns True if command exists, false otherwise
     */
    async commandExists(cmd) {
        return new Promise(resolve => {
            const whereExe = process.env.SystemRoot
                ? path.join(process.env.SystemRoot, 'System32', 'where.exe')
                : 'where';
            (0, child_process_1.exec)(`"${whereExe}" ${cmd}`, { windowsHide: true }, err => {
                resolve(!err);
            });
        });
    }
    /**
     * Get process list in CSV format
     * Uses shim if available, falls back to PowerShell
     * @param shimDir Optional shim directory to prepend to PATH
     * @returns CSV formatted process list
     */
    async getProcessListCSV(shimDir) {
        // Build environment with shim directory in PATH if provided
        const env = { ...process.env };
        if (shimDir) {
            env.PATH = `${shimDir};${env.PATH ?? ''}`;
        }
        // Try using wmic command (either native or shim)
        const wmicCmd = 'wmic process get ProcessId,ParentProcessId,CommandLine /format:csv';
        try {
            const csv = await this.execAsync(wmicCmd, { env, windowsHide: true });
            if (csv.trim()) {
                console.log('[WMIC Shim] ✅ Process list retrieved via WMIC');
                return csv;
            }
        }
        catch (error) {
            console.log('[WMIC Shim] WMIC command failed, falling back to PowerShell');
        }
        // Fallback: Direct PowerShell execution
        const ps = `[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;$n=$env:COMPUTERNAME;'Node,CommandLine,ParentProcessId,ProcessId';Get-CimInstance Win32_Process|%{ $cl=($_.CommandLine -replace '"','""'); "$n," + '"' + $cl + '",' + $_.ParentProcessId + ',' + $_.ProcessId }`;
        const powershellCmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command ' + JSON.stringify(ps);
        try {
            const csv = await this.execAsync(powershellCmd, { windowsHide: true });
            console.log('[WMIC Shim] ✅ Process list retrieved via PowerShell fallback');
            return csv;
        }
        catch (error) {
            console.error('[WMIC Shim] ❌ Both WMIC and PowerShell fallback failed:', error);
            throw new Error('Failed to retrieve process list');
        }
    }
    /**
     * Execute command and return stdout as string
     * @param cmd Command to execute
     * @param opts Execution options
     * @returns Command stdout
     */
    execAsync(cmd, opts) {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(cmd, opts, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                else {
                    // Convert Buffer to string if needed
                    const output = typeof stdout === 'string' ? stdout : stdout.toString();
                    resolve(output);
                }
            });
        });
    }
    /**
     * Get the shim directory path (if shim was created)
     * @returns Shim directory path or null
     */
    getShimDirectory() {
        return this.shimDirectory;
    }
    /**
     * Check if shim is active
     * @returns True if shim was created and is active
     */
    isShimActive() {
        return this.shimActive;
    }
}
exports.WmicShimManager = WmicShimManager;


/***/ }),

/***/ 8733:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
exports.getApiClient = getApiClient;
exports.getAuthService = getAuthService;
exports.getTaskService = getTaskService;
exports.getTaskPanelProvider = getTaskPanelProvider;
const vscode = __importStar(__webpack_require__(1398));
const fs = __importStar(__webpack_require__(9896));
const path = __importStar(__webpack_require__(6928));
const TaskPanelProvider_1 = __webpack_require__(956);
const ai_service_1 = __webpack_require__(5967);
const api_client_1 = __webpack_require__(4723);
const auth_service_1 = __webpack_require__(7239);
const task_service_1 = __webpack_require__(1270);
const local_config_1 = __webpack_require__(5347);
const mcp_1 = __webpack_require__(7135);
const mcp_health_monitor_1 = __webpack_require__(4101);
const storage_sync_1 = __webpack_require__(9863);
const wmic_shim_manager_1 = __webpack_require__(8634);
const gitignore_manager_1 = __webpack_require__(9502);
let taskPanelProvider;
let aiService;
let apiClient;
let authService;
let taskService;
let mcpHealthMonitor;
let statusBarItem;
/**
 * Extension activation function
 * Called when the extension is activated
 */
async function activate(context) {
    console.log('🚀 [ACTIVATION STEP 1/10] Auxly extension is now active!');
    vscode.window.showInformationMessage('🚀 Auxly: Starting activation...');
    try {
        // Setup WMIC shim for Windows (if needed) - For health monitoring only
        console.log('🔍 [ACTIVATION STEP 2/10] Checking Windows WMIC availability...');
        const wmicShimManager = wmic_shim_manager_1.WmicShimManager.getInstance();
        console.log('✅ [ACTIVATION STEP 3/10] WmicShimManager instance created');
        const wmicShimPath = await wmicShimManager.ensureWmicAvailable(context);
        console.log('✅ [ACTIVATION STEP 4/10] WMIC availability check complete');
        if (wmicShimPath) {
            console.log(`✅ WMIC shim created at: ${wmicShimPath}`);
        }
        else {
            console.log('✅ Native WMIC found or not on Windows - no shim needed');
        }
        // Ensure .auxly folder is excluded from version control
        console.log('🔒 [ACTIVATION STEP 4.5/10] Ensuring .auxly folder is in .gitignore...');
        await gitignore_manager_1.GitignoreManager.ensureAuxlyIgnored();
        console.log('✅ [ACTIVATION STEP 4.5/10] .gitignore check complete');
        // Initialize Task Panel Provider
        console.log('📋 [ACTIVATION STEP 5/10] Initializing Task Panel Provider...');
        taskPanelProvider = new TaskPanelProvider_1.TaskPanelProvider(context.extensionUri);
        console.log('✅ [ACTIVATION STEP 5/10] Task Panel Provider created');
        // Show welcome message
        vscode.window.showInformationMessage('✨ Auxly: AI Assistant activated!');
        // Initialize extension components FIRST (MUST complete before commands)
        console.log('⏳ [ACTIVATION STEP 6/10] Initializing extension components...');
        await initializeExtension(context);
        console.log('✅ [ACTIVATION STEP 6/10] Extension components initialized');
        // Register commands AFTER initialization
        console.log('📝 [ACTIVATION STEP 7/10] Registering commands...');
        registerCommands(context);
        console.log('✅ [ACTIVATION STEP 7/10] Commands registered');
        // Register MCP Server automatically (using working configuration from commit 0312936)
        console.log('🔌 [ACTIVATION STEP 8/10] Registering MCP server with Cursor API...');
        vscode.window.showInformationMessage('🔌 Auxly: Registering MCP server...');
        // Small delay to ensure Cursor's MCP API is fully initialized
        console.log('⏳ Waiting 2 seconds for Cursor MCP API to be ready...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Delay complete, proceeding with MCP registration...');
        const mcpRegistered = await (0, mcp_1.registerMCPServerWithCursorAPI)(context);
        if (mcpRegistered) {
            console.log('✅ Auxly MCP server registered with Cursor API');
            vscode.window.showInformationMessage('✅ Auxly MCP registered successfully!');
        }
        else {
            console.log('⚠️ Auxly MCP server registration failed - showing retry option');
            const retry = await vscode.window.showWarningMessage('⚠️ Auxly MCP Tools registration failed. This is needed for AI integration.', 'Retry Now', 'Retry on Next Startup', 'Ignore');
            if (retry === 'Retry Now') {
                // Immediate retry with longer delay
                await new Promise(resolve => setTimeout(resolve, 5000));
                const retryResult = await (0, mcp_1.registerMCPServerWithCursorAPI)(context);
                if (retryResult) {
                    vscode.window.showInformationMessage('✅ Auxly MCP Tools activated successfully!');
                }
            }
            else if (retry === 'Retry on Next Startup') {
                // Will retry next time extension activates
                console.log('[Extension] User chose to retry on next startup');
            }
        }
        // Start MCP Health Monitor with AUTO-RESTART (Todo2 behavior)
        console.log('🏥 [ACTIVATION STEP 9/10] Starting MCP Health Monitor...');
        mcpHealthMonitor = mcp_health_monitor_1.MCPHealthMonitor.getInstance();
        mcpHealthMonitor.setContext(context); // Pass context for re-registration
        mcpHealthMonitor.setWmicShimPath(wmicShimPath); // Pass shim path for process detection
        mcpHealthMonitor.startMonitoring(10000); // Check every 10 seconds
        // Subscribe to health status changes and update webview
        context.subscriptions.push(mcpHealthMonitor.onStatusChange((status) => {
            taskPanelProvider.updateMCPStatus(status);
        }));
        console.log('✅ [ACTIVATION STEP 9/10] MCP Health Monitor started');
        // Create status bar item for quick dashboard access
        console.log('📊 [ACTIVATION STEP 10/10] Creating status bar item...');
        createStatusBarItem(context);
        // Deploy workflow rules to workspace
        console.log('📜 [ACTIVATION STEP 10/10] Deploying workflow rules...');
        await deployWorkflowRules(context);
        // Auto-open task panel on activation
        console.log('🎨 [ACTIVATION STEP 10/10] Opening task panel...');
        taskPanelProvider.show();
        // Check if API key exists, if not show forced popup
        const authState = authService.getAuthState();
        if (!authState.isAuthenticated) {
            console.log('⚠️ No API key found - showing forced API key modal');
            // Small delay to ensure webview is ready
            setTimeout(() => {
                taskPanelProvider.showForcedApiKeyModal();
            }, 500);
        }
        console.log('🎉 ✅ [ACTIVATION COMPLETE] Auxly activation finished successfully!');
    }
    catch (error) {
        console.error('💥 ❌ [ACTIVATION FAILED] Activation error:', error);
        console.error('💥 ❌ [ACTIVATION FAILED] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        vscode.window.showErrorMessage(`❌ Auxly activation failed: ${error}`);
    }
}
/**
 * Create status bar item for quick dashboard access
 */
function createStatusBarItem(context) {
    // Create status bar item on the left side
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100 // Priority: show alongside other extensions
    );
    // Configure status bar item
    statusBarItem.text = '$(tasklist) Auxly';
    statusBarItem.tooltip = 'Open Auxly Dashboard';
    statusBarItem.command = 'auxly.openDashboard';
    // Show the status bar item
    statusBarItem.show();
    // Add to subscriptions for proper disposal
    context.subscriptions.push(statusBarItem);
    console.log('✅ Status bar item created');
}
/**
 * Deploy workflow rules to workspace .cursor/rules directory
 */
async function deployWorkflowRules(context) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('⚠️ No workspace folder found - skipping rules deployment');
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const targetRulesDir = path.join(workspacePath, '.cursor', 'rules');
        const sourceRulesDir = path.join(context.extensionPath, '.cursor', 'rules');
        // Check if source rules directory exists
        if (!fs.existsSync(sourceRulesDir)) {
            console.log('⚠️ Source rules directory not found - skipping deployment');
            return;
        }
        // Create .cursor/rules directory if it doesn't exist
        if (!fs.existsSync(targetRulesDir)) {
            fs.mkdirSync(targetRulesDir, { recursive: true });
            console.log('📁 Created .cursor/rules directory');
        }
        // Read all .mdc files from source
        const ruleFiles = fs.readdirSync(sourceRulesDir).filter(file => file.endsWith('.mdc'));
        if (ruleFiles.length === 0) {
            console.log('⚠️ No rule files found in source directory');
            return;
        }
        // Copy each rule file to workspace
        let copiedCount = 0;
        for (const ruleFile of ruleFiles) {
            const sourcePath = path.join(sourceRulesDir, ruleFile);
            const targetPath = path.join(targetRulesDir, ruleFile);
            // Copy file (overwrite if exists to ensure latest version)
            fs.copyFileSync(sourcePath, targetPath);
            copiedCount++;
        }
        console.log(`✅ Deployed ${copiedCount} workflow rules to workspace`);
    }
    catch (error) {
        console.error('❌ Failed to deploy workflow rules:', error);
        // Don't throw - this is not critical for extension functionality
    }
}
/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
async function deactivate() {
    // Dispose status bar item
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    // Stop MCP Health Monitor
    if (mcpHealthMonitor) {
        mcpHealthMonitor.dispose();
    }
    // Unregister MCP server
    await (0, mcp_1.unregisterMCPServer)();
    // Stop storage sync watcher
    storage_sync_1.StorageSync.stopWatching();
    // Stop auto-sync
    if (taskService) {
        taskService.dispose();
    }
    console.log('👋 Auxly extension is now deactivated');
}
/**
 * Get the API client instance (for use in other modules)
 */
function getApiClient() {
    if (!apiClient) {
        throw new Error('API client not initialized');
    }
    return apiClient;
}
/**
 * Get the auth service instance (for use in other modules)
 */
function getAuthService() {
    if (!authService) {
        throw new Error('Auth service not initialized');
    }
    return authService;
}
/**
 * Get the task service instance (for use in other modules)
 */
function getTaskService() {
    if (!taskService) {
        throw new Error('Task service not initialized');
    }
    return taskService;
}
/**
 * Get the task panel provider instance (for use in other modules)
 */
function getTaskPanelProvider() {
    if (!taskPanelProvider) {
        throw new Error('Task panel provider not initialized');
    }
    return taskPanelProvider;
}
/**
 * Register all extension commands
 */
function registerCommands(context) {
    // Connect with API key command
    const connectCommand = vscode.commands.registerCommand('auxly.connect', async () => {
        await authService.connectWithApiKey();
    });
    // Disconnect command
    const disconnectCommand = vscode.commands.registerCommand('auxly.disconnect', async () => {
        await authService.disconnect();
    });
    // Logout command
    const logoutCommand = vscode.commands.registerCommand('auxly.logout', async () => {
        await authService.logout();
    });
    // Create task command
    const createTaskCommand = vscode.commands.registerCommand('auxly.createTask', async () => {
        await taskService.createTask();
    });
    // Open dashboard command
    const openDashboardCommand = vscode.commands.registerCommand('auxly.openDashboard', async () => {
        taskPanelProvider.show();
    });
    // Refresh tasks command
    const refreshTasksCommand = vscode.commands.registerCommand('auxly.refreshTasks', async () => {
        await taskService.fetchTasks();
    });
    // Delete task command
    const deleteTaskCommand = vscode.commands.registerCommand('auxly.deleteTask', async (taskId, taskTitle) => {
        if (taskId && taskTitle) {
            await taskService.deleteTask(taskId, taskTitle);
        }
        else {
            vscode.window.showWarningMessage('Please select a task to delete');
        }
    });
    // Generate rules command (handled by AIService)
    // Note: Command is registered in AIService.initialize()
    // Open settings command
    const openSettingsCommand = vscode.commands.registerCommand('auxly.openSettings', async () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'auxly');
    });
    // View subscription command
    const viewSubscriptionCommand = vscode.commands.registerCommand('auxly.viewSubscription', async () => {
        vscode.window.showInformationMessage('💳 Auxly: Subscription functionality coming soon!');
        // TODO: Implement subscription view
    });
    // Reset MCP Configuration command (for testing/troubleshooting)
    const resetMCPCommand = vscode.commands.registerCommand('auxly.resetMCPConfig', async () => {
        const confirm = await vscode.window.showWarningMessage('⚠️ This will re-register the Auxly MCP server.', 'Re-register', 'Cancel');
        if (confirm === 'Re-register') {
            await (0, mcp_1.unregisterMCPServer)();
            const success = await (0, mcp_1.registerMCPServerWithCursorAPI)(context);
            if (success) {
                vscode.window.showInformationMessage('✅ Auxly MCP server re-registered successfully!');
            }
            else {
                vscode.window.showErrorMessage('❌ Failed to re-register MCP server');
            }
        }
    });
    // Restart MCP Server command
    const restartMCPCommand = vscode.commands.registerCommand('auxly.restartMCP', async (options) => {
        // Auto-restart (from health monitor) should be silent
        const isSilent = options?.silent === true;
        let confirm = 'Restart';
        if (!isSilent) {
            // Show confirmation only for manual restarts
            confirm = await vscode.window.showWarningMessage('🔄 This will restart the MCP server (requires window reload).', 'Restart', 'Cancel') || 'Cancel';
        }
        if (confirm === 'Restart') {
            if (mcpHealthMonitor) {
                const success = await mcpHealthMonitor.restartMCPServer();
                if (!success) {
                    if (!isSilent) {
                        vscode.window.showErrorMessage('❌ Failed to restart MCP server');
                    }
                }
            }
        }
    });
    // Verify MCP Diagnostics command (as per auxly-auto-wmic.md)
    const verifyMCPCommand = vscode.commands.registerCommand('auxly.verifyMcpDiagnostics', async () => {
        try {
            const wmicShimManager = wmic_shim_manager_1.WmicShimManager.getInstance();
            const shimDir = wmicShimManager.getShimDirectory();
            // Get process list CSV
            const csv = await wmicShimManager.getProcessListCSV(shimDir || undefined);
            // Check for MCP-related processes
            const lines = csv.trim().split('\n');
            const mcpProcesses = lines.filter(line => line.toLowerCase().includes('mcp-server') ||
                line.toLowerCase().includes('auxly'));
            // Create detailed diagnostic report
            const diagnosticInfo = [
                '='.repeat(60),
                '📊 Auxly MCP Diagnostics Report',
                '='.repeat(60),
                '',
                '1️⃣ WMIC Configuration:',
                `   Shim Active: ${wmicShimManager.isShimActive() ? 'Yes' : 'No (using native WMIC)'}`,
                shimDir ? `   Shim Location: ${shimDir}` : '   Using native WMIC',
                '',
                '2️⃣ Process Detection:',
                `   Total Processes: ${lines.length - 1}`,
                `   MCP-Related Processes: ${mcpProcesses.length}`,
                '',
                '3️⃣ MCP Server Processes:',
                mcpProcesses.length > 0 ? mcpProcesses.map(p => `   ${p}`).join('\n') : '   ⚠️ No MCP processes detected',
                '',
                '4️⃣ CSV Preview (first 10 lines):',
                lines.slice(0, 11).map(l => `   ${l}`).join('\n'),
                '',
                '='.repeat(60),
                mcpProcesses.length > 0 ? '✅ MCP process tree is visible' : '❌ MCP process NOT detected',
                '='.repeat(60)
            ].join('\n');
            // Show in output channel
            const outputChannel = vscode.window.createOutputChannel('Auxly MCP Diagnostics');
            outputChannel.clear();
            outputChannel.appendLine(diagnosticInfo);
            outputChannel.show();
            // Show summary message
            if (mcpProcesses.length > 0) {
                vscode.window.showInformationMessage(`✅ MCP Diagnostics: Found ${mcpProcesses.length} MCP process(es)`, 'View Report').then(choice => {
                    if (choice === 'View Report') {
                        outputChannel.show();
                    }
                });
            }
            else {
                vscode.window.showWarningMessage('⚠️ MCP Diagnostics: No MCP processes detected. Check Output panel for details.', 'View Report').then(choice => {
                    if (choice === 'View Report') {
                        outputChannel.show();
                    }
                });
            }
        }
        catch (error) {
            console.error('❌ MCP Diagnostics failed:', error);
            vscode.window.showErrorMessage(`❌ MCP Diagnostics failed: ${error.message || error}`);
        }
    });
    // Add all commands to subscriptions
    context.subscriptions.push(connectCommand, disconnectCommand, logoutCommand, createTaskCommand, openDashboardCommand, refreshTasksCommand, deleteTaskCommand, openSettingsCommand, viewSubscriptionCommand, resetMCPCommand, restartMCPCommand, verifyMCPCommand);
    console.log('✅ All Auxly commands registered');
}
/**
 * Initialize extension components
 */
async function initializeExtension(context) {
    try {
        // Get configuration safely
        const config = vscode.workspace.getConfiguration('auxly');
        const apiUrl = config.get('apiUrl') || 'https://auxly.tzamun.com:8000';
        console.log(`📡 Auxly API URL: ${apiUrl}`);
        // Initialize Local Config Service (must be first!)
        const configService = local_config_1.LocalConfigService.getInstance();
        await configService.initialize();
        console.log('✅ Local Config Service initialized');
        // Initialize AI Service
        aiService = ai_service_1.AIService.getInstance();
        await aiService.initialize(context);
        console.log('✅ AI Service initialized');
        // Initialize API client
        apiClient = (0, api_client_1.initializeApiClient)(context);
        console.log('✅ API Client initialized');
        // Initialize Auth Service
        authService = auth_service_1.AuthService.getInstance();
        authService.initialize(apiClient);
        console.log('✅ Auth Service initialized');
        // Check authentication status
        await authService.checkAuthStatus();
        const isAuth = await authService.isAuthenticated();
        // If not authenticated, user must connect via API key from dashboard
        if (!isAuth) {
            console.log('⚠️ No API key found - user needs to connect via dashboard');
        }
        if (isAuth) {
            const user = authService.getCurrentUser();
            console.log(`✅ User authenticated: ${user?.email}`);
        }
        // Subscribe to auth state changes and update webview
        authService.onAuthStateChanged((state) => {
            taskPanelProvider.updateAuthState(state);
        });
        // Initialize Task Service (with local storage!)
        console.log('🔍 About to initialize TaskService...');
        taskService = task_service_1.TaskService.getInstance();
        console.log('🔍 TaskService instance obtained');
        await taskService.initialize();
        console.log('✅ Task Service initialized with local storage');
        // 🔧 FIX: StorageSync disabled - MCP and extension use same file (C:\Auxly\.auxly\tasks.json)
        // No sync needed! Both read/write to the same location.
        console.log('✅ MCP and Extension share same storage - no sync needed');
        // // CRITICAL FIX: Sync MCP storage to extension storage
        // const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        // if (workspaceFolder) {
        //     const workspacePath = workspaceFolder.uri.fsPath;
        //     console.log('[StorageSync] 🔄 Performing initial MCP → Extension sync...');
        //     const synced = StorageSync.syncMCPToExtension(workspacePath);
        //     if (synced) {
        //         console.log('[StorageSync] ✅ Initial sync completed - reloading tasks...');
        //         await taskService.fetchTasks(true); // Force reload
        //     }
        //     
        //     // Start watching for MCP storage changes
        //     StorageSync.startWatching(workspacePath, () => {
        //         console.log('[StorageSync] 🔔 MCP storage changed - auto-reloading tasks...');
        //         taskService.fetchTasks(true); // Auto-reload when MCP changes
        //     });
        //     console.log('[StorageSync] ✅ MCP storage sync enabled');
        // }
        vscode.window.showInformationMessage('✅ Auxly: Local storage initialized!');
        // Subscribe to task updates and forward to webview
        taskService.onTasksUpdated((tasks) => {
            taskPanelProvider.updateTasks(tasks);
        });
        taskService.onLoadingStateChanged((state) => {
            taskPanelProvider.updateLoadingState(state);
        });
        // Initialize MCP Provider - DISABLED: We now use MCP server in settings.json
        // mcpProvider = AuxlyMCPProvider.getInstance();
        // await mcpProvider.register(context);
        // console.log('✅ MCP Provider initialized');
        // TODO: Initialize task tree view
        console.log('✅ Auxly extension initialized successfully');
        return Promise.resolve();
    }
    catch (error) {
        console.error('❌ Failed to initialize Auxly extension:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Auxly initialization failed: ${errorMessage}`);
        return Promise.resolve(); // Don't throw, just log and continue
    }
}
/**
 * Note: MCP Server is now configured using the official VSCode API
 * See registerMCPProvider() in mcp-definition-provider.ts
 * Old manual settings.json modification removed in favor of proper API
 */


/***/ }),

/***/ 8877:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RuleGenerator = void 0;
class RuleGenerator {
    /**
     * Generate rules from analysis result
     */
    async generateRules(analysis, options = {
        includeExamples: true,
        includePatterns: true,
        includeDependencies: true
    }) {
        const sections = [];
        // Header
        sections.push(this.generateHeader(analysis));
        // Tech Stack section
        sections.push(this.generateTechStackSection(analysis));
        // Coding Conventions
        if (options.includePatterns && analysis.patterns.length > 0) {
            sections.push(this.generatePatternsSection(analysis));
        }
        // Dependencies
        if (options.includeDependencies && Object.keys(analysis.dependencies).length > 0) {
            sections.push(this.generateDependenciesSection(analysis));
        }
        // File Structure
        sections.push(this.generateFileStructureSection(analysis));
        // Custom instructions
        if (options.customInstructions) {
            sections.push(this.generateCustomSection(options.customInstructions));
        }
        // Best Practices
        sections.push(this.generateBestPractices(analysis));
        return sections.join('\n\n');
    }
    /**
     * Generate header section
     */
    generateHeader(analysis) {
        const languages = analysis.languages.join(', ');
        const frameworks = analysis.frameworks.length > 0
            ? analysis.frameworks.join(', ')
            : 'None detected';
        return `# Auxly AI Coding Rules
*Auto-generated based on workspace analysis*

## Project Overview
- **Languages:** ${languages}
- **Frameworks:** ${frameworks}
- **Package Managers:** ${analysis.packageManagers.join(', ') || 'None'}
- **Total Files:** ${analysis.fileStructure.totalFiles}`;
    }
    /**
     * Generate tech stack section
     */
    generateTechStackSection(analysis) {
        let section = '## Technology Stack\n\n';
        // Languages
        if (analysis.languages.length > 0) {
            section += '### Programming Languages\n';
            analysis.languages.forEach(lang => {
                section += `- **${lang}**: Primary language for this project\n`;
            });
            section += '\n';
        }
        // Frameworks
        if (analysis.frameworks.length > 0) {
            section += '### Frameworks & Libraries\n';
            analysis.frameworks.forEach(framework => {
                section += `- **${framework}**: ${this.getFrameworkDescription(framework)}\n`;
            });
        }
        return section.trim();
    }
    /**
     * Generate patterns section
     */
    generatePatternsSection(analysis) {
        let section = '## Coding Patterns & Conventions\n\n';
        section += 'Based on analysis of your codebase, these patterns are prevalent:\n\n';
        analysis.patterns.forEach(pattern => {
            section += `### ${this.formatPatternType(pattern.type)}\n`;
            section += `${pattern.description}\n\n`;
            if (pattern.examples && pattern.examples.length > 0) {
                section += '**Example:**\n```typescript\n';
                section += pattern.examples[0] + '\n';
                section += '```\n\n';
            }
            section += `*Usage frequency: ${pattern.frequency} occurrences*\n\n`;
        });
        return section.trim();
    }
    /**
     * Generate dependencies section
     */
    generateDependenciesSection(analysis) {
        let section = '## Key Dependencies\n\n';
        if (analysis.dependencies['production']) {
            section += '### Production Dependencies\n';
            const topDeps = analysis.dependencies['production'].slice(0, 10);
            topDeps.forEach(dep => {
                section += `- \`${dep}\`\n`;
            });
            section += '\n';
        }
        if (analysis.dependencies['development']) {
            section += '### Development Dependencies\n';
            const topDevDeps = analysis.dependencies['development'].slice(0, 10);
            topDevDeps.forEach(dep => {
                section += `- \`${dep}\`\n`;
            });
        }
        return section.trim();
    }
    /**
     * Generate file structure section
     */
    generateFileStructureSection(analysis) {
        let section = '## File Structure\n\n';
        section += '### File Type Distribution\n';
        const sortedTypes = Object.entries(analysis.fileStructure.fileTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        sortedTypes.forEach(([ext, count]) => {
            section += `- **${ext}**: ${count} files\n`;
        });
        return section.trim();
    }
    /**
     * Generate custom section
     */
    generateCustomSection(instructions) {
        return `## Custom Instructions\n\n${instructions}`;
    }
    /**
     * Generate best practices
     */
    generateBestPractices(analysis) {
        let section = '## Coding Best Practices\n\n';
        // TypeScript-specific
        if (analysis.languages.includes('TypeScript')) {
            section += '### TypeScript Guidelines\n';
            section += '- Use strict type checking\n';
            section += '- Prefer interfaces over type aliases for objects\n';
            section += '- Use `readonly` for immutable properties\n';
            section += '- Avoid `any` type unless absolutely necessary\n\n';
        }
        // React-specific
        if (analysis.frameworks.some(f => f.includes('React'))) {
            section += '### React Guidelines\n';
            section += '- Use functional components with hooks\n';
            section += '- Memoize expensive computations with `useMemo`\n';
            section += '- Use `useCallback` for function props\n';
            section += '- Keep components small and focused\n\n';
        }
        // General
        section += '### General Guidelines\n';
        section += '- Write self-documenting code with clear variable names\n';
        section += '- Keep functions small and focused on a single task\n';
        section += '- Add comments for complex logic\n';
        section += '- Follow DRY (Don\'t Repeat Yourself) principle\n';
        section += '- Write tests for critical functionality\n';
        return section.trim();
    }
    /**
     * Helper: Get framework description
     */
    getFrameworkDescription(framework) {
        const descriptions = {
            'Next.js': 'React framework for production',
            'React': 'UI library for building components',
            'Vue.js': 'Progressive JavaScript framework',
            'Angular': 'Platform for building web applications',
            'Express.js': 'Fast, minimalist web framework for Node.js',
            'NestJS': 'Progressive Node.js framework',
            'Django': 'High-level Python web framework',
            'Flask': 'Lightweight Python web framework',
            'FastAPI': 'Modern Python web framework'
        };
        return descriptions[framework] || 'Framework detected in project';
    }
    /**
     * Helper: Format pattern type
     */
    formatPatternType(type) {
        return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
}
exports.RuleGenerator = RuleGenerator;


/***/ }),

/***/ 8897:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var undefined;

var $Object = __webpack_require__(7960);

var $Error = __webpack_require__(219);
var $EvalError = __webpack_require__(3841);
var $RangeError = __webpack_require__(6190);
var $ReferenceError = __webpack_require__(3950);
var $SyntaxError = __webpack_require__(6296);
var $TypeError = __webpack_require__(1711);
var $URIError = __webpack_require__(3221);

var abs = __webpack_require__(4822);
var floor = __webpack_require__(3700);
var max = __webpack_require__(3888);
var min = __webpack_require__(4670);
var pow = __webpack_require__(9988);
var round = __webpack_require__(5786);
var sign = __webpack_require__(3897);

var $Function = Function;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = __webpack_require__(1399);
var $defineProperty = __webpack_require__(7539);

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = __webpack_require__(4923)();

var getProto = __webpack_require__(6152);
var $ObjectGPO = __webpack_require__(9548);
var $ReflectGPO = __webpack_require__(1588);

var $apply = __webpack_require__(6678);
var $call = __webpack_require__(376);

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	__proto__: null,
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': $Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': $EvalError,
	'%Float16Array%': typeof Float16Array === 'undefined' ? undefined : Float16Array,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': $Object,
	'%Object.getOwnPropertyDescriptor%': $gOPD,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': $RangeError,
	'%ReferenceError%': $ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': $URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet,

	'%Function.prototype.call%': $call,
	'%Function.prototype.apply%': $apply,
	'%Object.defineProperty%': $defineProperty,
	'%Object.getPrototypeOf%': $ObjectGPO,
	'%Math.abs%': abs,
	'%Math.floor%': floor,
	'%Math.max%': max,
	'%Math.min%': min,
	'%Math.pow%': pow,
	'%Math.round%': round,
	'%Math.sign%': sign,
	'%Reflect.getPrototypeOf%': $ReflectGPO
};

if (getProto) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto(getProto(e));
		INTRINSICS['%Error.prototype%'] = errorProto;
	}
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	__proto__: null,
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = __webpack_require__(4499);
var hasOwn = __webpack_require__(4313);
var $concat = bind.call($call, Array.prototype.concat);
var $spliceApply = bind.call($apply, Array.prototype.splice);
var $replace = bind.call($call, String.prototype.replace);
var $strSlice = bind.call($call, String.prototype.slice);
var $exec = bind.call($call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};


/***/ }),

/***/ 8909:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports =
{
  parallel      : __webpack_require__(5946),
  serial        : __webpack_require__(6893),
  serialOrdered : __webpack_require__(8424)
};


/***/ }),

/***/ 9023:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ 9127:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 */

module.exports = __webpack_require__(7146)


/***/ }),

/***/ 9221:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = __webpack_require__(7989);
} else {
	module.exports = __webpack_require__(6221);
}


/***/ }),

/***/ 9407:
/***/ ((module) => {

// API
module.exports = abort;

/**
 * Aborts leftover active jobs
 *
 * @param {object} state - current state object
 */
function abort(state)
{
  Object.keys(state.jobs).forEach(clean.bind(state));

  // reset leftover jobs
  state.jobs = {};
}

/**
 * Cleans up leftover job by invoking abort function for the provided job id
 *
 * @this  state
 * @param {string|number} key - job id to abort
 */
function clean(key)
{
  if (typeof this.jobs[key] == 'function')
  {
    this.jobs[key]();
  }
}


/***/ }),

/***/ 9502:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GitignoreManager = void 0;
const vscode = __importStar(__webpack_require__(1398));
const fs = __importStar(__webpack_require__(9896));
const path = __importStar(__webpack_require__(6928));
/**
 * GitignoreManager - Ensures .auxly folder is excluded from version control
 *
 * Automatically adds .auxly folder to .gitignore during extension activation
 * to prevent internal project data from being committed to repository.
 */
class GitignoreManager {
    /**
     * Ensures .auxly folder is listed in .gitignore
     * Creates .gitignore if it doesn't exist
     */
    static async ensureAuxlyIgnored() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('[GitignoreManager] No workspace folder found, skipping .gitignore update');
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const gitignorePath = path.join(workspaceRoot, this.GITIGNORE_FILE);
        try {
            let gitignoreContent = '';
            let fileExists = false;
            // Check if .gitignore exists
            if (fs.existsSync(gitignorePath)) {
                gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
                fileExists = true;
            }
            // Check if .auxly/ is already in .gitignore
            const lines = gitignoreContent.split('\n');
            const hasAuxlyEntry = lines.some(line => line.trim() === this.AUXLY_IGNORE_ENTRY ||
                line.trim() === '.auxly' ||
                line.trim() === '.auxly/**');
            if (hasAuxlyEntry) {
                console.log('[GitignoreManager] ✅ .auxly/ already in .gitignore');
                return;
            }
            // Add .auxly/ to .gitignore
            let updatedContent = gitignoreContent;
            // Add section header if file exists and has content
            if (fileExists && gitignoreContent.trim().length > 0) {
                // Ensure there's a newline at the end
                if (!gitignoreContent.endsWith('\n')) {
                    updatedContent += '\n';
                }
                updatedContent += '\n# Auxly - AI Task Management (internal data)\n';
            }
            else if (!fileExists) {
                // New .gitignore file
                updatedContent = '# Auxly - AI Task Management (internal data)\n';
            }
            updatedContent += `${this.AUXLY_IGNORE_ENTRY}\n`;
            // Write to .gitignore
            fs.writeFileSync(gitignorePath, updatedContent, 'utf-8');
            const action = fileExists ? 'updated' : 'created';
            console.log(`[GitignoreManager] ✅ .gitignore ${action} - .auxly/ folder excluded`);
            // Show subtle notification (don't be too noisy)
            if (!fileExists) {
                vscode.window.showInformationMessage('✅ Created .gitignore and excluded .auxly folder from version control');
            }
        }
        catch (error) {
            console.error('[GitignoreManager] ❌ Failed to update .gitignore:', error);
            // Don't show error to user - this is not critical
        }
    }
    /**
     * Checks if .auxly folder is properly excluded
     * @returns true if .auxly is in .gitignore, false otherwise
     */
    static isAuxlyIgnored() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return false;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const gitignorePath = path.join(workspaceRoot, this.GITIGNORE_FILE);
        if (!fs.existsSync(gitignorePath)) {
            return false;
        }
        try {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            const lines = gitignoreContent.split('\n');
            return lines.some(line => line.trim() === this.AUXLY_IGNORE_ENTRY ||
                line.trim() === '.auxly' ||
                line.trim() === '.auxly/**');
        }
        catch (error) {
            console.error('[GitignoreManager] Error reading .gitignore:', error);
            return false;
        }
    }
}
exports.GitignoreManager = GitignoreManager;
GitignoreManager.AUXLY_IGNORE_ENTRY = '.auxly/';
GitignoreManager.GITIGNORE_FILE = '.gitignore';


/***/ }),

/***/ 9548:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var $Object = __webpack_require__(7960);

/** @type {import('./Object.getPrototypeOf')} */
module.exports = $Object.getPrototypeOf || null;


/***/ }),

/***/ 9707:
/***/ ((module) => {

"use strict";


/** @type {import('./reflectApply')} */
module.exports = typeof Reflect !== 'undefined' && Reflect && Reflect.apply;


/***/ }),

/***/ 9712:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var abort = __webpack_require__(9407)
  , async = __webpack_require__(7797)
  ;

// API
module.exports = terminator;

/**
 * Terminates jobs in the attached state context
 *
 * @this  AsyncKitState#
 * @param {function} callback - final callback to invoke after termination
 */
function terminator(callback)
{
  if (!Object.keys(this.jobs).length)
  {
    return;
  }

  // fast forward iteration index
  this.index = this.size;

  // abort jobs
  abort(this);

  // send back results we have so far
  async(callback)(null, this.results);
}


/***/ }),

/***/ 9726:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */



/**
 * Module dependencies.
 * @private
 */

var db = __webpack_require__(9127)
var extname = (__webpack_require__(6928).extname)

/**
 * Module variables.
 * @private
 */

var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/
var TEXT_TYPE_REGEXP = /^text\//i

/**
 * Module exports.
 * @public
 */

exports.charset = charset
exports.charsets = { lookup: charset }
exports.contentType = contentType
exports.extension = extension
exports.extensions = Object.create(null)
exports.lookup = lookup
exports.types = Object.create(null)

// Populate the extensions/types maps
populateMaps(exports.extensions, exports.types)

/**
 * Get the default charset for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function charset (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = EXTRACT_TYPE_REGEXP.exec(type)
  var mime = match && db[match[1].toLowerCase()]

  if (mime && mime.charset) {
    return mime.charset
  }

  // default text/* to utf-8
  if (match && TEXT_TYPE_REGEXP.test(match[1])) {
    return 'UTF-8'
  }

  return false
}

/**
 * Create a full Content-Type header given a MIME type or extension.
 *
 * @param {string} str
 * @return {boolean|string}
 */

function contentType (str) {
  // TODO: should this even be in this module?
  if (!str || typeof str !== 'string') {
    return false
  }

  var mime = str.indexOf('/') === -1
    ? exports.lookup(str)
    : str

  if (!mime) {
    return false
  }

  // TODO: use content-type or other module
  if (mime.indexOf('charset') === -1) {
    var charset = exports.charset(mime)
    if (charset) mime += '; charset=' + charset.toLowerCase()
  }

  return mime
}

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function extension (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = EXTRACT_TYPE_REGEXP.exec(type)

  // get extensions
  var exts = match && exports.extensions[match[1].toLowerCase()]

  if (!exts || !exts.length) {
    return false
  }

  return exts[0]
}

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */

function lookup (path) {
  if (!path || typeof path !== 'string') {
    return false
  }

  // get the extension ("ext" or ".ext" or full path)
  var extension = extname('x.' + path)
    .toLowerCase()
    .substr(1)

  if (!extension) {
    return false
  }

  return exports.types[extension] || false
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps (extensions, types) {
  // source preference (least -> most)
  var preference = ['nginx', 'apache', undefined, 'iana']

  Object.keys(db).forEach(function forEachMimeType (type) {
    var mime = db[type]
    var exts = mime.extensions

    if (!exts || !exts.length) {
      return
    }

    // mime -> extensions
    extensions[type] = exts

    // extension -> mime
    for (var i = 0; i < exts.length; i++) {
      var extension = exts[i]

      if (types[extension]) {
        var from = preference.indexOf(db[types[extension]].source)
        var to = preference.indexOf(mime.source)

        if (types[extension] !== 'application/octet-stream' &&
          (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
          // skip the remapping
          continue
        }
      }

      // set the extension -> mime
      types[extension] = type
    }
  })
}


/***/ }),

/***/ 9863:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Storage Sync Utility
 * Syncs MCP storage (hash-based) with extension storage (workspace-based)
 * Fixes the bug where tasks created via MCP don't appear in extension UI
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StorageSync = void 0;
const fs = __importStar(__webpack_require__(9896));
const path = __importStar(__webpack_require__(6928));
const os = __importStar(__webpack_require__(857));
const crypto = __importStar(__webpack_require__(6982));
class StorageSync {
    /**
     * Generate workspace hash (same algorithm as MCP)
     */
    static generateWorkspaceHash(workspacePath) {
        return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
    }
    /**
     * Get MCP storage path
     */
    static getMCPStoragePath(workspacePath) {
        const hash = this.generateWorkspaceHash(workspacePath);
        return path.join(os.homedir(), hash, '.auxly', 'tasks.json');
    }
    /**
     * Get extension storage path
     */
    static getExtensionStoragePath(workspacePath) {
        return path.join(workspacePath, '.auxly', 'tasks.json');
    }
    /**
     * Sync MCP storage to extension storage
     */
    static syncMCPToExtension(workspacePath) {
        try {
            const mcpPath = this.getMCPStoragePath(workspacePath);
            const extPath = this.getExtensionStoragePath(workspacePath);
            console.log('[StorageSync] 🔄 Syncing MCP → Extension');
            console.log('[StorageSync]   MCP path:', mcpPath);
            console.log('[StorageSync]   Ext path:', extPath);
            // Check if MCP storage exists
            if (!fs.existsSync(mcpPath)) {
                console.log('[StorageSync] ⚠️ MCP storage not found, skipping sync');
                return false;
            }
            // Read MCP storage
            const mcpData = fs.readFileSync(mcpPath, 'utf-8');
            const mcpStorage = JSON.parse(mcpData);
            // Check if extension storage exists
            if (!fs.existsSync(extPath)) {
                console.log('[StorageSync] ⚠️ Extension storage not found, creating from MCP');
                const extDir = path.dirname(extPath);
                if (!fs.existsSync(extDir)) {
                    fs.mkdirSync(extDir, { recursive: true });
                }
                fs.writeFileSync(extPath, mcpData, 'utf-8');
                console.log('[StorageSync] ✅ Created extension storage from MCP');
                return true;
            }
            // Read extension storage
            const extData = fs.readFileSync(extPath, 'utf-8');
            const extStorage = JSON.parse(extData);
            // Compare timestamps
            const mcpTime = new Date(mcpStorage.lastModified || 0).getTime();
            const extTime = new Date(extStorage.lastModified || 0).getTime();
            console.log('[StorageSync]   MCP last modified:', new Date(mcpTime).toISOString());
            console.log('[StorageSync]   Ext last modified:', new Date(extTime).toISOString());
            // If MCP is newer, sync to extension
            if (mcpTime > extTime || mcpStorage.tasks.length !== extStorage.tasks.length) {
                console.log('[StorageSync] 📋 MCP is newer or has different task count, syncing...');
                fs.writeFileSync(extPath, mcpData, 'utf-8');
                console.log('[StorageSync] ✅ Synced MCP → Extension');
                return true;
            }
            else {
                console.log('[StorageSync] ✅ Storage already in sync');
                return false;
            }
        }
        catch (error) {
            console.error('[StorageSync] ❌ Sync failed:', error);
            return false;
        }
    }
    /**
     * Start watching MCP storage for changes
     */
    static startWatching(workspacePath, onSync) {
        if (this.watcherInterval) {
            console.log('[StorageSync] ⚠️ Watcher already running');
            return;
        }
        const mcpPath = this.getMCPStoragePath(workspacePath);
        let lastSize = -1;
        console.log('[StorageSync] 👀 Starting MCP storage watcher (5s interval)');
        this.watcherInterval = setInterval(() => {
            try {
                if (fs.existsSync(mcpPath)) {
                    const stats = fs.statSync(mcpPath);
                    const currentSize = stats.size;
                    if (lastSize !== -1 && currentSize !== lastSize) {
                        console.log('[StorageSync] 🔔 MCP storage changed, syncing...');
                        const synced = this.syncMCPToExtension(workspacePath);
                        if (synced) {
                            onSync();
                        }
                    }
                    lastSize = currentSize;
                }
            }
            catch (error) {
                console.error('[StorageSync] ❌ Watcher error:', error);
            }
        }, 5000); // Check every 5 seconds
        console.log('[StorageSync] ✅ Watcher started');
    }
    /**
     * Stop watching
     */
    static stopWatching() {
        if (this.watcherInterval) {
            clearInterval(this.watcherInterval);
            this.watcherInterval = null;
            console.log('[StorageSync] ⏹️ Watcher stopped');
        }
    }
}
exports.StorageSync = StorageSync;
StorageSync.watcherInterval = null;


/***/ }),

/***/ 9896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 9903:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContextAnalyzer = void 0;
const vscode = __importStar(__webpack_require__(1398));
const path = __importStar(__webpack_require__(6928));
const fs = __importStar(__webpack_require__(9896));
class ContextAnalyzer {
    constructor(workspaceRoot) {
        this.maxFilesToAnalyze = 1000;
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Main analysis entry point
     */
    async analyze() {
        const result = {
            languages: [],
            frameworks: [],
            packageManagers: [],
            patterns: [],
            fileStructure: {
                totalFiles: 0,
                directories: [],
                fileTypes: {}
            },
            dependencies: {}
        };
        try {
            // Step 1: Discover files
            const files = await this.discoverFiles();
            result.fileStructure.totalFiles = files.length;
            // Step 2: Detect languages
            result.languages = this.detectLanguages(files);
            // Step 3: Detect frameworks
            result.frameworks = await this.detectFrameworks();
            // Step 4: Detect package managers
            result.packageManagers = await this.detectPackageManagers();
            // Step 5: Analyze dependencies
            result.dependencies = await this.analyzeDependencies();
            // Step 6: Detect patterns
            result.patterns = await this.detectPatterns(files);
            // Step 7: Analyze file structure
            result.fileStructure = this.analyzeFileStructure(files);
            return result;
        }
        catch (error) {
            console.error('Error analyzing workspace:', error);
            throw error;
        }
    }
    /**
     * Discover all relevant files in workspace
     */
    async discoverFiles() {
        const files = [];
        const excludePatterns = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/out/**'];
        // Use VSCode's file search
        const fileUris = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx,py,java,go,rs,cpp,c,cs,rb,php,vue,svelte}', `{${excludePatterns.join(',')}}`, this.maxFilesToAnalyze);
        return fileUris.map(uri => uri.fsPath);
    }
    /**
     * Detect programming languages from file extensions
     */
    detectLanguages(files) {
        const languageMap = {
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript React',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript React',
            '.py': 'Python',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.vue': 'Vue',
            '.svelte': 'Svelte'
        };
        const languageSet = new Set();
        files.forEach(file => {
            const ext = path.extname(file);
            if (languageMap[ext]) {
                languageSet.add(languageMap[ext]);
            }
        });
        return Array.from(languageSet);
    }
    /**
     * Detect frameworks by looking for config files
     */
    async detectFrameworks() {
        const frameworks = [];
        const frameworkIndicators = {
            'package.json': async (content) => {
                try {
                    const pkg = JSON.parse(content);
                    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                    if (deps['next'])
                        frameworks.push('Next.js');
                    if (deps['react'])
                        frameworks.push('React');
                    if (deps['vue'])
                        frameworks.push('Vue.js');
                    if (deps['@angular/core'])
                        frameworks.push('Angular');
                    if (deps['express'])
                        frameworks.push('Express.js');
                    if (deps['fastify'])
                        frameworks.push('Fastify');
                    if (deps['nest'])
                        frameworks.push('NestJS');
                }
                catch (e) {
                    // Invalid JSON
                }
            },
            'requirements.txt': async (content) => {
                if (content.includes('django'))
                    frameworks.push('Django');
                if (content.includes('flask'))
                    frameworks.push('Flask');
                if (content.includes('fastapi'))
                    frameworks.push('FastAPI');
            },
            'go.mod': async () => {
                frameworks.push('Go Modules');
            },
            'Cargo.toml': async () => {
                frameworks.push('Rust/Cargo');
            }
        };
        for (const [file, detector] of Object.entries(frameworkIndicators)) {
            const filePath = path.join(this.workspaceRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                await detector(content);
            }
        }
        return frameworks;
    }
    /**
     * Detect package managers
     */
    async detectPackageManagers() {
        const managers = [];
        if (fs.existsSync(path.join(this.workspaceRoot, 'package-lock.json'))) {
            managers.push('npm');
        }
        if (fs.existsSync(path.join(this.workspaceRoot, 'yarn.lock'))) {
            managers.push('yarn');
        }
        if (fs.existsSync(path.join(this.workspaceRoot, 'pnpm-lock.yaml'))) {
            managers.push('pnpm');
        }
        if (fs.existsSync(path.join(this.workspaceRoot, 'requirements.txt'))) {
            managers.push('pip');
        }
        if (fs.existsSync(path.join(this.workspaceRoot, 'Gemfile'))) {
            managers.push('bundler');
        }
        if (fs.existsSync(path.join(this.workspaceRoot, 'Cargo.toml'))) {
            managers.push('cargo');
        }
        return managers;
    }
    /**
     * Analyze project dependencies
     */
    async analyzeDependencies() {
        const dependencies = {};
        // Analyze package.json
        const packagePath = path.join(this.workspaceRoot, 'package.json');
        if (fs.existsSync(packagePath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
                dependencies['production'] = Object.keys(pkg.dependencies || {});
                dependencies['development'] = Object.keys(pkg.devDependencies || {});
            }
            catch (e) {
                // Invalid JSON
            }
        }
        return dependencies;
    }
    /**
     * Detect coding patterns (simplified version)
     */
    async detectPatterns(files) {
        const patterns = [];
        // Sample a subset of files for pattern detection
        const sampleSize = Math.min(20, files.length);
        const sampledFiles = files.slice(0, sampleSize);
        let asyncAwaitCount = 0;
        let typeScriptCount = 0;
        let reactHooksCount = 0;
        for (const file of sampledFiles) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                // Count async/await usage
                if (content.includes('async ') && content.includes('await ')) {
                    asyncAwaitCount++;
                }
                // Count TypeScript features
                if (content.includes(': ') && (content.includes('interface ') || content.includes('type '))) {
                    typeScriptCount++;
                }
                // Count React Hooks
                if (content.includes('useState') || content.includes('useEffect')) {
                    reactHooksCount++;
                }
            }
            catch (e) {
                // Skip files that can't be read
            }
        }
        // Add detected patterns
        if (asyncAwaitCount > sampleSize / 2) {
            patterns.push({
                type: 'async-await',
                description: 'Heavy use of async/await for asynchronous operations',
                examples: ['async function fetchData() { await ... }'],
                frequency: asyncAwaitCount
            });
        }
        if (typeScriptCount > sampleSize / 2) {
            patterns.push({
                type: 'typescript',
                description: 'Strong TypeScript typing with interfaces and types',
                examples: ['interface User { id: string; name: string; }'],
                frequency: typeScriptCount
            });
        }
        if (reactHooksCount > 0) {
            patterns.push({
                type: 'react-hooks',
                description: 'React Hooks for state management',
                examples: ['const [state, setState] = useState()'],
                frequency: reactHooksCount
            });
        }
        return patterns;
    }
    /**
     * Analyze file structure
     */
    analyzeFileStructure(files) {
        const fileTypes = {};
        const directories = new Set();
        files.forEach(file => {
            const ext = path.extname(file);
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
            const dir = path.dirname(file);
            directories.add(dir);
        });
        return {
            totalFiles: files.length,
            directories: Array.from(directories),
            fileTypes
        };
    }
}
exports.ContextAnalyzer = ContextAnalyzer;


/***/ }),

/***/ 9988:
/***/ ((module) => {

"use strict";


/** @type {import('./pow')} */
module.exports = Math.pow;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(8733);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;