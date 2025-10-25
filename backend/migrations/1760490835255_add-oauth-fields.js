exports.up = (pgm) => {
  // Add OAuth provider and OAuth ID columns to users table
  pgm.addColumns('users', {
    oauth_provider: {
      type: 'varchar(50)',
      notNull: false,
    },
    oauth_id: {
      type: 'varchar(255)',
      notNull: false,
    },
  });

  // Create index for faster OAuth lookups
  pgm.createIndex('users', ['oauth_provider', 'oauth_id']);
  
  // Make password_hash nullable for OAuth users
  pgm.alterColumn('users', 'password_hash', {
    notNull: false,
  });
};

exports.down = (pgm) => {
  // Remove OAuth columns
  pgm.dropColumns('users', ['oauth_provider', 'oauth_id']);
  
  // Restore password_hash NOT NULL constraint
  pgm.alterColumn('users', 'password_hash', {
    notNull: true,
  });
};
