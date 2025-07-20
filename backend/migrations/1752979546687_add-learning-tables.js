/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Learning insights table - stores AI-generated insights about user preferences
  pgm.createTable('learning_insights', {
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
    type: {
      type: 'varchar(50)',
      notNull: true,
      check: 'type IN (\'outcome_refinement\', \'preference_pattern\', \'value_clarification\')'
    },
    insight: {
      type: 'text',
      notNull: true
    },
    confidence: {
      type: 'decimal(3,2)',
      notNull: true,
      check: 'confidence >= 0.0 AND confidence <= 1.0'
    },
    source_reactions: {
      type: 'jsonb',
      default: '[]',
      comment: 'Array of reaction IDs that contributed to this insight'
    },
    applied_to_outcomes: {
      type: 'jsonb',
      default: '[]',
      comment: 'Array of outcome IDs that were updated based on this insight'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // Collective patterns table - stores anonymized patterns across all users
  pgm.createTable('collective_patterns', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    pattern_type: {
      type: 'varchar(50)',
      notNull: true,
      check: 'pattern_type IN (\'shared_value\', \'common_concern\', \'solution_preference\')'
    },
    description: {
      type: 'text',
      notNull: true
    },
    affected_users: {
      type: 'jsonb',
      default: '[]',
      comment: 'Anonymized user references'
    },
    strength: {
      type: 'decimal(3,2)',
      notNull: true,
      check: 'strength >= 0.0 AND strength <= 1.0'
    },
    examples: {
      type: 'jsonb',
      default: '[]',
      comment: 'Example data supporting this pattern'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // User value profiles table - stores comprehensive user preference profiles
  pgm.createTable('user_value_profiles', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    core_values: {
      type: 'jsonb',
      default: '[]',
      comment: 'Array of core values identified for this user'
    },
    preference_patterns: {
      type: 'jsonb',
      default: '{}',
      comment: 'Object containing solution types, implementation preferences, tradeoff tolerance'
    },
    reaction_patterns: {
      type: 'jsonb',
      default: '{}',
      comment: 'Object containing positive/negative indicators and consistency score'
    },
    last_updated: {
      type: 'timestamp',
      default: pgm.func('NOW()')
    }
  });

  // Add missing columns to outcomes table for better learning support (if they don't exist)
  pgm.sql(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outcomes' AND column_name='extracted_from_conversation') THEN
        ALTER TABLE outcomes ADD COLUMN extracted_from_conversation boolean DEFAULT false;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outcomes' AND column_name='refinement_history') THEN
        ALTER TABLE outcomes ADD COLUMN refinement_history jsonb DEFAULT '[]';
        COMMENT ON COLUMN outcomes.refinement_history IS 'Array of refinement entries showing how outcome evolved';
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outcomes' AND column_name='updated_at') THEN
        ALTER TABLE outcomes ADD COLUMN updated_at timestamp DEFAULT NOW();
      END IF;
    END $$;
  `);

  // Add indexes for performance
  pgm.createIndex('learning_insights', 'user_id');
  pgm.createIndex('learning_insights', 'type');
  pgm.createIndex('learning_insights', 'confidence');
  pgm.createIndex('learning_insights', 'created_at');

  pgm.createIndex('collective_patterns', 'pattern_type');
  pgm.createIndex('collective_patterns', 'strength');
  pgm.createIndex('collective_patterns', 'created_at');

  pgm.createIndex('user_value_profiles', 'last_updated');

  pgm.createIndex('outcomes', 'extracted_from_conversation');
  pgm.createIndex('outcomes', 'updated_at');

  // Add trigger to update updated_at timestamp for outcomes
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_outcomes_updated_at 
        BEFORE UPDATE ON outcomes 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = pgm => {
  pgm.dropTrigger('outcomes', 'update_outcomes_updated_at');
  pgm.dropFunction('update_updated_at_column');
  
  pgm.dropColumn('outcomes', ['extracted_from_conversation', 'refinement_history', 'updated_at']);
  
  pgm.dropTable('user_value_profiles');
  pgm.dropTable('collective_patterns');
  pgm.dropTable('learning_insights');
};