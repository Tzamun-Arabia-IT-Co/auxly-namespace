# Auxly

> **AI Agent Task Management for Developers**

Auxly is a powerful AI-driven task management extension for Cursor and VSCode that enables AI agents to interact with developers through an intuitive task board, interactive questions, and approval workflows.

---

## 🎯 What is Auxly?

Auxly transforms how AI agents collaborate with developers by providing:

- **📋 Smart Task Management** - AI agents create, update, and track tasks with full context
- **❓ Interactive Questions** - AI asks clarifying questions with multiple choice, file pickers, and more
- **✅ Approval Workflows** - Review and approve AI-generated implementation plans before execution
- **📝 Research Notes** - AI documents findings and research with automatic linking
- **🔄 Real-time Sync** - Tasks sync across workspace and web dashboard

---

## 🏗️ Architecture

Auxly consists of three integrated components:

### 1. **Cursor/VSCode Extension**
- React-based webview UI with Kanban task board
- MCP (Model Context Protocol) server for AI agent integration
- Real-time task synchronization
- Interactive question modals and approval panels

### 2. **Web Dashboard**
- Next.js 14 landing page and user portal
- API key management
- Usage analytics and billing
- Subscription management via Stripe

### 3. **Backend API**
- Node.js + Express REST API
- PostgreSQL database
- JWT authentication
- Rate limiting by subscription tier
- Stripe webhook integration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/auxly.git
cd auxly

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Configure your .env file

# Run database migrations
npm run migrate

# Start backend server
npm run dev

# In another terminal, start extension development
cd ../extension
npm install
npm run dev
```

---

## 💎 Subscription Tiers

### **Free Tier**
- 50 tasks/month
- Basic questions (yes/no, text)
- Single workspace

### **Pro Tier - $9/month**
- Unlimited tasks
- All question types (multiple choice, file picker)
- Multiple workspaces
- Priority support
- 30-day task history

### **Team Tier - $29/month**
- Everything in Pro
- Shared workspaces
- Team analytics
- Unlimited history
- Custom integrations

---

## 🛠️ Tech Stack

**Extension:**
- TypeScript
- React
- VSCode Extension API
- MCP Protocol

**Web Dashboard:**
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Framer Motion

**Backend:**
- Node.js + Express
- PostgreSQL
- Stripe
- JWT Authentication

---

## 📋 Project Status

**Current Phase:** Initial Development
- [x] Project planning and architecture
- [x] Name selection (Auxly)
- [ ] Backend API implementation
- [ ] Database schema setup
- [ ] Extension core functionality
- [ ] Web dashboard development
- [ ] Stripe integration
- [ ] Beta testing

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🔗 Links

- **Website:** [auxly.ai](https://auxly.ai) *(coming soon)*
- **Documentation:** [docs.auxly.ai](https://docs.auxly.ai) *(coming soon)*
- **Support:** support@auxly.ai

---

**Built with ❤️ for developers who want AI agents that actually help**

