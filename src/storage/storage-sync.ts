/**
 * Storage Sync Utility
 * Syncs MCP storage (hash-based) with extension storage (workspace-based)
 * Fixes the bug where tasks created via MCP don't appear in extension UI
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export class StorageSync {
    private static watcherInterval: NodeJS.Timeout | null = null;

    /**
     * Generate workspace hash (same algorithm as MCP)
     */
    static generateWorkspaceHash(workspacePath: string): string {
        return crypto.createHash('md5').update(workspacePath).digest('hex').substring(0, 8);
    }

    /**
     * Get MCP storage path
     */
    static getMCPStoragePath(workspacePath: string): string {
        const hash = this.generateWorkspaceHash(workspacePath);
        return path.join(os.homedir(), hash, '.auxly', 'tasks.json');
    }

    /**
     * Get extension storage path
     */
    static getExtensionStoragePath(workspacePath: string): string {
        return path.join(workspacePath, '.auxly', 'tasks.json');
    }

    /**
     * Sync MCP storage to extension storage
     */
    static syncMCPToExtension(workspacePath: string): boolean {
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
            } else {
                console.log('[StorageSync] ✅ Storage already in sync');
                return false;
            }
        } catch (error) {
            console.error('[StorageSync] ❌ Sync failed:', error);
            return false;
        }
    }

    /**
     * Start watching MCP storage for changes
     */
    static startWatching(workspacePath: string, onSync: () => void): void {
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
            } catch (error) {
                console.error('[StorageSync] ❌ Watcher error:', error);
            }
        }, 5000); // Check every 5 seconds

        console.log('[StorageSync] ✅ Watcher started');
    }

    /**
     * Stop watching
     */
    static stopWatching(): void {
        if (this.watcherInterval) {
            clearInterval(this.watcherInterval);
            this.watcherInterval = null;
            console.log('[StorageSync] ⏹️ Watcher stopped');
        }
    }
}

