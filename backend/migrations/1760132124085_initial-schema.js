/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Create users table
  pgm.createTable('users', {
    id: 'id', // Auto-incrementing primary key
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create index on email for fast lookups
  pgm.createIndex('users', 'email');

  // Create subscriptions table
  pgm.createTable('subscriptions', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    plan_tier: {
      type: 'varchar(50)',
      notNull: true,
      default: 'free',
      check: "plan_tier IN ('free', 'pro', 'team')",
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'active',
      check: "status IN ('active', 'canceled', 'past_due', 'trialing')",
    },
    stripe_subscription_id: {
      type: 'varchar(255)',
      unique: true,
    },
    stripe_customer_id: {
      type: 'varchar(255)',
    },
    current_period_end: {
      type: 'timestamptz',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for subscriptions
  pgm.createIndex('subscriptions', 'user_id');
  pgm.createIndex('subscriptions', 'stripe_subscription_id');

  // Create api_keys table
  pgm.createTable('api_keys', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    key_hash: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    name: {
      type: 'varchar(100)',
    },
    last_used: {
      type: 'timestamptz',
    },
    revoked: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for api_keys
  pgm.createIndex('api_keys', 'user_id');
  pgm.createIndex('api_keys', 'key_hash');

  // Create usage_logs table
  pgm.createTable('usage_logs', {
    id: 'id',
    api_key_id: {
      type: 'integer',
      notNull: true,
      references: 'api_keys(id)',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    action_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    metadata: {
      type: 'jsonb',
    },
    timestamp: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create composite index for fast usage queries (rate limiting)
  pgm.createIndex('usage_logs', ['api_key_id', 'timestamp']);
  pgm.createIndex('usage_logs', ['user_id', 'timestamp']);

  // Create updated_at trigger function for subscriptions
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `
  );

  // Apply trigger to subscriptions table
  pgm.createTrigger('subscriptions', 'update_subscriptions_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop tables in reverse order (respect foreign keys)
  pgm.dropTable('usage_logs');
  pgm.dropTable('api_keys');
  pgm.dropTable('subscriptions');
  pgm.dropTable('users');
  
  // Drop trigger and function
  pgm.dropFunction('update_updated_at_column', [], { ifExists: true, cascade: true });
};
