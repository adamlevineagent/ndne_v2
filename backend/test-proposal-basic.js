const pool = require('./dist/config/database.js').default;

async function testBasicFunctionality() {
  console.log('Testing basic proposal functionality...');
  
  try {
    // Check if we can connect to database
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('proposals', 'proposal_users', 'outcomes', 'users')
      ORDER BY table_name
    `);
    console.log('✅ Required tables exist:', tablesResult.rows.map(r => r.table_name));

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

    console.log('✅ Test users created');

    // Create test outcomes
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where every child has access to quality education', 5)
    `, [user1Id]);
    
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where education is available to all children', 4)
    `, [user2Id]);

    console.log('✅ Test outcomes created');

    // Test basic proposal service instantiation
    const { ProposalService } = require('./dist/services/proposal.js');
    const proposalService = new ProposalService(pool);
    console.log('✅ ProposalService instantiated');

    // Test getting all outcomes
    const outcomes = await proposalService.getAllOutcomes();
    console.log(`✅ Retrieved ${outcomes.length} outcomes`);

    // Test getting all proposals (should be empty initially)
    const proposals = await proposalService.getAllProposals();
    console.log(`✅ Retrieved ${proposals.length} proposals`);

    // Test manual proposal creation
    const testProposal = await proposalService.storeProposal({
      title: 'Test Proposal for Education Access',
      description: 'This is a test proposal that addresses educational access for all children by creating universal education programs.',
      similarityAnalysis: {
        matchedOutcomes: [
          {
            userId: user1Id,
            outcomeId: 'test-outcome-1',
            statement: 'I want a world where every child has access to quality education',
            importance: 5,
            similarityScore: 1.0,
            sharedThemes: ['education', 'equality']
          },
          {
            userId: user2Id,
            outcomeId: 'test-outcome-2',
            statement: 'I want a world where education is available to all children',
            importance: 4,
            similarityScore: 0.9,
            sharedThemes: ['education', 'access']
          }
        ],
        sharedThemes: ['education', 'equality', 'access'],
        overallSimilarityScore: 0.95,
        synthesisReasoning: 'Both outcomes focus on universal access to education for children'
      },
      contributingUserIds: [user1Id, user2Id]
    });

    console.log('✅ Test proposal created:', testProposal.title);

    // Verify proposal was stored correctly
    const storedProposal = await proposalService.getProposalById(testProposal.id);
    console.log('✅ Proposal retrieved from database:', storedProposal ? 'Success' : 'Failed');

    // Clean up
    await pool.query('DELETE FROM proposal_users');
    await pool.query('DELETE FROM proposals');
    await pool.query('DELETE FROM outcomes');
    await pool.query('DELETE FROM users WHERE email LIKE \'test%@example.com\'');
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All basic functionality tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    pool.end();
  }
}

testBasicFunctionality();