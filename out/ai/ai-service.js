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
exports.AIService = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const context_analyzer_1 = require("./context-analyzer");
const rule_generator_1 = require("./rule-generator");
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
//# sourceMappingURL=ai-service.js.map