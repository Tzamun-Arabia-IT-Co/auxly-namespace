/**
 * Add trial tracking columns to users table
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Add trial columns to users table
  pgm.addColumns('users', {
    trial_start: {
      type: 'timestamptz',
      comment: 'Trial start date (30-day free trial)',
    },
    trial_end: {
      type: 'timestamptz',
      comment: 'Trial end date (trial_start + 30 days)',
    },
    trial_status: {
      type: 'varchar(20)',
      default: 'active',
      check: "trial_status IN ('active', 'expired', 'upgraded')",
      comment: 'Trial status: active=in trial, expired=trial ended, upgraded=has paid plan',
    },
  });

  // Create index for trial queries
  pgm.createIndex('users', ['trial_status', 'trial_end']);
  
  // Set default trial for existing users (30 days from now)
  pgm.sql(`
    UPDATE users 
    SET 
      trial_start = NOW(),
      trial_end = NOW() + INTERVAL '30 days',
      trial_status = 'active'
    WHERE trial_start IS NULL
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop index
  pgm.dropIndex('users', ['trial_status', 'trial_end']);
  
  // Drop columns
  pgm.dropColumns('users', ['trial_start', 'trial_end', 'trial_status']);
};

