/**
 * Migration: Add admin role to users
 */

exports.up = (pgm) => {
  // Check and add columns only if they don't exist
  pgm.addColumns('users', {
    is_admin: {
      type: 'boolean',
      notNull: true,
      default: false,
      ifNotExists: true
    },
    is_blocked: {
      type: 'boolean',
      notNull: true,
      default: false,
      ifNotExists: true
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['is_admin', 'is_blocked'], { ifExists: true });
};


