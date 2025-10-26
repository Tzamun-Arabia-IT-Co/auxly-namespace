import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TaskPanelProvider } from './webview/TaskPanelProvider';
import { AIService } from './ai/ai-service';
import { ApiClient, initializeApiClient } from './api/api-client';
import { AuthService } from './auth/auth-service';
import { TaskService } from './tasks/task-service';
import { LocalConfigService } from './config/local-config';
import { setupMCP, unregisterMCPServer } from './mcp';
import { MCPHealthMonitor } from './mcp/mcp-health-monitor';
import { StorageSync } from './storage/storage-sync';
import { WmicShimManager } from './utils/wmic-shim-manager';
import { GitignoreManager } from './utils/gitignore-manager';
import { detectEditor, getEditorDisplayName } from './utils/editor-detector';

let taskPanelProvider: TaskPanelProvider;
let aiService: AIService;
let apiClient: ApiClient;
let authService: AuthService;
let taskService: TaskService;
let mcpHealthMonitor: MCPHealthMonitor;
let statusBarItem: vscode.StatusBarItem;

/**
 * Auto-create editor-specific rule file in workspace root
 * This ensures AI agents automatically use Auxly MCP tools
 */
async function autoCreateEditorRules(context: vscode.ExtensionContext): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('[Auxly] No workspace folder found - skipping rule file creation');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const editor = detectEditor();
        const editorName = getEditorDisplayName(editor);

        // Determine rule file name and template based on editor
        let ruleFileName: string;
        let templateName: string;
        
        switch (editor) {
            case 'windsurf':
                // Windsurf uses .windsurfrules (markdown format)
                ruleFileName = '.windsurfrules';
                templateName = '.windsurfrules';
                break;
            case 'cursor':
            case 'pearai':
            case 'trae':
            default:
                // Cursor, PearAI, Trae, and unknown editors use .cursorrules
                ruleFileName = '.cursorrules';
                templateName = '.cursorrules';
                break;
        }
        
        const ruleFilePath = path.join(workspaceRoot, ruleFileName);

        // Check if rule file already exists
        if (fs.existsSync(ruleFilePath)) {
            console.log(`[Auxly] Rule file already exists: ${ruleFilePath}`);
            return;
        }

        // Read template from extension resources
        const templatePath = path.join(context.extensionPath, 'resources', 'templates', templateName);
        
        if (!fs.existsSync(templatePath)) {
            console.error(`[Auxly] Rule template not found at: ${templatePath}`);
            // Fallback to .cursorrules if specific template not found
            const fallbackPath = path.join(context.extensionPath, 'resources', 'templates', '.cursorrules');
            if (fs.existsSync(fallbackPath) && templateName !== '.cursorrules') {
                console.log(`[Auxly] Using .cursorrules as fallback template`);
                const fallbackContent = fs.readFileSync(fallbackPath, 'utf8');
                fs.writeFileSync(ruleFilePath, fallbackContent, 'utf8');
                console.log(`[Auxly] ✅ Created ${ruleFileName} (from fallback) in workspace root for ${editorName}`);
                
                // Don't show reload prompt here - will show single prompt at end of activation
            }
            return;
        }

        // Copy template to workspace root
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        fs.writeFileSync(ruleFilePath, templateContent, 'utf8');

        console.log(`[Auxly] ✅ Created ${ruleFileName} in workspace root for ${editorName}`);
        
        // Don't show reload prompt here - will show single prompt at end of activation

    } catch (error) {
        console.error('[Auxly] Failed to create rule file:', error);
        // Don't block extension activation if this fails
    }
}

/**
 * Extension activation function
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('🚀 [ACTIVATION STEP 1/10] Auxly extension is now active!');
    vscode.window.showInformationMessage('🚀 Auxly: Starting activation...');

    try {
        // Setup WMIC shim for Windows (if needed) - For health monitoring only
        console.log('🔍 [ACTIVATION STEP 2/10] Checking Windows WMIC availability...');
        const wmicShimManager = WmicShimManager.getInstance();
        console.log('✅ [ACTIVATION STEP 3/10] WmicShimManager instance created');
        
        const wmicShimPath = await wmicShimManager.ensureWmicAvailable(context);
        console.log('✅ [ACTIVATION STEP 4/10] WMIC availability check complete');
        
        if (wmicShimPath) {
            console.log(`✅ WMIC shim created at: ${wmicShimPath}`);
        } else {
            console.log('✅ Native WMIC found or not on Windows - no shim needed');
        }
        
        // Ensure .auxly folder is excluded from version control
        console.log('🔒 [ACTIVATION STEP 4.5/10] Ensuring .auxly folder is in .gitignore...');
        await GitignoreManager.ensureAuxlyIgnored();
        console.log('✅ [ACTIVATION STEP 4.5/10] .gitignore check complete');
        
        // Initialize Task Panel Provider
        console.log('📋 [ACTIVATION STEP 5/10] Initializing Task Panel Provider...');
        taskPanelProvider = new TaskPanelProvider(context.extensionUri);
        console.log('✅ [ACTIVATION STEP 5/10] Task Panel Provider created');

        // Show welcome message
        // vscode.window.showInformationMessage('✨ Auxly: AI Assistant activated!');

        // Initialize extension components FIRST (MUST complete before commands)
        console.log('⏳ [ACTIVATION STEP 6/10] Initializing extension components...');
        await initializeExtension(context);
        console.log('✅ [ACTIVATION STEP 6/10] Extension components initialized');

        // Register commands AFTER initialization
        console.log('📝 [ACTIVATION STEP 7/10] Registering commands...');
        registerCommands(context);
        console.log('✅ [ACTIVATION STEP 7/10] Commands registered');

        // Auto-create editor-specific rule file (.cursorrules) for AI agent integration
        console.log('📄 [ACTIVATION STEP 7.5/10] Auto-creating editor rule file...');
        await autoCreateEditorRules(context);
        console.log('✅ [ACTIVATION STEP 7.5/10] Editor rule file setup complete');

        // Register MCP Server automatically (multi-editor support)
        console.log('🔌 [ACTIVATION STEP 8/10] Setting up MCP for detected editor...');
        // vscode.window.showInformationMessage('🔌 Auxly: Configuring MCP...');
        // Small delay to ensure editor's MCP API is fully initialized
        console.log('⏳ Waiting 2 seconds for editor MCP to be ready...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Delay complete, proceeding with MCP setup...');
        
        try {
            await setupMCP(context);
            console.log('✅ Auxly MCP setup completed');
        } catch (error) {
            console.error('❌ Auxly MCP setup failed:', error);
            // Disabled: Don't show error prompt - keep only reload prompt
            // const retry = await vscode.window.showWarningMessage(...)
        }

        // Start MCP Health Monitor with AUTO-RESTART (Todo2 behavior)
        console.log('🏥 [ACTIVATION STEP 9/10] Starting MCP Health Monitor...');
        mcpHealthMonitor = MCPHealthMonitor.getInstance();
        mcpHealthMonitor.setContext(context); // Pass context for re-registration
        mcpHealthMonitor.setWmicShimPath(wmicShimPath); // Pass shim path for process detection
        mcpHealthMonitor.startMonitoring(10000); // Check every 10 seconds
        
        // Subscribe to health status changes and update webview
        context.subscriptions.push(
            mcpHealthMonitor.onStatusChange((status) => {
                taskPanelProvider.updateMCPStatus(status);
            })
        );
        console.log('✅ [ACTIVATION STEP 9/10] MCP Health Monitor started');

        // Create status bar item for quick dashboard access
        console.log('📊 [ACTIVATION STEP 10/10] Creating status bar item...');
        createStatusBarItem(context);

        // Deploy workflow rules to workspace
        console.log('📜 [ACTIVATION STEP 10/10] Deploying workflow rules...');
        await deployWorkflowRules(context);

        console.log('🎉 ✅ [ACTIVATION COMPLETE] Auxly activation finished successfully!');
        
        // AUTO-RELOAD for config-based editors (no prompt needed)
        const editor = detectEditor();
        
        // Check if this is first installation (MCP not configured yet in global state)
        const mcpConfigKey = `mcp.configured.${editor}`;
        const isConfigured = context.globalState.get(mcpConfigKey, false);
        
        // For Windsurf and other config-based editors, auto-reload on first install
        if ((editor === 'windsurf' || editor === 'pearai' || editor === 'trae') && !isConfigured) {
            console.log(`[Auxly] First install detected for ${editor} - auto-reloading...`);
            // Mark as configured
            await context.globalState.update(mcpConfigKey, true);
            
            // Don't open task panel before reload - will open after reload
            // Auto-reload after 500ms
            setTimeout(() => {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }, 500);
            return; // Exit activation - will resume after reload
        }
        
        // AFTER RELOAD: Open task panel and check API key
        console.log('🎨 Opening task panel...');
        taskPanelProvider.show();

        // Check if API key exists and show modal if not
        const authState = authService.getAuthState();
        if (!authState.isAuthenticated) {
            console.log('⚠️ No API key found - showing API key modal');
            // Show API key modal after dashboard opens
            setTimeout(() => {
                taskPanelProvider.showForcedApiKeyModal();
            }, 500);
        }
    } catch (error) {
        console.error('💥 ❌ [ACTIVATION FAILED] Activation error:', error);
        console.error('💥 ❌ [ACTIVATION FAILED] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        vscode.window.showErrorMessage(`❌ Auxly activation failed: ${error}`);
    }
}

/**
 * Create status bar item for quick dashboard access
 */
function createStatusBarItem(context: vscode.ExtensionContext) {
    // Create status bar item on the left side
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100 // Priority: show alongside other extensions
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
 * Deploy workflow rules to workspace editor-specific rules directory
 * Creates .cursor/rules for Cursor, .windsurf/rules for Windsurf, etc.
 */
async function deployWorkflowRules(context: vscode.ExtensionContext) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.log('⚠️ No workspace folder found - skipping rules deployment');
            return;
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;
        
        // Detect editor and use appropriate folder name
        const editor = detectEditor();
        const editorName = getEditorDisplayName(editor);
        let editorFolderName: string;
        
        switch (editor) {
            case 'cursor':
                editorFolderName = '.cursor';
                break;
            case 'windsurf':
                editorFolderName = '.windsurf';
                break;
            case 'pearai':
                editorFolderName = '.pearai';
                break;
            case 'trae':
                editorFolderName = '.trae';
                break;
            default:
                editorFolderName = '.cursor'; // fallback
        }
        
        const targetRulesDir = path.join(workspacePath, editorFolderName, 'rules');
        const sourceRulesDir = path.join(context.extensionPath, '.cursor', 'rules');

        // Check if source rules directory exists
        if (!fs.existsSync(sourceRulesDir)) {
            console.log('⚠️ Source rules directory not found - skipping deployment');
            return;
        }

        // Create editor-specific rules directory if it doesn't exist
        if (!fs.existsSync(targetRulesDir)) {
            fs.mkdirSync(targetRulesDir, { recursive: true });
            console.log(`📁 Created ${editorFolderName}/rules directory`);
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
            
            // For Windsurf, convert .mdc to .md extension
            let targetFileName = ruleFile;
            if (editor === 'windsurf') {
                targetFileName = ruleFile.replace('.mdc', '.md');
            }
            
            const targetPath = path.join(targetRulesDir, targetFileName);

            // Read the source file content
            let fileContent = fs.readFileSync(sourcePath, 'utf8');
            
                    // For Windsurf, replace/add correct frontmatter
                    if (editor === 'windsurf') {
                        // Extract rule name from filename
                        const ruleMatch = targetFileName.match(/(.+)\.md$/);
                        const ruleName = ruleMatch ? ruleMatch[1].replace(/-/g, ' ') : 'auxly rule';
                        
                        // Remove old frontmatter if exists
                        fileContent = fileContent.replace(/^---[\s\S]*?---\n\n/, '');
                        
                        // Add Windsurf frontmatter
                        const frontmatter = `---
trigger: always_on
description: ${ruleName}
---

`;
                        fileContent = frontmatter + fileContent;
                    }
            
            // Write file with frontmatter (overwrite if exists to ensure latest version)
            fs.writeFileSync(targetPath, fileContent, 'utf8');
            copiedCount++;
        }

        console.log(`✅ Deployed ${copiedCount} workflow rules to workspace (${editorFolderName}/rules/)`);
        
        // Don't show reload prompt here - will show single prompt at end of activation
    } catch (error) {
        console.error('❌ Failed to deploy workflow rules:', error);
        // Don't throw - this is not critical for extension functionality
    }
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export async function deactivate() {
    // Dispose status bar item
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    
    // Stop MCP Health Monitor
    if (mcpHealthMonitor) {
        mcpHealthMonitor.dispose();
    }
    
    // Unregister MCP server
    await unregisterMCPServer();
    
    // Stop storage sync watcher
    StorageSync.stopWatching();
    
    // Stop auto-sync
    if (taskService) {
        taskService.dispose();
    }
    
    console.log('👋 Auxly extension is now deactivated');
}

/**
 * Get the API client instance (for use in other modules)
 */
export function getApiClient(): ApiClient {
    if (!apiClient) {
        throw new Error('API client not initialized');
    }
    return apiClient;
}

/**
 * Get the auth service instance (for use in other modules)
 */
export function getAuthService(): AuthService {
    if (!authService) {
        throw new Error('Auth service not initialized');
    }
    return authService;
}

/**
 * Get the task service instance (for use in other modules)
 */
export function getTaskService(): TaskService {
    if (!taskService) {
        throw new Error('Task service not initialized');
    }
    return taskService;
}

/**
 * Get the task panel provider instance (for use in other modules)
 */
export function getTaskPanelProvider(): TaskPanelProvider {
    if (!taskPanelProvider) {
        throw new Error('Task panel provider not initialized');
    }
    return taskPanelProvider;
}

/**
 * Register all extension commands
 */
function registerCommands(context: vscode.ExtensionContext) {
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
    const deleteTaskCommand = vscode.commands.registerCommand('auxly.deleteTask', async (taskId?: string, taskTitle?: string) => {
        if (taskId && taskTitle) {
            await taskService.deleteTask(taskId, taskTitle);
        } else {
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
        const confirm = await vscode.window.showWarningMessage(
            '⚠️ This will re-configure the Auxly MCP server.',
            'Re-configure',
            'Cancel'
        );
        
        if (confirm === 'Re-configure') {
            await unregisterMCPServer();
            try {
                await setupMCP(context);
                vscode.window.showInformationMessage('✅ Auxly MCP server re-configured successfully!');
            } catch (error) {
                console.error('Failed to re-configure MCP:', error);
                vscode.window.showErrorMessage('❌ Failed to re-configure MCP server');
            }
        }
    });

    // Restart MCP Server command
    const restartMCPCommand = vscode.commands.registerCommand('auxly.restartMCP', async (options?: { silent?: boolean }) => {
        // Auto-restart (from health monitor) should be silent
        const isSilent = options?.silent === true;
        
        // Detect editor type
        const { detectEditor } = await import('./utils/editor-detector');
        const editor = detectEditor();
        
        let confirm = 'Restart';
        if (!isSilent) {
            // Show confirmation only for manual restarts
            confirm = await vscode.window.showWarningMessage(
                editor === 'windsurf' 
                    ? '🔄 This will restart the MCP server (auto-reconnect enabled).'
                    : '🔄 This will restart the MCP server (requires window reload).',
                'Restart',
                'Cancel'
            ) || 'Cancel';
        }
        
        if (confirm === 'Restart') {
            if (editor === 'windsurf') {
                // Windsurf-specific restart using health monitor
                const { WindsurfMCPHealthMonitor } = await import('./mcp/windsurf-mcp-health-monitor');
                const monitor = WindsurfMCPHealthMonitor.getInstance();
                const success = await monitor.manualRestart();
                
                if (success && !isSilent) {
                    vscode.window.showInformationMessage('✅ MCP server restarted successfully');
                } else if (!success && !isSilent) {
                    vscode.window.showErrorMessage('❌ Failed to restart MCP server');
                }
            } else if (mcpHealthMonitor) {
                // Cursor-specific restart using existing monitor
                const success = await mcpHealthMonitor.restartMCPServer();
                if (!success && !isSilent) {
                    vscode.window.showErrorMessage('❌ Failed to restart MCP server');
                }
            }
        }
    });

    // Verify MCP Diagnostics command (as per auxly-auto-wmic.md)
    const verifyMCPCommand = vscode.commands.registerCommand('auxly.verifyMcpDiagnostics', async () => {
        try {
            const wmicShimManager = WmicShimManager.getInstance();
            const shimDir = wmicShimManager.getShimDirectory();
            
            // Get process list CSV
            const csv = await wmicShimManager.getProcessListCSV(shimDir || undefined);
            
            // Check for MCP-related processes
            const lines = csv.trim().split('\n');
            const mcpProcesses = lines.filter(line => 
                line.toLowerCase().includes('mcp-server') || 
                line.toLowerCase().includes('auxly')
            );
            
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
                vscode.window.showInformationMessage(
                    `✅ MCP Diagnostics: Found ${mcpProcesses.length} MCP process(es)`,
                    'View Report'
                ).then(choice => {
                    if (choice === 'View Report') {
                        outputChannel.show();
                    }
                });
            } else {
                vscode.window.showWarningMessage(
                    '⚠️ MCP Diagnostics: No MCP processes detected. Check Output panel for details.',
                    'View Report'
                ).then(choice => {
                    if (choice === 'View Report') {
                        outputChannel.show();
                    }
                });
            }
            
        } catch (error: any) {
            console.error('❌ MCP Diagnostics failed:', error);
            vscode.window.showErrorMessage(`❌ MCP Diagnostics failed: ${error.message || error}`);
        }
    });

    // Add all commands to subscriptions
    context.subscriptions.push(
        connectCommand,
        disconnectCommand,
        logoutCommand,
        createTaskCommand,
        openDashboardCommand,
        refreshTasksCommand,
        deleteTaskCommand,
        openSettingsCommand,
        viewSubscriptionCommand,
        resetMCPCommand,
        restartMCPCommand,
        verifyMCPCommand
    );

    console.log('✅ All Auxly commands registered');
}

/**
 * Initialize extension components
 * REMOTE SSH FIX: Safely handles configuration access
 */
async function initializeExtension(context: vscode.ExtensionContext) {
    try {
        // Get configuration safely - REMOTE SSH FIX
        let apiUrl = 'https://auxly.tzamun.com:8000'; // Default
        try {
            const config = vscode.workspace.getConfiguration('auxly');
            if (config) {
                apiUrl = config.get<string>('apiUrl') || apiUrl;
            }
        } catch (configError) {
            console.warn('[Extension Init] Could not read configuration (remote SSH?), using default API URL:', configError);
        }
        
        console.log(`📡 Auxly API URL: ${apiUrl}`);

        // Initialize Local Config Service (must be first!)
        const configService = LocalConfigService.getInstance();
        await configService.initialize();
        console.log('✅ Local Config Service initialized');

        // Initialize AI Service
        aiService = AIService.getInstance();
        await aiService.initialize(context);
        console.log('✅ AI Service initialized');

        // Initialize API client
        apiClient = initializeApiClient(context);
        console.log('✅ API Client initialized');

        // Initialize Auth Service
        authService = AuthService.getInstance();
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
        taskService = TaskService.getInstance();
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
    } catch (error) {
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


