# Auxly MCP Troubleshooting Guide v0.0.16

## 🔍 Enhanced Diagnostics

Version 0.0.16 includes **comprehensive diagnostics** to help identify why MCP tools aren't activating.

---

## 📊 How to Run Diagnostics

### Option 1: Command Palette (Recommended)
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `Auxly: Verify MCP Diagnostics`
3. Press Enter
4. A detailed report will open in a new panel

### Option 2: Watch Console Logs
1. Press `Ctrl+Shift+P`
2. Type: `Developer: Open Extension Host Console`
3. Press Enter
4. Look for messages starting with `[Auxly MCP]` or `[MCP Health]`

---

## 📋 What the Diagnostics Report Shows

The enhanced diagnostic command (`Auxly: Verify MCP Diagnostics`) now provides **6 detailed sections**:

### Section 1: WMIC Configuration
- ✅ Shows if WMIC shim is active or native WMIC is available
- Shows the shim location (if applicable)

### Section 2: MCP Server File
- Verifies the MCP server file exists at `dist/mcp-server/index.js`
- Shows file size and last modified date
- **❌ If file is missing, this is your problem!**

### Section 3: Cursor MCP API
- Checks if Cursor's MCP API is available
- Lists all available API methods (like `registerServer`, `getServers`, `callTool`, etc.)
- **❌ If API not available, Cursor might not be initialized yet**

### Section 4: Registered MCP Servers
- Lists ALL registered MCP servers (not just Auxly)
- Shows if Auxly server is registered (looks for `auxly` or `extension-auxly`)
- Displays the complete server configuration
- **❌ If Auxly not in list, registration failed**

### Section 5: Auxly Server Status
- Attempts to get server status (state, PID, connected, errors)
- **Tests actual tool call** - tries to call `auxly_list_tasks`
- **✅ If tool call succeeds, MCP is working!**
- **❌ If tool call fails, process is not responding**

### Section 6: Process Tree
- Shows total running processes
- Lists all Node.js processes
- Helps verify if the MCP server Node.js process is actually running
- **❌ If no Node.js process for Auxly, server didn't start**

---

## 🚨 Common Issues and Solutions

### Issue 1: "Auxly Server Not Registered"
**Symptom:** Section 4 shows Auxly is not in the registered servers list

**Solutions:**
1. **Try Manual Registration:**
   - Press `Ctrl+Shift+P`
   - Type: `Auxly: Reset MCP Configuration`
   - Choose "Re-register"
   
2. **Reload Cursor:**
   - Press `Ctrl+Shift+P`
   - Type: `Developer: Reload Window`
   - Wait for extension to activate

3. **Check Cursor Version:**
   - MCP API might not be available in older Cursor versions
   - Update to latest Cursor

### Issue 2: "Tool Call Failed / Timeout"
**Symptom:** Section 5 shows "Tool call failed" or "Timeout after 5s"

**Solutions:**
1. **Server Process Didn't Start:**
   - Check Section 6 for Node.js processes
   - If missing, Node.js might not be in PATH
   - Try: `node --version` in terminal to verify

2. **WMIC Shim Issue (Windows 11):**
   - Check Section 1 for shim status
   - If shim failed to create, PATH might not be set
   - Try manual registration after reloading

3. **Port Conflict:**
   - MCP uses stdio (not ports), but if Node.js can't start...
   - Check Task Manager for hung Node.js processes
   - Kill them and reload Cursor

### Issue 3: "MCP Server File Missing"
**Symptom:** Section 2 shows "File Exists: ❌ NO"

**Solutions:**
1. **Incomplete VSIX Installation:**
   - Uninstall the extension completely
   - Re-install from VSIX file
   - Make sure to click "Reload Now"

2. **Webpack Build Issue:**
   - Check if `dist` folder exists in extension directory
   - Might need to rebuild extension

### Issue 4: "Cursor MCP API Not Available"
**Symptom:** Section 3 shows "Cursor API Available: ❌ NO"

**Solutions:**
1. **Timing Issue:**
   - Wait 10-20 seconds after Cursor starts
   - Run diagnostics again

2. **Cursor Version:**
   - MCP API was added in recent Cursor versions
   - Update Cursor to latest version

3. **Restart Cursor:**
   - Completely close Cursor
   - Restart and wait for full initialization

---

## 🔧 Advanced Troubleshooting

### Check Console Logs
The enhanced health monitor now provides detailed logs:

```
✅ [MCP Health] Server is healthy and responding
or
❌ [MCP Health] Server is not responding or not started
```

Look for these patterns in Extension Host Console:

**Good Pattern:**
```
📋 [MCP Health] Found 3 registered MCP servers: ['todo2', 'auxly', 'other']
✅ [MCP Health] Auxly server found in registry
🔧 [MCP Health] Testing server connection with listTools...
✅ [MCP Health] Server responded to tool call
✅ [MCP Health] Server is healthy and responding
```

**Bad Pattern:**
```
📋 [MCP Health] Found 1 registered MCP servers: ['todo2']
❌ [MCP Health] Auxly MCP server not registered in Cursor
❌ [MCP Health] Server is not responding or not started
```

### Manual Node.js Test
Test if the MCP server can run manually:

```powershell
# Navigate to extension directory
cd "C:\Users\YourUser\.cursor\extensions\tzamun-arabia-it-co.auxly-extension-0.0.16"

# Try to run MCP server directly
node dist\mcp-server\index.js
```

If this fails, it means the server file has issues.

### Check Environment Variables
The MCP server needs these environment variables:
- `AUXLY_WORKSPACE_PATH` - path to workspace
- `AUXLY_WORKSPACE_ID` - hash of workspace path
- `AUXLY_API_URL` - API URL (default: https://auxly.tzamun.com:8000)
- `PATH` - must include WMIC shim directory (Windows 11)

These are set automatically during registration.

---

## ✅ What Success Looks Like

When everything is working, the diagnostics report should show:

```
Section 1: ✅ WMIC Shim Active (or Native WMIC Available)
Section 2: ✅ File Exists: YES
Section 3: ✅ Cursor API Available: YES
Section 4: ✅ Auxly Server Registered: YES
Section 5: ✅ Tool call succeeded!
Section 6: Node.js Processes: [shows Auxly MCP process]
```

And in the Auxly task panel:
- **MCP Status indicator should be GREEN** (🟢)
- MCP tools should appear in AI chat with `@extension-auxly`

---

## 🆘 Still Not Working?

If diagnostics show everything is OK but MCP still shows RED:

1. **Restart Health Monitor:**
   - The health monitor checks every 10 seconds
   - Wait 10-15 seconds for next check
   - Or reload Cursor window

2. **Check AI Chat:**
   - Type `@ext` in Cursor AI chat
   - You should see `@extension-auxly` in suggestions
   - If it appears, MCP IS working (ignore red indicator)

3. **Collect Diagnostics:**
   - Run `Auxly: Verify MCP Diagnostics`
   - Save the full report
   - Share with support team

---

## 📧 Getting Help

If none of these solutions work:

1. Run diagnostics: `Auxly: Verify MCP Diagnostics`
2. Copy the full report
3. Open Extension Host Console (`Developer: Open Extension Host Console`)
4. Copy all logs starting with `[Auxly MCP]` or `[MCP Health]`
5. Contact support with both reports

---

## 🔄 Version History

**v0.0.16 Changes:**
- ✅ Enhanced diagnostics with 6 detailed sections
- ✅ Improved health monitoring with better logging
- ✅ Automatic WMIC shim configuration
- ✅ Tool call testing in diagnostics
- ✅ Process tree analysis
- ✅ Comprehensive error messages

---

**Last Updated:** October 22, 2025


