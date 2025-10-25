export interface TierFeatures {
    tasks_per_month: number;
    workspaces: number;
    history_days: number;
    team_features?: boolean;
    priority_support?: boolean;
}
export interface TierConfig {
    name: string;
    price: number;
    stripe_price_id?: string;
    features: TierFeatures;
}
export declare const SUBSCRIPTION_TIERS: Record<string, TierConfig>;
export declare const getPlanTierFromPriceId: (priceId: string) => string | null;
export declare const getTierConfig: (tier: string) => TierConfig;
//# sourceMappingURL=subscription-tiers.d.ts.map