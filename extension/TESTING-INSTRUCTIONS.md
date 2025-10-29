# ✅ Auxly Extension - Testing Instructions

## 🎉 FIXED: Event Listener Issue

**Problem:** The "Connect with API Key" button (and other buttons) were not clickable in F5 debug mode or VSIX install.

**Root Cause:** Event listeners were wrapped in `DOMContentLoaded`, which never fires in VS Code webviews because the DOM is already loaded when the script runs.

**Solution:** Changed from `DOMContentLoaded` listener to immediate event listener initialization.

---

## 📦 Installation Steps

### 1️⃣ Install the VSIX

```powershell
cd C:\Auxly\extension
code --install-extension auxly-EVENT-FIX.vsix
```

### 2️⃣ Restart Cursor Completely

1. Close Cursor
2. Check Task Manager - ensure NO `Cursor.exe` processes running
3. Reopen Cursor

### 3️⃣ Open the Extension

1. Press `Ctrl+Shift+P`
2. Type: `Auxly: Open Dashboard`
3. Press Enter

---

## ✅ What Should Work Now

- ✅ **Connect with API Key button** - Clickable, shows input prompt
- ✅ **Disconnect button** - Clickable
- ✅ **Done button** on task cards - Marks task as done
- ✅ **Reopen button** on task cards - Reopens task with reason
- ✅ **Add Comment button** in task details - Opens input prompt
- ✅ **Change Status button** in task details - Shows status picker
- ✅ **Delete button** in task details - Shows confirmation dialog
- ✅ **Task card click** - Opens task detail modal (buttons don't trigger card click)

---

## 🧪 Testing Checklist

### Authentication
- [ ] Click "Connect with API Key" - Input prompt appears
- [ ] Enter API key and submit
- [ ] UI updates to show connected state
- [ ] Click "Disconnect" - Successfully disconnects

### Task Management
- [ ] Click "Done" on a task card - Task moves to Done column
- [ ] Click "Reopen" on a done task - Input prompt for reason appears
- [ ] Click task card - Detail modal opens
- [ ] In modal: Click "Add Comment" - Input prompt appears
- [ ] In modal: Click "Change Status" - Status picker appears
- [ ] In modal: Click "Delete" - Confirmation dialog appears

### Console Output
- [ ] Open DevTools (Help → Toggle Developer Tools)
- [ ] Check Console tab - Should see:
  - `Connect button clicked` (when clicking Connect)
  - `Disconnect button clicked` (when clicking Disconnect)
  - No CSP errors
  - No `Refused to execute inline event handler` errors

---

## 🔧 What Was Fixed

### Before:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectButton');
    // ... never runs because DOM is already loaded!
});
```

### After:
```javascript
function initializeEventListeners() {
    const connectBtn = document.getElementById('connectButton');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            console.log('Connect button clicked');
            vscode.postMessage({ command: 'connect' });
        });
    }
    // ... all other listeners
}

// Call immediately - DOM is already loaded in webviews
initializeEventListeners();
```

---

## 📝 Files Changed

1. **extension/src/webview/TaskPanelProvider.ts**
   - Removed `DOMContentLoaded` wrapper
   - Created `initializeEventListeners()` function
   - Called function immediately after definition

2. **extension/dist/extension.js** (compiled output)
   - Contains the fix
   - Verified with grep: `initializeEventListeners()` present

3. **auxly-EVENT-FIX.vsix** (packaged extension)
   - Fresh build with all fixes
   - 134.63 KB
   - Ready to install

---

## 🐛 If Issues Persist

1. **Hard Reset:**
   ```powershell
   # Uninstall extension
   code --uninstall-extension auxly
   
   # Clear VS Code cache
   Remove-Item -Recurse -Force "$env:APPDATA\Cursor\Cache" -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force "$env:APPDATA\Cursor\Code Cache" -ErrorAction SilentlyContinue
   
   # Reinstall
   code --install-extension auxly-EVENT-FIX.vsix
   ```

2. **Check Console for Errors:**
   - Help → Toggle Developer Tools
   - Console tab
   - Look for CSP or event handler errors

3. **Try F5 Debug Mode:**
   - Open `C:\Auxly\extension` in Cursor
   - Press F5
   - Extension Development Host window opens
   - Fresh instance with no cache

---

## ✅ Success Criteria

You should be able to:
1. Click "Connect with API Key" and see input prompt
2. Click any button in the UI without opening DevTools
3. No console errors related to CSP or inline handlers
4. Task cards open modal only when clicking the card (not buttons)
5. All task management operations work as expected

---

**Last Updated:** October 12, 2025
**VSIX File:** `auxly-EVENT-FIX.vsix`
**Build:** Production mode with hidden source maps









