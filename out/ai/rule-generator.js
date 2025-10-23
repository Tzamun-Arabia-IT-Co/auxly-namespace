"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=rule-generator.js.map