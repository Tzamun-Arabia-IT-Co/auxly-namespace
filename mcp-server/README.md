# 🚀 Auxly MCP Server

AI-powered task management for Cursor using the Model Context Protocol (MCP).

## 📋 What is This?

This is an MCP server that connects Cursor AI to the Auxly backend, enabling AI to:
- Create and manage tasks automatically
- Track task status during development
- Add context and comments to tasks
- Integrate task management into your coding workflow

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   cd mcp-server
   npm install
   ```

2. **Build the server:**
   ```bash
   npm run build
   ```

3. **Configure in Cursor:**
   
   Add to your Cursor settings (Settings → Features → Model Context Protocol):
   
   ```json
   {
     "mcpServers": {
       "auxly": {
         "command": "node",
         "args": [
           "/absolute/path/to/Auxly/mcp-server/dist/index.js"
         ],
         "env": {
           "AUXLY_API_URL": "http://localhost:7000"
         }
       }
     }
   }
   ```

   **Or** use `npx` (if published):
   ```json
   {
     "mcpServers": {
       "auxly": {
         "command": "npx",
         "args": ["@auxly/mcp-server"]
       }
     }
   }
   ```

## 🎯 Available Tools

### `auxly_login`
Login to your Auxly account.
```
email: your-email@example.com
password: your-password
```

### `auxly_list_tasks`
List all tasks, optionally filtered by status.
```
status?: "todo" | "in_progress" | "review" | "done"
```

### `auxly_create_task`
Create a new task.
```
title: "Task title" (required)
description?: "Task description"
priority?: "low" | "medium" | "high" | "critical"
tags?: ["tag1", "tag2"]
```

### `auxly_update_task`
Update an existing task.
```
taskId: "task-id" (required)
title?: "New title"
description?: "New description"
status?: "todo" | "in_progress" | "review" | "done"
priority?: "low" | "medium" | "high" | "critical"
```

### `auxly_delete_task`
Delete a task.
```
taskId: "task-id" (required)
```

### `auxly_get_task`
Get detailed task information.
```
taskId: "task-id" (required)
```

## 💡 Example Usage in Cursor Chat

```
You: Login to Auxly
AI: *calls auxly_login with your credentials*

You: Create a task to implement user authentication
AI: *calls auxly_create_task*
✅ Task created: "Implement user authentication"

You: Show me all in-progress tasks
AI: *calls auxly_list_tasks with status="in_progress"*

You: Move task 123 to done
AI: *calls auxly_update_task*
```

## 🛠️ Development

### Run in development mode:
```bash
npm run dev
```

### Build:
```bash
npm run build
```

### Test the server:
```bash
node dist/index.js
```

Then type JSON-RPC requests to test.

## 🔐 Authentication

The server stores authentication tokens in memory during the session. You'll need to login each time you restart Cursor or the MCP server.

## 🐛 Troubleshooting

### Server not showing in Cursor
1. Check the path in your MCP settings is correct (absolute path)
2. Make sure `npm run build` completed successfully
3. Restart Cursor

### Authentication errors
1. Make sure the backend is running on http://localhost:7000
2. Check your credentials are correct
3. Try `auxly_login` again

### Tasks not loading
1. Make sure you're logged in (`auxly_login`)
2. Check the backend has task endpoints (they might not be implemented yet)
3. Check backend logs for errors

## 📚 Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Auxly Documentation](../README.md)
- [Backend API](../backend/README.md)

## 📝 License

MIT







