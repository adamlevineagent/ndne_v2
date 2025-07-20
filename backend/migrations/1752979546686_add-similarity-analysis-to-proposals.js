/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Add similarity_analysis column to proposals table
  pgm.addColumn('proposals', {
    similarity_analysis: {
      type: 'jsonb',
      default: '{}'
    }
  });
};

exports.down = pgm => {
  pgm.dropColumn('proposals', 'similarity_analysis');
};
