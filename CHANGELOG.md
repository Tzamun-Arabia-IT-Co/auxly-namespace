# Changelog

## [0.1.5] - 2025-10-23

### 🐛 Critical Fix - API Key Verification on Systems Without curl

#### 🔧 Cross-Platform Compatibility
- ✅ **Fallback HTTP Client** - Now uses Node.js native HTTPS when curl.exe is not available
- ✅ **Automatic Detection** - Tries curl first, falls back to native HTTPS seamlessly  
- ✅ **No Manual Configuration** - Works out of the box on all systems
- ✅ **Same SSL Handling** - Maintains security settings across both methods

#### 📝 What This Fixes
- Resolves "Command failed: curl.exe" error on fresh Windows installations
- API key verification now works on all systems (with or without curl)
- Extension activates successfully regardless of system configuration
- No more "External HTTP request failed" errors

#### 🎯 Technical Details
- Primary method: curl.exe (Windows 10+)
- Fallback method: Node.js native HTTPS module
- Both methods bypass SSL restrictions for Let's Encrypt certificates
- Automatic fallback with clear logging for debugging

---

## [0.1.4] - 2025-10-23

### 🐛 Critical Bug Fixes & Stability Improvements

#### 🔒 Security & Workflow Enhancements
- ✅ **Hold Status Bypass Prevention** - AI can no longer bypass task hold restrictions by changing availability status
- ✅ **Clear Error Messages** - Error messages now accurately reflect the actual validation issue (no confusing mixed messages)
- ✅ **Research Validation Fixed** - Research added via MCP tools is now properly recognized and validated

#### 🎯 Technical Improvements
- ✅ **MCP Server Stability** - Enhanced error handling and validation logic
- ✅ **Storage Sync** - Improved task data reloading from disk
- ✅ **Research Detection** - Validates both research arrays and research comments
- ✅ **Error Context** - Errors now show specific guidance based on validation type

#### 📦 Package Updates
- **Version:** 0.1.4
- **Size:** 15.8 MB (includes complete MCP server with all fixes)
- **Files:** 3,352 files
- All workflow rule files included (.mdc)
- Complete MCP tool suite (12 tools)

#### 🧪 Fully Tested
- ✅ Hold restriction enforcement verified
- ✅ Research validation working correctly
- ✅ Status transitions smooth
- ✅ Error messages clear and helpful
- ✅ Complete workflow tested end-to-end

#### 🇸🇦 Made in Saudi Arabia with ❤️
- Production-ready and stable
- All critical bugs resolved
- Ready for Open VSX publication

---

## [0.1.3] - 2025-10-23

### ✅ Stable Release - Fully Tested

#### 🎉 All Features Verified
- ✅ **Extension Activation** - Works without errors
- ✅ **MCP Server Registration** - Registers successfully with Cursor API
- ✅ **Task Management** - Create, update, delete tasks via MCP tools
- ✅ **Hold/Unhold Functionality** - AI respects hold status, blocks modifications correctly
- ✅ **Research Requirements** - Technical + Business research enforced before status changes
- ✅ **Question System** - Popup notifications with sound alerts working perfectly
- ✅ **File Change Logging** - Tracks modifications with safety guards
- ✅ **Comments System** - Multiple comment types (general, technical, business, manual setup)
- ✅ **Status Workflows** - Complete task lifecycle (todo → in_progress → review → done)
- ✅ **aiWorkingOn Flag** - Animated gradient borders for active tasks

#### 📦 Package Optimization
- **Size:** 15.76 MB (optimized, includes bundled MCP server)
- **Files:** 3,340 files (production-ready)
- Webpack bundling with production mode
- Excluded dev dependencies and source maps

#### 🔒 Safety Features
- Blocks incomplete tasks from moving to review status
- Prevents modifications to held tasks
- Validates research completion before status changes
- Forbidden file patterns for change logging

#### 🎨 User Experience
- Version display in webview UI (v0.1.2)
- Clear error messages with actionable guidance
- Sound alerts for question popups
- Animated borders for tasks being worked on

#### 🇸🇦 Made in Saudi Arabia with ❤️
- All features tested and verified
- Ready for production use
- Stable marketplace release

---

## [0.0.16] - 2025-01-22

### ✨ Enhanced MCP Auto-Configuration & Reliability

#### 🔧 Automatic WMIC Configuration
- **Automatic WMIC shim creation** on Windows 11 systems (no manual setup required!)
- **Zero admin permissions needed** - uses extension global storage
- **Transparent PATH configuration** for MCP server process
- **Automatic detection** of native WMIC vs shim requirement

#### 🚀 Improved MCP Registration
- **Enhanced error handling** with user-friendly retry options
- **Automatic retry mechanism** for registration failures
- **Better logging** for troubleshooting MCP activation
- **WMIC PATH propagation** to MCP server environment
- **Verification step** to confirm MCP tools are active

#### 💡 User Experience Improvements
- **Clear status messages** during extension activation
- **"Retry Now" option** if MCP registration fails initially
- **"Retry on Next Startup" option** for deferred activation
- **Automatic success notifications** when MCP tools activate
- **Helpful troubleshooting guidance** in error messages

#### 🐛 Bug Fixes
- Fixed MCP tools not showing after fresh installation
- Fixed WMIC compatibility issues on Windows 11
- Fixed race condition in MCP server registration
- Fixed PATH environment not propagating to MCP process

#### 📝 Technical Details
- MCP server now receives WMIC shim PATH automatically
- Registration includes retry logic with configurable delays
- Better Cursor API availability detection
- Enhanced registration verification process

### 🎯 What This Means for Users
After installing Auxly 0.0.16:
1. **No manual configuration required** - everything is automatic
2. **WMIC issues are auto-fixed** - no PowerShell scripts to run
3. **MCP tools activate reliably** - with retry options if needed
4. **Clear feedback** - you'll know when things are working
5. **One-click recovery** - easy retry if something goes wrong

---

## [0.0.15] - Previous Version
- Microsoft OAuth integration
- Enhanced admin features
- User management improvements



