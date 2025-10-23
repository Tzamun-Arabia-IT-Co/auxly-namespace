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
exports.ContextAnalyzer = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
//# sourceMappingURL=context-analyzer.js.map