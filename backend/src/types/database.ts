// Database model types for Auxly

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_tier: 'free' | 'pro' | 'team';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_end?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: number;
  user_id: number;
  key_hash: string;
  name?: string;
  last_used?: Date;
  revoked: boolean;
  created_at: Date;
}

export interface UsageLog {
  id: number;
  api_key_id: number;
  user_id: number;
  action_type: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// User creation input (without auto-generated fields)
export interface CreateUserInput {
  email: string;
  password_hash: string;
}

// Subscription creation input
export interface CreateSubscriptionInput {
  user_id: number;
  plan_tier?: 'free' | 'pro' | 'team';
  status?: 'active' | 'canceled' | 'past_due' | 'trialing';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_end?: Date;
}

// API Key creation input
export interface CreateApiKeyInput {
  user_id: number;
  key_hash: string;
  name?: string;
}

// Usage log creation input
export interface CreateUsageLogInput {
  api_key_id: number;
  user_id: number;
  action_type: string;
  metadata?: Record<string, any>;
}

