/**
 * Migration: Add usage_logs table for tracking API usage
 */

exports.up = (pgm) => {
  // Create usage_logs table
  pgm.createTable('usage_logs', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    api_key_id: {
      type: 'integer',
      references: 'api_keys(id)',
      onDelete: 'CASCADE',
    },
    endpoint: {
      type: 'varchar(255)',
    },
    method: {
      type: 'varchar(10)',
    },
    status_code: {
      type: 'integer',
    },
    response_time_ms: {
      type: 'integer',
    },
    timestamp: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for performance
  pgm.createIndex('usage_logs', 'user_id');
  pgm.createIndex('usage_logs', 'api_key_id');
  pgm.createIndex('usage_logs', 'timestamp');
  pgm.createIndex('usage_logs', ['user_id', 'timestamp']);
};

exports.down = (pgm) => {
  pgm.dropTable('usage_logs');
};

