#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { taskTools } from './tools/task-tools.js';
import { LocalTaskStorage } from './local-storage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function log(msg) {
    console.error(`[Auxly MCP] ${new Date().toISOString()} - ${msg}`);
}
function logError(msg, error) {
    console.error(`[Auxly MCP ERROR] ${new Date().toISOString()} - ${msg}`);
    if (error) {
        console.error(error.stack || error);
    }
}
async function main() {
    let workspacePath = process.env.AUXLY_WORKSPACE_PATH || process.env.AUXLY_WORKSPACE_ID;
    if (!workspacePath || !workspacePath.trim()) {
        try {
            const configPath = path.join(__dirname, '../.mcp-config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                workspacePath = config.workspacePath;
            }
        }
        catch (error) {
        }
    }
    const server = new Server({ name: 'extension-auxly', version: '0.0.3' }, { capabilities: { tools: {} } });
    const storage = new LocalTaskStorage(workspacePath);
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        try {
            log(`📋 Listing ${taskTools.length} available tools`);
            return { tools: taskTools };
        }
        catch (error) {
            logError('Error in ListTools handler', error);
            return { tools: [] };
        }
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        log(`🔧 Tool called: ${name}`);
        try {
            switch (name) {
                case 'auxly_create_task': {
                    try {
                        const task = await storage.createTask(args);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `✅ Task created successfully!\n\nID: ${task.id}\nTitle: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}`
                                }]
                        };
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('[MCP Server] ❌ Task creation blocked:', errorMessage);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `❌ BLOCKED: ${errorMessage}`
                                }],
                            isError: true
                        };
                    }
                }
                case 'auxly_list_tasks': {
                    const tasks = await storage.listTasks(args);
                    const summary = `📋 Found ${tasks.length} tasks\n\n` +
                        tasks.map(t => `• [${t.status}] ${t.title} (${t.priority})`).join('\n');
                    return {
                        content: [{ type: 'text', text: summary }]
                    };
                }
                case 'auxly_get_task': {
                    const task = await storage.getTask(args.taskId);
                    if (!task) {
                        return { content: [{ type: 'text', text: '❌ Task not found' }] };
                    }
                    const details = `📝 Task: ${task.title}\n\nID: ${task.id}\nStatus: ${task.status}\nPriority: ${task.priority}\nDescription: ${task.description || 'None'}\nTags: ${task.tags?.join(', ') || 'None'}`;
                    return {
                        content: [{ type: 'text', text: details }]
                    };
                }
                case 'auxly_update_task': {
                    try {
                        const updated = await storage.updateTask(args.taskId, args);
                        if (!updated) {
                            return { content: [{ type: 'text', text: '❌ Task not found' }] };
                        }
                        return {
                            content: [{ type: 'text', text: `✅ Task updated successfully!\n\nID: ${updated.id}\nTitle: ${updated.title}` }]
                        };
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('[MCP Server] ❌ Task update blocked:', errorMessage);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `❌ BLOCKED: ${errorMessage}\n\n⚠️ This task is ON HOLD. You cannot work on it until the hold status is released.\n\nTo work on this task:\n1. Click the "⏸️ On Hold" button in the Auxly panel\n2. Change status to "✅ Available"\n3. Then try again`
                                }],
                            isError: true
                        };
                    }
                }
                case 'auxly_delete_task': {
                    try {
                        await storage.deleteTask(args.taskId);
                        return {
                            content: [{ type: 'text', text: '✅ Task deleted successfully' }]
                        };
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('[MCP Server] ❌ Task deletion blocked:', errorMessage);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `❌ BLOCKED: ${errorMessage}`
                                }],
                            isError: true
                        };
                    }
                }
                case 'auxly_add_comment': {
                    const { taskId, content, type, author } = args;
                    const comment = await storage.addComment(taskId, {
                        type: type || 'comment',
                        content,
                        author: author || 'ai',
                        authorName: author === 'ai' ? 'AI Assistant' : author,
                        createdAt: new Date().toISOString()
                    });
                    return {
                        content: [{ type: 'text', text: `✅ Comment added to task ${taskId}` }]
                    };
                }
                case 'auxly_add_research': {
                    const { taskId, technicalResearch, businessResearch } = args;
                    await storage.addComment(taskId, {
                        type: 'technical_research',
                        content: `## Technical Research\n\n**Summary:** ${technicalResearch.summary}\n\n**Findings:** ${technicalResearch.findings}\n\n**Sources:**\n${technicalResearch.sources.map((s) => `- ${s}`).join('\n')}\n\n**Recommendations:** ${technicalResearch.recommendations || 'N/A'}`,
                        author: 'ai',
                        authorName: 'AI Assistant',
                        createdAt: new Date().toISOString()
                    });
                    await storage.addComment(taskId, {
                        type: 'business_research',
                        content: `## Business Research\n\n**Summary:** ${businessResearch.summary}\n\n**Findings:** ${businessResearch.findings}\n\n**Sources:**\n${businessResearch.sources.map((s) => `- ${s}`).join('\n')}\n\n**Recommendations:** ${businessResearch.recommendations || 'N/A'}`,
                        author: 'ai',
                        authorName: 'AI Assistant',
                        createdAt: new Date().toISOString()
                    });
                    return {
                        content: [{ type: 'text', text: `✅ Dual research added to task ${taskId}\n\n✓ Technical Research\n✓ Business Research` }]
                    };
                }
                case 'auxly_log_change': {
                    try {
                        const { taskId, filePath, changeType, description, linesAdded, linesDeleted } = args;
                        await storage.logChange(taskId, {
                            filePath,
                            changeType,
                            description,
                            linesAdded: linesAdded || 0,
                            linesDeleted: linesDeleted || 0,
                            timestamp: new Date().toISOString()
                        });
                        return {
                            content: [{ type: 'text', text: `✅ Change logged: ${changeType} ${filePath}` }]
                        };
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error('[MCP Server] ❌ File change logging blocked:', errorMessage);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `❌ BLOCKED: ${errorMessage}`
                                }],
                            isError: true
                        };
                    }
                }
                case 'auxly_get_task_comments': {
                    const { taskId, type } = args;
                    const comments = await storage.getComments(taskId, type);
                    const summary = `💬 ${comments.length} comments found\n\n` +
                        comments.map(c => `[${c.type}] ${c.author}: ${c.content.substring(0, 100)}...`).join('\n\n');
                    return {
                        content: [{ type: 'text', text: summary }]
                    };
                }
                case 'auxly_get_task_changelog': {
                    const { taskId } = args;
                    const changes = await storage.getChangelog(taskId);
                    const summary = `📝 ${changes.length} file changes\n\n` +
                        changes.map(c => `[${c.changeType}] ${c.filePath}\n  ${c.description}\n  +${c.linesAdded || 0} -${c.linesDeleted || 0}`).join('\n\n');
                    return {
                        content: [{ type: 'text', text: summary }]
                    };
                }
                case 'auxly_get_task_questions': {
                    const { taskId, includeAnswered } = args;
                    const questions = await storage.getQuestions(taskId, includeAnswered);
                    const summary = `❓ ${questions.length} questions\n\n` +
                        questions.map(q => `Q: ${q.questionText}\nCategory: ${q.category}\nStatus: ${q.answer ? 'Answered' : 'Pending'}${q.answer ? `\nAnswer: ${q.answer.selectedOption || q.answer.customAnswer}` : ''}`).join('\n\n');
                    return {
                        content: [{ type: 'text', text: summary }]
                    };
                }
                case 'auxly_ask_question': {
                    const { taskId, questionText, category, priority, context, options, allowCustomAnswer } = args;
                    const question = await storage.addQuestion(taskId, {
                        text: questionText,
                        category,
                        priority,
                        context,
                        options
                    });
                    return {
                        content: [{ type: 'text', text: `❓ Question asked (ID: ${question.id})\n\nThe user will see a popup notification with sound alert.\n\nQuestion: ${question.text}\nCategory: ${question.category}\nPriority: ${question.priority}` }]
                    };
                }
                default:
                    return {
                        content: [{ type: 'text', text: `❌ Unknown tool: ${name}` }]
                    };
            }
        }
        catch (error) {
            log(`❌ Error in ${name}: ${error}`);
            return {
                content: [{ type: 'text', text: `❌ Error: ${error instanceof Error ? error.message : String(error)}` }]
            };
        }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log('═══ SERVER READY AND CONNECTED ═══');
    log(`📦 Tools available: ${taskTools.length}`);
    log('🔄 Auto-restart: Managed by Cursor automatically');
    log('💚 Cursor monitors and restarts if needed');
    process.on('uncaughtException', (error) => {
        logError('Uncaught exception - recovering', error);
    });
    process.on('unhandledRejection', (reason) => {
        logError('Unhandled rejection - recovering', reason);
    });
    process.on('SIGINT', async () => {
        log('Received SIGINT, shutting down...');
        try {
            await server.close();
            log('Server closed cleanly');
            process.exit(0);
        }
        catch (error) {
            logError('Error during shutdown', error);
            process.exit(1);
        }
    });
    process.on('SIGTERM', async () => {
        log('Received SIGTERM, shutting down...');
        try {
            await server.close();
            log('Server closed cleanly');
            process.exit(0);
        }
        catch (error) {
            logError('Error during shutdown', error);
            process.exit(1);
        }
    });
}
main().catch(err => {
    console.error('[Auxly MCP] Failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map