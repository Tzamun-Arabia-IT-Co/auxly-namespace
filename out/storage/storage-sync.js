"use strict";
/**
 * Storage Sync Utility
 * Syncs MCP storage (hash-based) with extension storage (workspace-based)
 * Fixes the bug where tasks created via MCP don't appear in extension UI
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageSync = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
class StorageSync {
    /**
     * Generate workspace hash (same algorithm as MCP)
     */
    static generateWorkspaceHash(workspacePath) {
        return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
    }
    /**
     * Get MCP storage path
     */
    static getMCPStoragePath(workspacePath) {
        const hash = this.generateWorkspaceHash(workspacePath);
        return path.join(os.homedir(), hash, '.auxly', 'tasks.json');
    }
    /**
     * Get extension storage path
     */
    static getExtensionStoragePath(workspacePath) {
        return path.join(workspacePath, '.auxly', 'tasks.json');
    }
    /**
     * Sync MCP storage to extension storage
     */
    static syncMCPToExtension(workspacePath) {
        try {
            const mcpPath = this.getMCPStoragePath(workspacePath);
            const extPath = this.getExtensionStoragePath(workspacePath);
            console.log('[StorageSync] 🔄 Syncing MCP → Extension');
            console.log('[StorageSync]   MCP path:', mcpPath);
            console.log('[StorageSync]   Ext path:', extPath);
            // Check if MCP storage exists
            if (!fs.existsSync(mcpPath)) {
                console.log('[StorageSync] ⚠️ MCP storage not found, skipping sync');
                return false;
            }
            // Read MCP storage
            const mcpData = fs.readFileSync(mcpPath, 'utf-8');
            const mcpStorage = JSON.parse(mcpData);
            // Check if extension storage exists
            if (!fs.existsSync(extPath)) {
                console.log('[StorageSync] ⚠️ Extension storage not found, creating from MCP');
                const extDir = path.dirname(extPath);
                if (!fs.existsSync(extDir)) {
                    fs.mkdirSync(extDir, { recursive: true });
                }
                fs.writeFileSync(extPath, mcpData, 'utf-8');
                console.log('[StorageSync] ✅ Created extension storage from MCP');
                return true;
            }
            // Read extension storage
            const extData = fs.readFileSync(extPath, 'utf-8');
            const extStorage = JSON.parse(extData);
            // Compare timestamps
            const mcpTime = new Date(mcpStorage.lastModified || 0).getTime();
            const extTime = new Date(extStorage.lastModified || 0).getTime();
            console.log('[StorageSync]   MCP last modified:', new Date(mcpTime).toISOString());
            console.log('[StorageSync]   Ext last modified:', new Date(extTime).toISOString());
            // If MCP is newer, sync to extension
            if (mcpTime > extTime || mcpStorage.tasks.length !== extStorage.tasks.length) {
                console.log('[StorageSync] 📋 MCP is newer or has different task count, syncing...');
                fs.writeFileSync(extPath, mcpData, 'utf-8');
                console.log('[StorageSync] ✅ Synced MCP → Extension');
                return true;
            }
            else {
                console.log('[StorageSync] ✅ Storage already in sync');
                return false;
            }
        }
        catch (error) {
            console.error('[StorageSync] ❌ Sync failed:', error);
            return false;
        }
    }
    /**
     * Start watching MCP storage for changes
     */
    static startWatching(workspacePath, onSync) {
        if (this.watcherInterval) {
            console.log('[StorageSync] ⚠️ Watcher already running');
            return;
        }
        const mcpPath = this.getMCPStoragePath(workspacePath);
        let lastSize = -1;
        console.log('[StorageSync] 👀 Starting MCP storage watcher (5s interval)');
        this.watcherInterval = setInterval(() => {
            try {
                if (fs.existsSync(mcpPath)) {
                    const stats = fs.statSync(mcpPath);
                    const currentSize = stats.size;
                    if (lastSize !== -1 && currentSize !== lastSize) {
                        console.log('[StorageSync] 🔔 MCP storage changed, syncing...');
                        const synced = this.syncMCPToExtension(workspacePath);
                        if (synced) {
                            onSync();
                        }
                    }
                    lastSize = currentSize;
                }
            }
            catch (error) {
                console.error('[StorageSync] ❌ Watcher error:', error);
            }
        }, 5000); // Check every 5 seconds
        console.log('[StorageSync] ✅ Watcher started');
    }
    /**
     * Stop watching
     */
    static stopWatching() {
        if (this.watcherInterval) {
            clearInterval(this.watcherInterval);
            this.watcherInterval = null;
            console.log('[StorageSync] ⏹️ Watcher stopped');
        }
    }
}
exports.StorageSync = StorageSync;
StorageSync.watcherInterval = null;
//# sourceMappingURL=storage-sync.js.map