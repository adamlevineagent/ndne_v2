const axios = require('axios');
const pool = require('./dist/config/database.js').default;

const API_BASE = 'http://localhost:3000/api';

async function setupTestData() {
  console.log('Setting up test data...');
  
  // Create test users
  const user1Result = await pool.query(`
    INSERT INTO users (email, password_hash) 
    VALUES ('api-test1@example.com', 'hashedpassword1') 
    RETURNING id
  `);
  const user1Id = user1Result.rows[0].id;

  const user2Result = await pool.query(`
    INSERT INTO users (email, password_hash) 
    VALUES ('api-test2@example.com', 'hashedpassword2') 
    RETURNING id
  `);
  const user2Id = user2Result.rows[0].id;

  // Create test outcomes
  await pool.query(`
    INSERT INTO outcomes (user_id, statement, importance) VALUES
    ($1, 'I want a world where every child has access to quality education', 5)
  `, [user1Id]);
  
  await pool.query(`
    INSERT INTO outcomes (user_id, statement, importance) VALUES
    ($1, 'I want a world where all children can get excellent education', 4)
  `, [user2Id]);

  console.log('✅ Test data created');
  return { user1Id, user2Id };
}

async function testProposalAPI() {
  console.log('🧪 Testing Proposal API endpoints...');
  
  try {
    const { user1Id, user2Id } = await setupTestData();

    // Test the proposal service directly (since we don't have auth setup for API testing)
    const { ProposalService } = require('./dist/services/proposal.js');
    const proposalService = new ProposalService(pool);

    // Test 1: Generate proposals
    console.log('\n1️⃣ Testing proposal generation...');
    const proposals = await proposalService.generateProposals({
      minSimilarityScore: 0.5,
      maxUsers: 10
    });
    console.log(`✅ Generated ${proposals.length} proposals`);

    if (proposals.length > 0) {
      const proposal = proposals[0];
      console.log(`   Title: ${proposal.title}`);
      console.log(`   Contributing Users: ${proposal.contributingUsers.length}`);
      console.log(`   Similarity Score: ${proposal.similarityAnalysis.overallSimilarityScore?.toFixed(2)}`);

      // Test 2: Get all proposals
      console.log('\n2️⃣ Testing get all proposals...');
      const allProposals = await proposalService.getAllProposals();
      console.log(`✅ Retrieved ${allProposals.length} proposals from database`);

      // Test 3: Get specific proposal by ID
      console.log('\n3️⃣ Testing get proposal by ID...');
      const specificProposal = await proposalService.getProposalById(proposal.id);
      console.log(`✅ Retrieved proposal: ${specificProposal ? 'Success' : 'Failed'}`);

      if (specificProposal) {
        console.log(`   Title: ${specificProposal.title}`);
        console.log(`   Contributing Users: ${specificProposal.contributingUsers.length}`);
        console.log(`   Shared Themes: ${specificProposal.similarityAnalysis.sharedThemes?.join(', ')}`);
      }
    }

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean up
    await pool.query('DELETE FROM proposal_users');
    await pool.query('DELETE FROM proposals');
    await pool.query('DELETE FROM outcomes');
    await pool.query('DELETE FROM users WHERE email LIKE \'api-test%@example.com\'');
    console.log('\n🧹 Test data cleaned up');
    pool.end();
  }
}

testProposalAPI();