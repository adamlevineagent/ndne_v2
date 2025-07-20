const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ndne_v2',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testReactionAPI() {
  let testUserId, testProposalId, authToken;

  try {
    console.log('Setting up test data...');
    
    // Create test user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['test-api@example.com', '$2b$12$hashedpassword']
    );
    testUserId = userResult.rows[0].id;
    
    // Create test proposal
    const proposalResult = await pool.query(
      'INSERT INTO proposals (title, description) VALUES ($1, $2) RETURNING id',
      ['Test API Proposal', 'This is a test proposal for API testing']
    );
    testProposalId = proposalResult.rows[0].id;

    console.log('Test user ID:', testUserId);
    console.log('Test proposal ID:', testProposalId);

    // Create proper JWT token for testing
    console.log('\n1. Creating authentication token...');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    authToken = jwt.sign({ 
      userId: testUserId, 
      email: 'test-api@example.com' 
    }, JWT_SECRET, { expiresIn: '1h' });
    console.log('✓ Authentication token created');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Test 1: Create a reaction
    console.log('\n2. Testing POST /api/reactions...');
    const createResponse = await axios.post(`${API_BASE}/reactions`, {
      proposalId: testProposalId,
      response: 'like',
      comment: 'This is a great proposal!'
    }, { headers });
    
    console.log('✓ Reaction created:', createResponse.data);

    // Test 2: Get reactions for proposal
    console.log('\n3. Testing GET /api/reactions/:proposalId...');
    const getResponse = await axios.get(`${API_BASE}/reactions/${testProposalId}`, { headers });
    console.log('✓ Reactions retrieved:', getResponse.data);

    // Test 3: Get user's reaction
    console.log('\n4. Testing GET /api/reactions/:proposalId/user...');
    const userReactionResponse = await axios.get(`${API_BASE}/reactions/${testProposalId}/user`, { headers });
    console.log('✓ User reaction retrieved:', userReactionResponse.data);

    // Test 4: Update reaction
    console.log('\n5. Testing POST /api/reactions (update)...');
    const updateResponse = await axios.post(`${API_BASE}/reactions`, {
      proposalId: testProposalId,
      response: 'dislike',
      comment: 'Changed my mind'
    }, { headers });
    
    console.log('✓ Reaction updated:', updateResponse.data);

    // Test 5: Get all user reactions
    console.log('\n6. Testing GET /api/reactions/user/all...');
    const allUserReactionsResponse = await axios.get(`${API_BASE}/reactions/user/all`, { headers });
    console.log('✓ All user reactions retrieved:', allUserReactionsResponse.data);

    console.log('\n✅ All reaction API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    // Clean up test data
    console.log('\nCleaning up test data...');
    if (testUserId && testProposalId) {
      await pool.query('DELETE FROM reactions WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM proposals WHERE id = $1', [testProposalId]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
    console.log('✓ Cleanup completed');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`);
    console.log('✓ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testReactionAPI();
  }
}

main();