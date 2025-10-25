# 🔄 Real Auto-Restart Solution for Auxly MCP

**Problem:** Cursor's MCP launches as a child process. When you kill Node, Cursor doesn't restart it.

**Solution:** Use a process manager (PM2 or nodemon) to keep it alive **independently**.

---

## ✅ **Solution 1: PM2 (Recommended for Production)**

### Step 1: Install PM2 Globally

```bash
npm install -g pm2
```

### Step 2: Build the MCP Server

```bash
cd C:\Auxly\mcp-server
npm run build
```

### Step 3: Start with PM2

```bash
pm2 start ecosystem.config.js
```

### Step 4: Configure PM2 Auto-Startup (Windows)

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

### Step 5: Update Cursor Settings

Instead of having Cursor start the server, just connect to the **already running** PM2 process.

**Option A: Use stdio proxy** (connects to running server)
```json
{
  "mcp.servers": {
    "auxly": {
      "command": "pm2",
      "args": ["logs", "auxly-mcp", "--raw", "--lines", "0"],
      "env": {
        "AUXLY_API_URL": "http://localhost:7000",
        "AUXLY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Option B: Let PM2 manage it completely** (better!)

Just start PM2 in the background and Cursor doesn't need to manage it at all. Remove the MCP server from Cursor settings and use the integrated MCP provider in the extension instead.

---

## ✅ **Solution 2: Windows Service (Best for Windows)**

### Step 1: Install node-windows

```bash
cd C:\Auxly\mcp-server
npm install -g node-windows
```

### Step 2: Create Windows Service Script

Create `install-service.js`:

```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'Auxly MCP Server',
  description: 'Auxly MCP Server with Auto-Restart',
  script: 'C:\\Auxly\\mcp-server\\dist\\index.js',
  env: [{
    name: 'AUXLY_API_URL',
    value: 'http://localhost:7000'
  }, {
    name: 'AUXLY_API_KEY',
    value: 'your_api_key_here'
  }]
});

svc.on('install', () => {
  console.log('✅ Service installed!');
  svc.start();
});

svc.install();
```

### Step 3: Install the Service (Run as Administrator)

```bash
node install-service.js
```

### Step 4: Service Management

```bash
# Start service
sc start "Auxly MCP Server"

# Stop service
sc stop "Auxly MCP Server"

# Check status
sc query "Auxly MCP Server"
```

Now the service runs **independently** and auto-restarts on failure!

---

## ✅ **Solution 3: Use Nodemon in Cursor Config** ⭐ (Simplest!)

This is probably the **easiest solution** that works with Cursor's MCP protocol.

### Step 1: Install nodemon locally

```bash
cd C:\Auxly\mcp-server
npm install --save-dev nodemon
```

### Step 2: Update Cursor Settings

```json
{
  "mcp.servers": {
    "auxly": {
      "command": "npx",
      "args": [
        "nodemon",
        "--watch", "dist",
        "--exec", "node",
        "C:\\Auxly\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "AUXLY_API_URL": "http://localhost:7000",
        "AUXLY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Now `nodemon` will monitor the process and **restart it automatically** if it crashes or is killed!

---

## 🎯 **Comparison**

| Solution | Pros | Cons | Auto-Restart on Kill |
|----------|------|------|---------------------|
| **PM2** | Production-ready, great logging | Requires global install | ✅ Yes |
| **Windows Service** | Starts on boot, independent | Complex setup | ✅ Yes |
| **nodemon** | Simple, works with Cursor | Only monitors file changes by default | ⚠️ Partial |
| **Our wrapper** | Simple, no dependencies | Only restarts on crash, not kill | ❌ No |

---

## 🚀 **Recommended Approach**

For development: **Use PM2** (easiest to manage, best logging)
For production: **Windows Service** (most reliable, starts on boot)

---

## 📝 **PM2 Quick Commands**

```bash
# Start server
pm2 start ecosystem.config.js

# View logs
pm2 logs auxly-mcp

# Restart server
pm2 restart auxly-mcp

# Stop server
pm2 stop auxly-mcp

# Delete from PM2
pm2 delete auxly-mcp

# View status
pm2 status

# Monitor
pm2 monit
```

---

## ✅ **Test Auto-Restart with PM2**

1. Start with PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

2. Check it's running:
   ```bash
   pm2 status
   ```

3. Kill the Node process:
   ```powershell
   Get-Process -Name node | Where-Object { $_.CommandLine -like "*auxly*" } | Stop-Process -Force
   ```

4. Check PM2 - **it auto-restarted!**
   ```bash
   pm2 status  # Shows "online" and restart count increased
   ```

**PM2 will auto-restart even if you kill the process!** ✅

---

**Made with ❤️ in Saudi Arabia 🇸🇦**

