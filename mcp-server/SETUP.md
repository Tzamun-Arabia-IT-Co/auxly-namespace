# 🚀 Auxly MCP Server - Quick Setup Guide

## ✅ API Key Authentication (Recommended)

The MCP server now uses **API keys** instead of username/password for authentication. This is:
- ✅ More secure
- ✅ Persistent (no need to login each session)
- ✅ Easy to revoke if compromised

## 📋 Setup Steps

### Step 1: Get Your API Key

**Your API Key:**
```
auxly_16c3077b87d9d62e7ce6da4f4940d418eb85a6fa5d114bf57a523533399f0984
```

**⚠️ IMPORTANT:** Save this key securely! You won't be able to see it again.

### Step 2: Configure Cursor

1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
2. Search for **"MCP"** or click **Features → Model Context Protocol**
3. Click **"Edit in settings.json"**
4. Add this configuration:

```json
{
  "mcpServers": {
    "auxly": {
      "command": "node",
      "args": [
        "C:\\Auxly\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "AUXLY_API_URL": "http://localhost:7000",
        "AUXLY_API_KEY": "auxly_16c3077b87d9d62e7ce6da4f4940d418eb85a6fa5d114bf57a523533399f0984"
      }
    }
  }
}
```

**📝 Note:** Adjust the path `C:\\Auxly\\mcp-server\\dist\\index.js` to match your actual installation path.

### Step 3: Restart Cursor

Close and reopen Cursor to load the MCP server.

### Step 4: Verify It's Working

1. Go to **Settings → Features → Model Context Protocol**
2. You should see "auxly" server listed
3. Status should be "Ready" or "Connected"

### Step 5: Test in Chat

Open Cursor chat and try:

```
You: List all my tasks
AI: *calls auxly_list_tasks*
```

Or:

```
You: Create a task to implement dark mode
AI: *calls auxly_create_task*
✅ Task created successfully!
```

## 🛠️ Available Tools

Once configured, the AI can use these tools automatically:

| Tool | Description |
|------|-------------|
| `auxly_list_tasks` | List all tasks (filter by status optional) |
| `auxly_create_task` | Create a new task |
| `auxly_update_task` | Update task status, priority, etc |
| `auxly_delete_task` | Delete a task |
| `auxly_get_task` | Get detailed task information |

## 🔧 Troubleshooting

### MCP Server Not Showing

1. **Check the path is correct**
   - The path to `dist/index.js` must be absolute
   - Use `\\` (double backslash) on Windows

2. **Verify the build**
   ```bash
   cd mcp-server
   npm run build
   ```

3. **Check backend is running**
   - Backend must be running on http://localhost:7000
   - You should see the backend terminal showing requests

4. **Restart Cursor completely**
   - Close all windows
   - Reopen Cursor

### API Key Not Working

1. **Check the key is correct**
   - Copy the full key including `auxly_` prefix
   - No extra spaces

2. **Verify backend has API key support**
   - Test: `curl -H "X-API-Key: YOUR_KEY" http://localhost:7000/api-keys/verify`

### Tasks Not Loading

1. **Backend needs task endpoints**
   - The backend doesn't have `/tasks` routes yet
   - This will be added in the next step

2. **Check backend logs**
   - Look for error messages in the backend terminal

## 🔐 Managing API Keys

### Generate a New Key (from web dashboard - coming soon)

Or via command line:
```bash
curl -X POST http://localhost:7000/api-keys/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My MCP Key"}'
```

### List Your Keys

```bash
curl http://localhost:7000/api-keys/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Revoke a Key

```bash
curl -X DELETE http://localhost:7000/api-keys/{key_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Next Steps

Once the MCP server is working:

1. ✅ Test listing tasks (even if empty)
2. 🔧 Backend team will add task management endpoints
3. 🎨 Optional: Build a web dashboard for managing API keys
4. 🚀 Start using AI-powered task management in your workflow!

## 📚 Learn More

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Auxly README](../README.md)
- [Backend API Docs](../backend/README.md)

---

**🎉 You're all set! The AI can now manage your tasks automatically.**







