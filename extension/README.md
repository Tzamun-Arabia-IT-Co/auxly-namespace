# Auxly by Tzamun - AI Task Management

> **Made in Saudi Arabia 🇸🇦 with ❤️ for developers**

**Enhance your development with AI that truly collaborates** - featuring AI question popups with sound alerts, FORCED dual research, and smart approval workflows that ensure quality code and well-informed decisions.

**✨ NEW: Now supports Windsurf!** Works in both Cursor and Windsurf with automatic MCP configuration and auto-restart on crash.

---

## 🎯 Supported AI Code Editors

Auxly works seamlessly in **multiple AI code editors** with automatic MCP configuration:

| Editor | Status | MCP Setup | Auto-Restart |
|--------|--------|-----------|--------------|
| **🎯 Cursor** | ✅ Fully Supported | Automatic (programmatic API) | ✅ Built-in |
| **🌊 Windsurf** | ✅ Fully Supported | Automatic (config file) | ✅ Custom Monitor |
| **🍐 PearAI** | 🚧 Coming Soon | - | - |
| **🚀 Trae** | 🚧 Coming Soon | - | - |

**One VSIX, Multiple Editors!** Install once, works in Cursor and Windsurf.

---

## 🌟 Why Developers Choose Auxly

### **AI That Asks, Not Assumes**
No more buried questions in chat. AI asks via **interactive popups with sound alerts** - you'll never miss an important question again.

### **Quality Built-In**
- **🔬 Forced Dual Research**: AI MUST research both Technical (code patterns, security) AND Business (market fit, ROI) before coding
- **✅ Smart Approvals**: AI requests permission for database changes, API modifications, and architecture decisions
- **📋 Complete Audit Trail**: Every change, decision, and question logged for full transparency

### **Effortless Integration**
- **MCP Auto-Registers**: Zero configuration - works immediately after install
- **Status Bar Quick Access**: One-click to your dashboard
- **Cursor Rules Auto-Deploy**: Best practices enforced automatically

---

## 🚀 Core Features

### 🔔 **AI Question System**
- Interactive popups with sound alerts (no more missed questions!)
- Copy prompt button to wake up AI after answering
- Visual and audio notifications when AI needs input

### 🔬 **Dual Research Protocol** (FORCED)
AI must conduct BOTH before coding:
1. **Technical Research**: Code patterns, libraries, security, performance
2. **Business Research**: Market analysis, user needs, ROI, business value

### ✅ **Smart Approval Workflows**
AI requests approval for:
- Database schema changes
- API contract modifications
- Security implementations
- Architecture refactoring
- Breaking changes

### 📊 **Advanced Task Management**
- Beautiful Kanban board (To Do, In Progress, Review, Done)
- File change tracking with clickable paths
- Research entries with verified sources
- Comments system (notes, results, manual setup instructions)
- AI working indicator (see what AI is actively working on)

### **🎯 Auto-Generate Workflow Rules**
Auxly automatically creates and maintains editor-specific rules that enforce:
- Mandatory research protocol
- Approval workflows for critical changes
- Task-based development workflow
- Quality standards and best practices

**Cursor**: `.cursor/rules/` (7 .mdc files)
**Windsurf**: `.windsurf/rules/` (7 .md files with always_on triggers)

---

## 📦 Installation

### For Cursor Users:
1. Open Cursor Extensions (Ctrl+Shift+X)
2. Search for "**Auxly by Tzamun**"
3. Click **Install**
4. **Done!** MCP auto-registers automatically

### For Windsurf Users:
1. Download the `.vsix` file from [releases](https://github.com/Tzamun-Arabia-IT-Co/auxly-namespace/releases)
2. Open Windsurf Extensions (Ctrl+Shift+X)
3. Click "Install from VSIX..." (⋯ menu at top right)
4. Select the downloaded `.vsix` file
5. **Window will reload automatically** to activate MCP tools
6. **Done!** Dashboard opens and you can enter your API key

**Note:** Windsurf requires a window reload after installation to activate MCP tools and workflow rules. After the reload, **MCP auto-restart is enabled** - no more manual reloads needed!

### 🔄 Windsurf Auto-Restart Feature
Unlike Cursor which manages MCP processes automatically, Windsurf previously required window reloads when the MCP process crashed. **We've fixed this!**

**How it works:**
- Extension monitors MCP server health every 15 seconds
- If process dies, it automatically restarts within 15 seconds
- No manual window reloads needed (except for initial setup)
- You'll see: "✅ Auxly MCP server restarted automatically"

**Learn more:** See `docs/windsurf-mcp-auto-restart.md` and `docs/windsurf-mcp-quick-start.md`

---

## 🎯 Getting Started

1. **Click** the Auxly icon in sidebar or `📋 Auxly` in status bar
2. **Connect** with API Key (get yours at [auxly.tzamun.com](https://auxly.tzamun.com))
3. **Create Tasks** using the "+" button
4. **Let AI Work** - it will ask questions via popups when needed!

---

## 💎 How Auxly Helps Developers

### **⏱️ Save Time**
- AI handles repetitive tasks while asking only what matters
- Pre-built approval workflows prevent mistakes
- Automatic research saves hours of documentation reading

### **📈 Improve Quality**
- Forced dual research ensures well-informed decisions
- Approval gates prevent breaking changes
- Complete audit trail for debugging and review

### **🧠 Reduce Cognitive Load**
- AI tracks context and progress for you
- Visual dashboard shows what's in flight
- Sound alerts mean you don't need to watch chat constantly

### **🤝 Better Collaboration**
- Questions logged in task history for team visibility
- File changes tracked with descriptions
- Research findings shared across team

---

## 🎨 Key Commands

| Command | Description |
|---------|-------------|
| `Auxly: Connect with API Key` | Connect to backend |
| `Auxly: Create Task` | Create new task |
| `Auxly: Open Dashboard` | Open task board |
| `Auxly: Generate Cursor Rules` | Auto-generate quality rules |

---

## 🎉 What Makes Auxly Different?

| Feature | Traditional AI | Auxly |
|---------|---------------|-------|
| **Questions** | Buried in chat | Interactive popups + sound |
| **Research** | Optional | FORCED (Technical + Business) |
| **Approvals** | None | Smart workflows for critical changes |
| **Audit Trail** | Minimal | Complete (changes, research, Q&A) |
| **Integration** | Manual setup | Auto-registers MCP |


Get your API key at [auxly.tzamun.com](https://auxly.tzamun.com)

---

## 📚 Support & Resources

- **📧 Email**: support@tzamun.com
- **🌐 Website**: [auxly.tzamun.com](https://auxly.tzamun.com)
- **📖 Documentation**: [auxly.tzamun.com/docs](https://auxly.tzamun.com/docs)

---

**Made in Saudi Arabia 🇸🇦 with ❤️ for developers**

**© 2025 Tzamun Arabia IT Co.**
