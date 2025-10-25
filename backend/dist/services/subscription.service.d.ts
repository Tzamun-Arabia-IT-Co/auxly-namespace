export interface SubscriptionStatus {
    plan_tier: string;
    status: string;
    current_period_end?: Date;
    features: {
        tasks_per_month: number;
        workspaces: number;
        history_days: number;
        team_features?: boolean;
        priority_support?: boolean;
    };
}
/**
 * Get user's subscription status
 */
export declare const getUserSubscription: (userId: number) => Promise<SubscriptionStatus>;
/**
 * Update subscription from Stripe webhook data
 */
export declare const updateSubscriptionFromStripe: (stripeSubscriptionId: string, data: {
    customer_id: string;
    plan_tier: string;
    status: string;
    current_period_end?: Date;
}) => Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Cancel subscription (mark as canceled)
 */
export declare const cancelSubscription: (stripeSubscriptionId: string) => Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Check if user has access to a feature
 */
export declare const hasFeatureAccess: (userId: number, feature: string) => Promise<boolean>;
/**
 * Get usage limits for user
 */
export declare const getUsageLimits: (userId: number) => Promise<{
    tasks_per_month: number;
    workspaces: number;
    history_days: number;
}>;
//# sourceMappingURL=subscription.service.d.ts.map