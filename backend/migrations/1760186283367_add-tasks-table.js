/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create tasks table
  pgm.createTable('tasks', {
    id: {
      type: 'varchar(21)',
      primaryKey: true,
      notNull: true,
    },
    user_id: {
      type: 'varchar(21)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'todo',
      check: "status IN ('todo', 'in_progress', 'review', 'done')",
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
      default: 'medium',
      check: "priority IN ('low', 'medium', 'high', 'critical')",
    },
    tags: {
      type: 'jsonb',
      notNull: true,
      default: '[]',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create index on user_id for faster queries
  pgm.createIndex('tasks', 'user_id');

  // Create index on status for filtering
  pgm.createIndex('tasks', 'status');

  // Create index on priority for sorting
  pgm.createIndex('tasks', 'priority');

  // Create index on created_at for sorting
  pgm.createIndex('tasks', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('tasks');
};
