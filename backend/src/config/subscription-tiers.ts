// Subscription tier configuration for Auxly

export interface TierFeatures {
  tasks_per_month: number;
  workspaces: number;
  history_days: number;
  team_features?: boolean;
  priority_support?: boolean;
}

export interface TierConfig {
  name: string;
  price: number; // USD per month
  stripe_price_id?: string;
  features: TierFeatures;
}

export const SUBSCRIPTION_TIERS: Record<string, TierConfig> = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      tasks_per_month: 50,
      workspaces: 1,
      history_days: 7,
    },
  },
  pro: {
    name: 'Pro',
    price: 9,
    stripe_price_id: process.env.STRIPE_PRICE_PRO,
    features: {
      tasks_per_month: Infinity,
      workspaces: Infinity,
      history_days: 30,
      priority_support: true,
    },
  },
  team: {
    name: 'Team',
    price: 29,
    stripe_price_id: process.env.STRIPE_PRICE_TEAM,
    features: {
      tasks_per_month: Infinity,
      workspaces: Infinity,
      history_days: Infinity,
      team_features: true,
      priority_support: true,
    },
  },
};

// Map Stripe price IDs to internal tier names
export const getPlanTierFromPriceId = (priceId: string): string | null => {
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.stripe_price_id === priceId) {
      return tier;
    }
  }
  return null;
};

// Get tier configuration
export const getTierConfig = (tier: string): TierConfig => {
  return SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
};


