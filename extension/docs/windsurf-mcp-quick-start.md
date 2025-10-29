# 🚀 Windsurf MCP Auto-Restart - Quick Start Guide

**Problem Solved:** MCP disconnects when Node process dies → Now auto-restarts automatically!

---

## ⚡ Quick Overview

### What Changed?
- **Before:** Kill Node process → MCP disconnects → Reload window required
- **After:** Kill Node process → MCP auto-restarts in < 15s → No reload needed!

### How It Works
1. Extension monitors MCP server process every 15 seconds
2. If process dies, extension spawns a new one automatically
3. You get a notification: "✅ MCP server restarted automatically"
4. No manual action needed!

---

## 🎯 For Users

### No Action Required!
The health monitor starts automatically when you:
1. Install/Update Auxly extension
2. Reload Windsurf window (first time only)
3. That's it! Auto-restart is now active

### What You'll See

**Normal Operation:**
- No notifications (everything working silently)
- MCP tools available in AI chat

**After Process Crash:**
- Notification: "✅ Auxly MCP server restarted automatically"
- Brief 5-15 second delay
- MCP tools resume working

**If Restart Fails (rare):**
- After 5 failed attempts: "⚠️ Please reload window"
- Click "Reload Window" button

---

## 🔧 For Developers

### Testing Auto-Restart

**Windows:**
```powershell
# Kill Node.js process
taskkill /F /IM node.exe

# Wait 15 seconds
# ✅ Should see: "Auxly MCP server restarted automatically"
```

**Linux/Mac:**
```bash
# Kill Node.js process
pkill -9 node

# Wait 15 seconds
# ✅ Should see: "Auxly MCP server restarted automatically"
```

### Manual Restart

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type: `Auxly: Restart MCP Server`
3. Click to execute
4. Confirm restart

### Check Health Status

**View Logs:**
1. Open Output panel (`View` → `Output`)
2. Select `Auxly` from dropdown
3. Look for:
   - `[Windsurf Health] 🔍 Checking MCP server health...`
   - `[Windsurf Health] ✅ MCP server process is alive`

---

## 📊 Configuration (Optional)

### Default Settings
```typescript
Health Check Interval: 15 seconds
Max Restart Attempts: 5
Cooldown Between Attempts: 10 seconds
```

### Advanced: Adjust Settings
Edit `extension/src/mcp/windsurf-mcp-health-monitor.ts`:

```typescript
// Faster detection (uses more CPU)
private readonly HEALTH_CHECK_INTERVAL_MS = 5000; // 5s instead of 15s

// More persistent restarts
private readonly MAX_RESTART_ATTEMPTS = 10; // 10 instead of 5

// Faster retry
private readonly RESTART_COOLDOWN_MS = 5000; // 5s instead of 10s
```

Then rebuild extension:
```bash
npm run compile
```

---

## 🐛 Troubleshooting

### MCP Not Auto-Restarting

**Check 1: Is monitor running?**
```typescript
// Open DevTools Console (Help → Toggle Developer Tools)
// Look for logs:
[Windsurf Health] 🏥 Starting MCP health monitoring...
[Windsurf Health] ✅ Monitoring started
```

**Check 2: Is Node.js in PATH?**
```bash
# Run in terminal:
node --version

# Should show: v20.x.x or similar
```

**Check 3: Are there errors?**
- Open Output panel
- Select "Auxly"
- Look for ERROR messages

**Solution:** Reload window, check if Node.js installed

### High Restart Frequency

**Symptom:** Seeing restart notifications every few seconds

**Possible Causes:**
- MCP server crashing immediately after start
- Node.js path incorrect
- Workspace permission issues

**Solution:**
1. Check Auxly output panel for errors
2. Run `Auxly: Restart MCP Server` manually
3. If persists, report bug with logs

### Window Reload Still Needed

**After First Install:**
- ✅ **Normal** - Initial config requires reload
- Health monitor starts **after** first reload

**After Every Crash:**
- ❌ **Not Normal** - Should auto-restart
- Check if monitor is running (see above)

---

## ✅ Verification Checklist

After installation/update:

- [ ] Reloaded Windsurf window
- [ ] Opened Auxly output panel
- [ ] Saw "MCP health monitoring started" message
- [ ] Tested manual restart command
- [ ] (Optional) Tested auto-restart by killing Node process

---

## 📚 Additional Resources

- **Full Documentation:** `extension/docs/windsurf-mcp-auto-restart.md`
- **Code:** `extension/src/mcp/windsurf-mcp-health-monitor.ts`
- **GitHub Issues:** Report problems

---

## 🎉 Success!

You now have:
- ✅ Auto-restart on crash
- ✅ No more window reloads
- ✅ Same stability as Cursor
- ✅ Peace of mind

**Enjoy seamless MCP in Windsurf!** 🚀







