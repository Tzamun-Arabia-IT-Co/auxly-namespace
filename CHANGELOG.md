# Changelog

## [0.1.4] - 2025-10-23

### 🔍 Enhanced Cursor Marketplace Visibility

#### 🎯 Improved Discoverability
- ✅ **Enhanced Keywords** - Added Cursor-specific search terms (cursor, cursor ai, cursor ide, cursor extension, cursor tools)
- ✅ **MCP Keywords** - Added Model Context Protocol tags for better MCP tool discovery
- ✅ **Better Categorization** - Optimized category order for Cursor marketplace indexing
- ✅ **Cursor Compatibility File** - Added `.cursorignore` for Cursor recognition
- ✅ **Expanded Tags** - Added task management, project management, workflow, automation keywords

#### 📝 What This Means
- Better search results when searching "cursor" in Cursor marketplace
- Improved indexing in Cursor's extension search
- More discoverable for Cursor-specific features (MCP, AI collaboration)
- Enhanced marketplace SEO for AI-powered task management

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



