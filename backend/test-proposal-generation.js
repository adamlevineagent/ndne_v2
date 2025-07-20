const axios = require('axios');
const pool = require('./dist/config/database.js').default;

const API_BASE = 'http://localhost:3000/api';

async function setupTestData() {
  console.log('Setting up test data...');
  
  try {
    // Create test users
    const user1Result = await pool.query(`
      INSERT INTO users (email, password_hash) 
      VALUES ('test1@example.com', 'hashedpassword1') 
      RETURNING id
    `);
    const user1Id = user1Result.rows[0].id;

    const user2Result = await pool.query(`
      INSERT INTO users (email, password_hash) 
      VALUES ('test2@example.com', 'hashedpassword2') 
      RETURNING id
    `);
    const user2Id = user2Result.rows[0].id;

    const user3Result = await pool.query(`
      INSERT INTO users (email, password_hash) 
      VALUES ('test3@example.com', 'hashedpassword3') 
      RETURNING id
    `);
    const user3Id = user3Result.rows[0].id;

    // Create test outcomes with similar themes
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where every child has access to quality education regardless of their family''s income', 5)
    `, [user1Id]);
    
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where educational opportunities are available to all children, not just the wealthy', 4)
    `, [user2Id]);
    
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where all students can get a good education without financial barriers', 4)
    `, [user3Id]);
    
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where healthcare is accessible and affordable for everyone', 5)
    `, [user1Id]);
    
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where people don''t go bankrupt from medical bills', 4)
    `, [user2Id]);

    console.log('Test data created successfully');
    return { user1Id, user2Id, user3Id };
  } catch (error) {
    console.error('Error setting up test data:', error.message);
    throw error;
  }
}

async function testProposalGeneration() {
  console.log('Testing proposal generation...');
  
  try {
    // First, let's check if we have outcomes
    const outcomesResult = await pool.query('SELECT COUNT(*) as count FROM outcomes');
    console.log(`Found ${outcomesResult.rows[0].count} outcomes in database`);

    if (outcomesResult.rows[0].count < 2) {
      console.log('Not enough outcomes for testing, setting up test data...');
      await setupTestData();
    }

    // Test the proposal service directly
    const { ProposalService } = require('./dist/services/proposal.js');
    const proposalService = new ProposalService(pool);

    console.log('Generating proposals...');
    const proposals = await proposalService.generateProposals({
      minSimilarityScore: 0.5,
      maxUsers: 5
    });

    console.log(`Generated ${proposals.length} proposals:`);
    proposals.forEach((proposal, index) => {
      console.log(`\n--- Proposal ${index + 1} ---`);
      console.log(`Title: ${proposal.title}`);
      console.log(`Description: ${proposal.description.substring(0, 200)}...`);
      console.log(`Contributing Users: ${proposal.contributingUsers.length}`);
      console.log(`Shared Themes: ${proposal.similarityAnalysis.sharedThemes?.join(', ') || 'None'}`);
      console.log(`Similarity Score: ${proposal.similarityAnalysis.overallSimilarityScore?.toFixed(2) || 'N/A'}`);
    });

    return proposals;
  } catch (error) {
    console.error('Error testing proposal generation:', error.message);
    throw error;
  }
}

async function cleanupTestData() {
  console.log('Cleaning up test data...');
  try {
    await pool.query('DELETE FROM proposal_users');
    await pool.query('DELETE FROM proposals');
    await pool.query('DELETE FROM outcomes');
    await pool.query('DELETE FROM users WHERE email LIKE \'test%@example.com\'');
    console.log('Test data cleaned up');
  } catch (error) {
    console.error('Error cleaning up:', error.message);
  }
}

async function main() {
  try {
    await testProposalGeneration();
    console.log('\n✅ Proposal generation test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await cleanupTestData();
    pool.end();
  }
}

if (require.main === module) {
  main();
}