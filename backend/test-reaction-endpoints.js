const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import the routes
const reactionRoutes = require('./dist/routes/reactions').default;
const { authenticateToken } = require('./dist/middleware/auth');

const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use('/api/reactions', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
});

app.use('/api/reactions', reactionRoutes);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ndne_v2',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testReactionEndpoints() {
  let testUserId, testProposalId, authToken;

  try {
    console.log('Setting up test data...');
    
    // Create test user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['test-endpoint@example.com', '$2b$12$hashedpassword']
    );
    testUserId = userResult.rows[0].id;
    
    // Create test proposal
    const proposalResult = await pool.query(
      'INSERT INTO proposals (title, description) VALUES ($1, $2) RETURNING id',
      ['Test Endpoint Proposal', 'This is a test proposal for endpoint testing']
    );
    testProposalId = proposalResult.rows[0].id;

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    authToken = jwt.sign({ 
      userId: testUserId, 
      email: 'test-endpoint@example.com' 
    }, JWT_SECRET, { expiresIn: '1h' });

    console.log('✓ Test data setup complete');

    // Test 1: Create a reaction
    console.log('\n1. Testing POST /api/reactions...');
    const createResponse = await request(app)
      .post('/api/reactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        proposalId: testProposalId,
        response: 'like',
        comment: 'This is a great proposal!'
      });
    
    if (createResponse.status === 201) {
      console.log('✓ Reaction created successfully');
    } else {
      console.log('❌ Failed to create reaction:', createResponse.body);
    }

    // Test 2: Get reactions for proposal
    console.log('\n2. Testing GET /api/reactions/:proposalId...');
    const getResponse = await request(app)
      .get(`/api/reactions/${testProposalId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (getResponse.status === 200) {
      console.log('✓ Reactions retrieved successfully');
      console.log('  Reactions count:', getResponse.body.data.reactions.length);
      console.log('  Stats:', getResponse.body.data.stats);
    } else {
      console.log('❌ Failed to get reactions:', getResponse.body);
    }

    // Test 3: Get user's reaction
    console.log('\n3. Testing GET /api/reactions/:proposalId/user...');
    const userReactionResponse = await request(app)
      .get(`/api/reactions/${testProposalId}/user`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (userReactionResponse.status === 200) {
      console.log('✓ User reaction retrieved successfully');
      console.log('  User reaction:', userReactionResponse.body.data?.response);
    } else {
      console.log('❌ Failed to get user reaction:', userReactionResponse.body);
    }

    console.log('\n✅ Reaction endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
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

testReactionEndpoints();