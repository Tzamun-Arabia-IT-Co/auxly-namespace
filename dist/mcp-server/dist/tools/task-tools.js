export const taskTools = [
    {
        name: 'auxly_create_task',
        description: 'Create a new task in Auxly with title, description, priority, category, and tags',
        inputSchema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Task title (required)'
                },
                description: {
                    type: 'string',
                    description: 'Detailed task description with acceptance criteria'
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                    description: 'Task priority level',
                    default: 'medium'
                },
                category: {
                    type: 'string',
                    enum: ['feature', 'bugfix', 'refactoring', 'integration', 'ui', 'research', 'documentation', 'testing', 'planning', 'review', 'question'],
                    description: 'Task category: CODE types (feature/bugfix/refactoring/integration/ui) require file changes. NON-CODE types (research/documentation/testing/planning/review/question) do not require file changes.'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tags for categorization'
                }
            },
            required: ['title']
        }
    },
    {
        name: 'auxly_list_tasks',
        description: 'List all tasks with optional filtering by status, priority, or tags',
        inputSchema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['todo', 'in_progress', 'review', 'done'],
                    description: 'Filter by task status'
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                    description: 'Filter by priority'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by tags'
                }
            }
        }
    },
    {
        name: 'auxly_get_task',
        description: 'Get detailed information about a specific task by ID',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'The ID of the task to retrieve'
                }
            },
            required: ['taskId']
        }
    },
    {
        name: 'auxly_update_task',
        description: 'Update an existing task (title, description, status, priority, category, tags)',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'The ID of the task to update'
                },
                title: {
                    type: 'string',
                    description: 'New task title'
                },
                description: {
                    type: 'string',
                    description: 'New task description'
                },
                status: {
                    type: 'string',
                    enum: ['todo', 'in_progress', 'review', 'done'],
                    description: 'New task status'
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                    description: 'New priority level'
                },
                category: {
                    type: 'string',
                    enum: ['feature', 'bugfix', 'refactoring', 'integration', 'ui', 'research', 'documentation', 'testing', 'planning', 'review', 'question'],
                    description: 'Task category: CODE types (feature/bugfix/refactoring/integration/ui) require file changes. NON-CODE types (research/documentation/testing/planning/review/question) do not.'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New tags array'
                },
                aiWorkingOn: {
                    type: 'boolean',
                    description: 'Set to true when AI starts working on task, false when done'
                },
                availabilityStatus: {
                    type: 'string',
                    enum: ['available', 'hold'],
                    description: "Task availability status: 'available' (AI can work on it) or 'hold' (AI must skip it)"
                }
            },
            required: ['taskId']
        }
    },
    {
        name: 'auxly_delete_task',
        description: 'Delete a task by ID',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'The ID of the task to delete'
                }
            },
            required: ['taskId']
        }
    },
    {
        name: 'auxly_ask_question',
        description: 'Ask the user a question with multiple choice options or free text input. Shows a popup notification with sound alert.',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Associated task ID'
                },
                questionText: {
                    type: 'string',
                    description: 'The question to ask the user'
                },
                category: {
                    type: 'string',
                    enum: ['TECHNICAL DECISION', 'ARCHITECTURE', 'UX', 'CLARIFICATION', 'APPROVAL REQUEST'],
                    description: 'Question category',
                    default: 'CLARIFICATION'
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                    description: 'Question priority (affects notification)',
                    default: 'medium'
                },
                context: {
                    type: 'string',
                    description: 'Additional context for the question'
                },
                options: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            label: { type: 'string' },
                            recommended: { type: 'boolean' }
                        }
                    },
                    description: 'Multiple choice options'
                },
                allowCustomAnswer: {
                    type: 'boolean',
                    description: 'Allow user to provide custom text answer',
                    default: false
                }
            },
            required: ['taskId', 'questionText']
        }
    },
    {
        name: 'auxly_add_comment',
        description: 'Add a comment to a task (general note, technical research, business research, or manual setup instruction)',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Task ID to add comment to'
                },
                content: {
                    type: 'string',
                    description: 'Comment content'
                },
                type: {
                    type: 'string',
                    enum: ['comment', 'technical_research', 'business_research', 'manualsetup'],
                    description: 'Comment type',
                    default: 'comment'
                },
                author: {
                    type: 'string',
                    description: 'Comment author (defaults to AI)',
                    default: 'ai'
                }
            },
            required: ['taskId', 'content']
        }
    },
    {
        name: 'auxly_add_research',
        description: 'Add dual research (technical AND business) to a task - MANDATORY before implementation',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Task ID to add research to'
                },
                technicalResearch: {
                    type: 'object',
                    properties: {
                        summary: { type: 'string', description: 'Technical research summary' },
                        sources: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Source URLs (must be real, verified links)'
                        },
                        findings: { type: 'string', description: 'Key technical findings' },
                        recommendations: { type: 'string', description: 'Technical recommendations' }
                    },
                    required: ['summary', 'sources', 'findings']
                },
                businessResearch: {
                    type: 'object',
                    properties: {
                        summary: { type: 'string', description: 'Business research summary' },
                        sources: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Source URLs (must be real, verified links)'
                        },
                        findings: { type: 'string', description: 'Key business findings' },
                        recommendations: { type: 'string', description: 'Business recommendations' }
                    },
                    required: ['summary', 'sources', 'findings']
                }
            },
            required: ['taskId', 'technicalResearch', 'businessResearch']
        }
    },
    {
        name: 'auxly_log_change',
        description: 'Log a file change to the task changelog (created, modified, or deleted)',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Task ID to log change to'
                },
                filePath: {
                    type: 'string',
                    description: 'Path to the file that changed'
                },
                changeType: {
                    type: 'string',
                    enum: ['created', 'modified', 'deleted'],
                    description: 'Type of change'
                },
                description: {
                    type: 'string',
                    description: 'Description of what changed and why'
                },
                linesAdded: {
                    type: 'number',
                    description: 'Number of lines added',
                    default: 0
                },
                linesDeleted: {
                    type: 'number',
                    description: 'Number of lines deleted',
                    default: 0
                }
            },
            required: ['taskId', 'filePath', 'changeType', 'description']
        }
    },
    {
        name: 'auxly_get_task_comments',
        description: 'Get all comments for a specific task',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Task ID to get comments from'
                },
                type: {
                    type: 'string',
                    enum: ['all', 'comment', 'technical_research', 'business_research', 'manualsetup'],
                    description: 'Filter by comment type (default: all)',
                    default: 'all'
                }
            },
            required: ['taskId']
        }
    },
    {
        name: 'auxly_get_task_changelog',
        description: 'Get the complete changelog (file changes) for a task',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Task ID to get changelog from'
                }
            },
            required: ['taskId']
        }
    },
    {
        name: 'auxly_get_task_questions',
        description: 'Get all questions and their answers for a task',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: {
                    type: 'string',
                    description: 'Task ID to get questions from'
                },
                includeAnswered: {
                    type: 'boolean',
                    description: 'Include already answered questions',
                    default: true
                }
            },
            required: ['taskId']
        }
    }
];
//# sourceMappingURL=task-tools.js.map