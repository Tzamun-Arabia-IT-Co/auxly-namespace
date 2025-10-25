import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Context Analyzer for Workspace
 * Analyzes workspace files and extracts patterns for AI rule generation
 */

export interface AnalysisResult {
    languages: string[];
    frameworks: string[];
    packageManagers: string[];
    patterns: CodePattern[];
    fileStructure: FileStructure;
    dependencies: Record<string, string[]>;
}

export interface CodePattern {
    type: string;
    description: string;
    examples: string[];
    frequency: number;
}

export interface FileStructure {
    totalFiles: number;
    directories: string[];
    fileTypes: Record<string, number>;
}

export class ContextAnalyzer {
    private workspaceRoot: string;
    private maxFilesToAnalyze = 1000;
    
    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Main analysis entry point
     */
    async analyze(): Promise<AnalysisResult> {
        const result: AnalysisResult = {
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
        } catch (error) {
            console.error('Error analyzing workspace:', error);
            throw error;
        }
    }

    /**
     * Discover all relevant files in workspace
     */
    private async discoverFiles(): Promise<string[]> {
        const files: string[] = [];
        const excludePatterns = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/out/**'];

        // Use VSCode's file search
        const fileUris = await vscode.workspace.findFiles(
            '**/*.{ts,tsx,js,jsx,py,java,go,rs,cpp,c,cs,rb,php,vue,svelte}',
            `{${excludePatterns.join(',')}}`,
            this.maxFilesToAnalyze
        );

        return fileUris.map(uri => uri.fsPath);
    }

    /**
     * Detect programming languages from file extensions
     */
    private detectLanguages(files: string[]): string[] {
        const languageMap: Record<string, string> = {
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

        const languageSet = new Set<string>();
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
    private async detectFrameworks(): Promise<string[]> {
        const frameworks: string[] = [];

        const frameworkIndicators = {
            'package.json': async (content: string) => {
                try {
                    const pkg = JSON.parse(content);
                    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                    
                    if (deps['next']) frameworks.push('Next.js');
                    if (deps['react']) frameworks.push('React');
                    if (deps['vue']) frameworks.push('Vue.js');
                    if (deps['@angular/core']) frameworks.push('Angular');
                    if (deps['express']) frameworks.push('Express.js');
                    if (deps['fastify']) frameworks.push('Fastify');
                    if (deps['nest']) frameworks.push('NestJS');
                } catch (e) {
                    // Invalid JSON
                }
            },
            'requirements.txt': async (content: string) => {
                if (content.includes('django')) frameworks.push('Django');
                if (content.includes('flask')) frameworks.push('Flask');
                if (content.includes('fastapi')) frameworks.push('FastAPI');
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
    private async detectPackageManagers(): Promise<string[]> {
        const managers: string[] = [];

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
    private async analyzeDependencies(): Promise<Record<string, string[]>> {
        const dependencies: Record<string, string[]> = {};

        // Analyze package.json
        const packagePath = path.join(this.workspaceRoot, 'package.json');
        if (fs.existsSync(packagePath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
                dependencies['production'] = Object.keys(pkg.dependencies || {});
                dependencies['development'] = Object.keys(pkg.devDependencies || {});
            } catch (e) {
                // Invalid JSON
            }
        }

        return dependencies;
    }

    /**
     * Detect coding patterns (simplified version)
     */
    private async detectPatterns(files: string[]): Promise<CodePattern[]> {
        const patterns: CodePattern[] = [];

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
            } catch (e) {
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
    private analyzeFileStructure(files: string[]): FileStructure {
        const fileTypes: Record<string, number> = {};
        const directories = new Set<string>();

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















