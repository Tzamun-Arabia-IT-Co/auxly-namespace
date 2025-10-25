export interface TrialInfo {
    trial_start: Date | null;
    trial_end: Date | null;
    trial_status: 'active' | 'expired' | 'upgraded';
    days_remaining: number;
}
/**
 * Get trial information for a user
 */
export declare function getTrialInfo(userId: number): Promise<TrialInfo | null>;
/**
 * Initialize trial for a new user
 */
export declare function initializeTrial(userId: number): Promise<TrialInfo>;
/**
 * Upgrade trial to paid plan
 */
export declare function upgradeTrial(userId: number): Promise<void>;
/**
 * Check if user has valid access (trial active OR subscription active)
 */
export declare function hasValidAccess(userId: number): Promise<boolean>;
//# sourceMappingURL=trial.service.d.ts.map