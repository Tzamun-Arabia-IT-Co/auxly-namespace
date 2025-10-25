# Release Notes - Version 0.1.6

**Release Date:** October 25, 2025

## 🎉 What's New

### ✨ Windsurf Editor Support
- **Full Windsurf Integration**: Auxly now works seamlessly in Windsurf editor!
- **Automatic MCP Configuration**: Windsurf MCP server auto-configures on first launch
- **Config File Management**: Writes to `~/.codeium/windsurf/mcp_config.json`
- **Auto-Reload Support**: Prompts for reload when configuration changes

### 🎯 Multi-Editor Architecture
- **Editor Detection**: Automatic detection of Cursor vs Windsurf
- **Windsurf Rules**: Auto-deploys `.windsurfrules` template for Windsurf users
- **Cursor Rules**: Continues to support `.cursorrules` for Cursor users
- **Smart Configuration**: Different MCP setup strategies per editor

## 📝 Editor Support Status

| Editor | Status | Notes |
|--------|--------|-------|
| **🎯 Cursor** | ✅ Fully Supported | Programmatic API, no reload required |
| **🌊 Windsurf** | ✅ Fully Supported | Config file based, reload required |
| **🍐 PearAI** | 🚧 Coming Soon | Planned for future release |
| **🚀 Trae** | 🚧 Coming Soon | Planned for future release |

## 🔧 Technical Updates

### New Files Added
- `src/mcp/mcp-windsurf-config.ts` - Windsurf MCP configuration handler
- `src/mcp/mcp-pearai-config.ts` - PearAI config (prepared for future)
- `src/mcp/mcp-trae-config.ts` - Trae config (prepared for future)
- `src/utils/editor-detector.ts` - Multi-editor detection utility
- `resources/templates/.windsurfrules` - Windsurf rules template

### Updated Components
- `src/mcp/index.ts` - Multi-editor MCP orchestration
- `src/extension.ts` - Editor-specific rules deployment
- `README.md` - Updated with multi-editor support info
- `package.json` - Updated keywords and description

## 🐛 Bug Fixes
- Fixed MCP configuration reload loops
- Improved Node.js executable detection for Windsurf
- Better error handling for missing MCP server files

## 📦 Package Information
- **Version:** 0.1.6
- **Size:** ~16.85 MB
- **Files:** 3,881 files
- **Publisher:** Auxly

## 🚀 Installation

### For Cursor Users
1. Install extension from Open VSX
2. MCP auto-configures via Cursor API
3. Start using immediately (no reload needed)

### For Windsurf Users
1. Install extension from Open VSX
2. MCP writes to `~/.codeium/windsurf/mcp_config.json`
3. Click "Reload" when prompted
4. Start using Auxly!

## 🔗 Resources
- **Homepage:** https://auxly.tzamun.com
- **GitHub:** https://github.com/Tzamun-Arabia-IT-Co/auxly-namespace
- **Documentation:** See README.md

## 🙏 Credits
Made in Saudi Arabia 🇸🇦 with ❤️ by Tzamun Arabia IT Co.

---

**Next Up:** PearAI and Trae editor support coming soon!


