/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Enable UUID extension
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  // Users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    api_key: {
      type: 'varchar(255)',
      comment: 'User\'s OpenRouter API key for enhanced features'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // Outcomes table
  pgm.createTable('outcomes', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    statement: {
      type: 'text',
      notNull: true
    },
    importance: {
      type: 'integer',
      notNull: true,
      check: 'importance >= 1 AND importance <= 5'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // Proposals table
  pgm.createTable('proposals', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    title: {
      type: 'varchar(500)',
      notNull: true
    },
    description: {
      type: 'text',
      notNull: true
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // Reactions table
  pgm.createTable('reactions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    proposal_id: {
      type: 'uuid',
      notNull: true,
      references: 'proposals(id)',
      onDelete: 'CASCADE'
    },
    response: {
      type: 'varchar(10)',
      notNull: true,
      check: 'response IN (\'like\', \'dislike\')'
    },
    comment: {
      type: 'text'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // Proposal users junction table
  pgm.createTable('proposal_users', {
    proposal_id: {
      type: 'uuid',
      notNull: true,
      references: 'proposals(id)',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    }
  });

  // Conversations table
  pgm.createTable('conversations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    messages: {
      type: 'jsonb',
      notNull: true,
      comment: 'Array of {role: "user"|"assistant", content: string}'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // Add unique constraint for user-proposal reactions
  pgm.addConstraint('reactions', 'unique_user_proposal_reaction', {
    unique: ['user_id', 'proposal_id']
  });

  // Add primary key for proposal_users junction table
  pgm.addConstraint('proposal_users', 'proposal_users_pkey', {
    primaryKey: ['proposal_id', 'user_id']
  });

  // Add indexes for performance
  pgm.createIndex('outcomes', 'user_id');
  pgm.createIndex('reactions', 'user_id');
  pgm.createIndex('reactions', 'proposal_id');
  pgm.createIndex('conversations', 'user_id');
  pgm.createIndex('proposal_users', 'proposal_id');
  pgm.createIndex('proposal_users', 'user_id');
};

exports.down = pgm => {
  pgm.dropTable('conversations');
  pgm.dropTable('proposal_users');
  pgm.dropTable('reactions');
  pgm.dropTable('proposals');
  pgm.dropTable('outcomes');
  pgm.dropTable('users');
  pgm.dropExtension('pgcrypto');
};