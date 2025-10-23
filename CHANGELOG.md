# Changelog

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



