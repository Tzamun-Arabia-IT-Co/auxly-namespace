"use strict";
/**
 * Local Configuration Service
 * Manages workspace-specific config in .auxly/config.json
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
exports.LocalConfigService = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LocalConfigService {
    constructor() {
        this.configFile = '';
        this.config = null;
    }
    static getInstance() {
        if (!LocalConfigService.instance) {
            LocalConfigService.instance = new LocalConfigService();
        }
        return LocalConfigService.instance;
    }
    /**
     * Initialize config in workspace .auxly directory
     */
    async initialize() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }
        const storageDir = path.join(workspaceFolder.uri.fsPath, '.auxly');
        this.configFile = path.join(storageDir, 'config.json');
        // Create .auxly directory if it doesn't exist
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
            console.log('✅ Created .auxly directory for config');
        }
        // Load existing config or create new one
        await this.loadConfig();
        console.log('✅ Config initialized');
    }
    /**
     * Load config from file
     */
    async loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = fs.readFileSync(this.configFile, 'utf-8');
                this.config = JSON.parse(data);
                console.log('📂 Loaded config from .auxly/config.json');
            }
            else {
                // Create new config file
                this.config = {
                    lastUpdated: new Date().toISOString(),
                    version: '1.0.0'
                };
                await this.saveConfig();
                console.log('📂 Created new config file');
            }
        }
        catch (error) {
            console.error('❌ Error loading config:', error);
            this.config = {
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            };
        }
    }
    /**
     * Save config to file
     */
    async saveConfig() {
        try {
            if (!this.config) {
                throw new Error('Config not initialized');
            }
            this.config.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), 'utf-8');
            console.log('💾 Saved config to .auxly/config.json');
        }
        catch (error) {
            console.error('❌ Error saving config:', error);
            throw error;
        }
    }
    /**
     * Get API key
     */
    async getApiKey() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config?.apiKey || null;
    }
    /**
     * Store API key
     */
    async setApiKey(apiKey) {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            this.config.apiKey = apiKey;
            await this.saveConfig();
            console.log('✅ API key saved to .auxly/config.json');
            vscode.window.showInformationMessage('✅ API key saved to .auxly/config.json');
        }
    }
    /**
     * Clear API key
     */
    async clearApiKey() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            delete this.config.apiKey;
            await this.saveConfig();
            console.log('🗑️ API key cleared from config');
        }
    }
    /**
     * Get API URL
     */
    async getApiUrl() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config?.apiUrl || 'https://auxly.tzamun.com:8000';
    }
    /**
     * Set API URL
     */
    async setApiUrl(apiUrl) {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            this.config.apiUrl = apiUrl;
            await this.saveConfig();
            console.log('✅ API URL saved to config');
        }
    }
    /**
     * Get full config
     */
    async getConfig() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config;
    }
    /**
     * Check if API key exists
     */
    async hasApiKey() {
        const apiKey = await this.getApiKey();
        return !!apiKey;
    }
    /**
     * Initialize free trial (30 days from now)
     */
    async initializeTrial() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config && !this.config.trial) {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
            this.config.trial = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                status: 'active',
                daysRemaining: 30
            };
            await this.saveConfig();
            console.log('🎉 Free trial initialized - 30 days from now');
            console.log(`📅 Trial ends: ${endDate.toLocaleDateString()}`);
        }
    }
    /**
     * Get trial information with calculated days remaining
     */
    async getTrialInfo() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (!this.config?.trial) {
            // No trial info - first launch, initialize it
            await this.initializeTrial();
            if (!this.config?.trial) {
                return null;
            }
        }
        const trial = this.config.trial;
        const endDate = new Date(trial.endDate);
        const now = new Date();
        const msRemaining = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
        // Update status based on expiry
        if (daysRemaining <= 0 && trial.status === 'active') {
            trial.status = 'expired';
            await this.saveConfig();
        }
        return {
            status: trial.status,
            daysRemaining: Math.max(0, daysRemaining),
            endDate: endDate
        };
    }
    /**
     * Check if trial is expired
     */
    async isTrialExpired() {
        const trialInfo = await this.getTrialInfo();
        return trialInfo ? trialInfo.status === 'expired' : false;
    }
    /**
     * Check if user has valid access (trial active or has API key)
     */
    async hasValidAccess() {
        const hasKey = await this.hasApiKey();
        if (hasKey) {
            return true; // API key = upgraded, always valid
        }
        const trialInfo = await this.getTrialInfo();
        return trialInfo ? (trialInfo.status === 'active' && trialInfo.daysRemaining > 0) : false;
    }
    /**
     * Upgrade trial to paid (when user enters API key)
     */
    async upgradeTrial() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config?.trial) {
            this.config.trial.status = 'upgraded';
            await this.saveConfig();
            console.log('🎉 Trial upgraded to paid plan!');
        }
    }
    /**
     * Reset trial (for testing purposes only)
     */
    async resetTrial() {
        if (!this.config) {
            await this.loadConfig();
        }
        if (this.config) {
            delete this.config.trial;
            await this.saveConfig();
            await this.initializeTrial();
            console.log('🔄 Trial reset - 30 days restarted');
        }
    }
    /**
     * Sync trial with backend (Hybrid approach)
     */
    async syncTrialWithBackend() {
        try {
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                console.log('📴 No API key - skipping server sync');
                return;
            }
            const apiUrl = await this.getApiUrl();
            console.log('🔄 Syncing trial with backend...');
            const response = await fetch(`${apiUrl}/trial/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            });
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const serverTrial = await response.json();
            // Update local config with server truth
            if (this.config) {
                this.config.trial = {
                    startDate: serverTrial.trial_start,
                    endDate: serverTrial.trial_end,
                    status: serverTrial.status,
                    daysRemaining: serverTrial.days_remaining
                };
                this.config.lastServerSync = new Date().toISOString();
                this.config.lastServerSyncSuccess = true;
                // Clear grace period if sync successful
                delete this.config.offlineGracePeriodStart;
                await this.saveConfig();
                console.log('✅ Trial synced with backend:', serverTrial);
            }
        }
        catch (error) {
            console.error('❌ Failed to sync with backend:', error);
            if (this.config) {
                this.config.lastServerSyncSuccess = false;
                // Start grace period if not already started
                if (!this.config.offlineGracePeriodStart) {
                    this.config.offlineGracePeriodStart = new Date().toISOString();
                    console.log('⏰ Started 24-hour grace period');
                }
                await this.saveConfig();
            }
            // Don't throw - graceful degradation
        }
    }
    /**
     * Check if we should sync with server
     */
    shouldSyncWithServer() {
        if (!this.config) {
            return true; // Never synced
        }
        if (!this.config.lastServerSync) {
            return true; // Never synced
        }
        const lastSync = new Date(this.config.lastServerSync);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        return hoursSinceSync >= 1; // Sync every 1 hour
    }
    /**
     * Check if grace period has expired (24 hours)
     */
    isGracePeriodExpired() {
        if (!this.config?.offlineGracePeriodStart) {
            return false; // No grace period started
        }
        const gracePeriodStart = new Date(this.config.offlineGracePeriodStart);
        const now = new Date();
        const hoursSinceStart = (now.getTime() - gracePeriodStart.getTime()) / (1000 * 60 * 60);
        return hoursSinceStart >= 24; // 24-hour grace period
    }
    /**
     * Get trial info with hybrid sync
     */
    async getTrialInfoHybrid() {
        // Get local trial first (fast)
        const localTrial = await this.getTrialInfo();
        // Check if we have API key and should sync
        const hasKey = await this.hasApiKey();
        if (hasKey && this.shouldSyncWithServer()) {
            // Sync in background (non-blocking)
            this.syncTrialWithBackend().catch(err => {
                console.warn('Background sync failed:', err);
            });
        }
        // Check grace period if backend sync failed
        if (this.config?.lastServerSyncSuccess === false) {
            if (this.isGracePeriodExpired()) {
                console.warn('⏰ Grace period expired - marking trial as expired');
                if (this.config.trial) {
                    this.config.trial.status = 'expired';
                    await this.saveConfig();
                }
                return {
                    status: 'expired',
                    daysRemaining: 0,
                    endDate: new Date(this.config.trial?.endDate || new Date())
                };
            }
            else {
                console.log('⏰ Within grace period - continuing offline');
            }
        }
        return localTrial;
    }
    /**
     * Force immediate sync (e.g., user clicks "Sync Now")
     */
    async forceSyncTrial() {
        await this.syncTrialWithBackend();
        vscode.window.showInformationMessage('✅ Trial status synced with server');
    }
}
exports.LocalConfigService = LocalConfigService;
//# sourceMappingURL=local-config.js.map