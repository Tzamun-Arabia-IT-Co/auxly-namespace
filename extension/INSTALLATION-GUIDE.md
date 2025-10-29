# Auxly v0.0.16 - Installation Guide

## 🎯 **ZERO CONFIGURATION REQUIRED!**

### ✨ **100% Automatic - Just Install and Use!**
This version is **completely automatic** - users **NEVER** need to:
- ❌ Run PowerShell scripts
- ❌ Edit configuration files  
- ❌ Configure PATH manually
- ❌ Do ANY manual setup!

### 🚀 **What Happens Automatically:**
- ✅ **WMIC configuration** (Windows 11) - creates automatically
- ✅ **MCP tool activation** - registers automatically
- ✅ **PATH configuration** - sets up automatically
- ✅ **Everything just works!** - zero user intervention

---

## 📦 Installation Steps (3 Steps Only!)

### Step 1: Download
Download `auxly-extension-0.0.16.vsix`

### Step 2: Install
**Via Cursor UI (Recommended):**
1. Open Cursor
2. Extensions (`Ctrl+Shift+X`)
3. Click "..." → "Install from VSIX..."
4. Select `auxly-extension-0.0.16.vsix`

**Or via Command Line:**
```powershell
code --install-extension auxly-extension-0.0.16.vsix
```

### Step 3: Reload
Click **"Reload Now"** when prompted

---

## ✅ **That's It! Everything Else is Automatic!**

### What Happens After Reload:

**Within 5 seconds, you'll see:**

1. ✨ **"Auxly: AI Assistant activated!"**
   
2. 🔧 **"Auxly: WMIC configuration completed automatically!"** (Windows 11)
   - No PowerShell scripts to run
   - No admin permissions needed
   - Everything happens in the background

3. 🚀 **"Auxly MCP Tools activated successfully!"**
   - MCP tools appear in AI chat immediately
   - Ready to use with `@extension-auxly`

**🎉 Done! You can start using Auxly immediately!**

---

## 🆘 What If Something Goes Wrong?

### If you see: "⚠️ Auxly MCP Tools registration failed"

**Don't worry!** This just means Cursor wasn't ready yet. You'll see:

```
⚠️ Auxly MCP Tools registration failed. 
   This is needed for AI integration.

   [Retry Now]  [Retry on Next Startup]  [Ignore]
```

**Just click "Retry Now"** and it will work! ✅

This is **not an error** - it's just Cursor's timing. The retry happens automatically in the background.

---

## ✅ Verify Installation

### Check Extension is Active:
1. Open the **Extensions** panel (`Ctrl+Shift+X`)
2. Search for "Auxly"
3. You should see **"Auxly by Tzamun"** with version **0.0.16**

### Check MCP Tools are Working:
1. Open Cursor AI chat (`Ctrl+L`)
2. Type: `@`
3. You should see **"extension-auxly"** in the tools list
4. MCP tools available:
   - `auxly_create_task`
   - `auxly_list_tasks`
   - `auxly_update_task`
   - `auxly_delete_task`
   - `auxly_add_comment`
   - `auxly_get_task_comments`
   - `auxly_log_change`
   - `auxly_get_task_changelog`
   - `auxly_ask_question`
   - `auxly_get_task_questions`
   - `auxly_add_research`
   - `auxly_get_task`

### Check Dashboard Access:
1. Click the **Auxly icon** in the left sidebar (activity bar)
2. Or click the **"Auxly"** button in the status bar (bottom left)
3. The Auxly dashboard should open

---

## 🐛 Troubleshooting

### MCP Tools Not Showing?

#### Quick Fix #1: Use Built-in Reset
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: `Auxly: Reset MCP Configuration`
3. Click **"Re-register"**
4. Wait 5 seconds for confirmation

#### Quick Fix #2: Reload Cursor
1. Press `Ctrl+R` to reload Cursor window
2. Wait for "✅ Auxly MCP Tools activated successfully!" message
3. Check AI chat again with `@`

#### Quick Fix #3: Check Output Log
1. Open **Output** panel (`Ctrl+Shift+U`)
2. Select **"Auxly MCP"** from the dropdown
3. Look for error messages
4. Common issues and solutions:
   - `"MCP server not found"` → Reinstall extension
   - `"Cursor MCP API not available"` → Update Cursor to latest version
   - `"Registration failed"` → Try "Reset MCP Configuration" command

### WMIC Issues (Windows 11)?

**This should be 100% automatic now**, but if you see WMIC-related errors:

1. **Verify Shim Creation:**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Type: `Auxly: Verify MCP Diagnostics`
   - Check if WMIC shim is active

2. **Manual Verification:**
   - Check: `%APPDATA%\Code\User\globalStorage\tzamun-arabia-it-co.auxly-extension\wmic-shim`
   - You should see: `wmic.cmd`, `wmic.bat`, `wmic.ps1`

3. **Force Re-creation:**
   - Uninstall Auxly extension
   - Delete global storage: `%APPDATA%\Code\User\globalStorage\tzamun-arabia-it-co.auxly-extension`
   - Reinstall extension
   - Reload Cursor

---

## 🔑 API Key Setup

After installation, you need to connect to your Auxly account:

### Option 1: Via Dashboard (Recommended)
1. Open Auxly dashboard (click Auxly icon in sidebar)
2. You'll see a forced API key modal
3. Enter your API key from https://auxly.tzamun.com/dashboard
4. Click **"Connect"**

### Option 2: Via Command
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: `Auxly: Connect with API Key`
3. Enter your API key
4. Press Enter

---

## 📊 System Requirements

- **Cursor**: Latest version (API support required for MCP)
- **Node.js**: v16+ (usually bundled with Cursor)
- **Operating Systems**:
  - ✅ Windows 10/11 (WMIC auto-configured)
  - ✅ macOS (no WMIC needed)
  - ✅ Linux (no WMIC needed)

---

## 🆘 Support

### Need Help?
1. **Check Output Logs**: View → Output → Select "Auxly MCP"
2. **Try Diagnostics**: `Auxly: Verify MCP Diagnostics`
3. **Reset Configuration**: `Auxly: Reset MCP Configuration`
4. **Contact Support**: support@tzamun.com

### Reporting Issues
Please include:
- Auxly version (0.0.16)
- Cursor version
- Operating system
- Output log contents (View → Output → "Auxly MCP")
- Steps to reproduce

---

## ✨ What Makes v0.0.16 Special

### Before (v0.0.15 and earlier):
❌ Manual WMIC PowerShell scripts  
❌ Manual MCP configuration  
❌ Confusing error messages  
❌ No retry options  
❌ Silent failures  

### Now (v0.0.16):
✅ **100% Automatic WMIC setup**  
✅ **Automatic MCP activation**  
✅ **Clear success/error messages**  
✅ **Built-in retry mechanisms**  
✅ **One-click recovery**  
✅ **Helpful troubleshooting guidance**  

---

## 🎉 You're All Set!

Once you see:
- ✅ "Auxly: AI Assistant activated!"
- ✅ "Auxly MCP Tools activated successfully!"
- ✅ MCP tools appear in AI chat (`@extension-auxly`)

**You're ready to use Auxly!** 🚀

Start creating tasks, using AI collaboration, and enjoying the world's best AI task management system!

---

**Made with ❤️ in Saudi Arabia 🇸🇦 by Tzamun**


