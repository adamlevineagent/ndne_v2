#!/usr/bin/env node

/**
 * Manual test script to verify the reaction functionality works end-to-end
 * This simulates the frontend-backend interaction for reactions
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

const API_BASE = 'http://localhost:3000/api';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ndne_v2',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testReactionFrontendFlow() {
  let testUserId, testProposalId, authToken;

  try {
    console.log('🧪 Testing Reaction Frontend Flow...\n');
    
    // Setup test data
    console.log('1. Setting up test data...');
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['frontend-test@example.com', '$2b$12$hashedpassword']
    );
    testUserId = userResult.rows[0].id;
    
    const proposalResult = await pool.query(
      'INSERT INTO proposals (title, description) VALUES ($1, $2) RETURNING id',
      ['Frontend Test Proposal', 'This proposal tests the frontend reaction interface']
    );
    testProposalId = proposalResult.rows[0].id;

    // Create JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    authToken = jwt.sign({ 
      userId: testUserId, 
      email: 'frontend-test@example.com' 
    }, JWT_SECRET, { expiresIn: '1h' });

    const headers = { Authorization: `Bearer ${authToken}` };

    console.log('✓ Test user and proposal created');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Proposal ID: ${testProposalId}\n`);

    // Simulate ProposalCard component loading
    console.log('2. Simulating ProposalCard component initialization...');
    
    // Load user reaction (should be null initially)
    console.log('   → Loading user reaction...');
    try {
      const userReaction = await axios.get(`${API_BASE}/reactions/${testProposalId}/user`, { headers });
      console.log('   ✓ User reaction loaded:', userReaction.data.data ? 'Has reaction' : 'No reaction');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ✓ No existing reaction (expected)');
      } else {
        throw error;
      }
    }

    // Load reaction stats (should be empty initially)
    console.log('   → Loading reaction stats...');
    const statsResponse = await axios.get(`${API_BASE}/reactions/${testProposalId}`, { headers });
    console.log('   ✓ Reaction stats loaded:', statsResponse.data.data.stats);

    // Simulate user clicking "Like" button
    console.log('\n3. Simulating user clicking "Like" button...');
    const likeResponse = await axios.post(`${API_BASE}/reactions`, {
      proposalId: testProposalId,
      response: 'like',
      comment: 'This looks great!'
    }, { headers });
    console.log('   ✓ Like reaction created:', {
      response: likeResponse.data.data.response,
      comment: likeResponse.data.data.comment
    });

    // Reload stats to show updated counts
    console.log('   → Reloading stats after like...');
    const updatedStats = await axios.get(`${API_BASE}/reactions/${testProposalId}`, { headers });
    console.log('   ✓ Updated stats:', updatedStats.data.data.stats);

    // Simulate user adding a comment and changing to dislike
    console.log('\n4. Simulating user changing reaction to dislike with new comment...');
    const dislikeResponse = await axios.post(`${API_BASE}/reactions`, {
      proposalId: testProposalId,
      response: 'dislike',
      comment: 'Actually, I have concerns about this approach.'
    }, { headers });
    console.log('   ✓ Reaction updated to dislike:', {
      response: dislikeResponse.data.data.response,
      comment: dislikeResponse.data.data.comment
    });

    // Reload stats again
    console.log('   → Reloading stats after dislike...');
    const finalStats = await axios.get(`${API_BASE}/reactions/${testProposalId}`, { headers });
    console.log('   ✓ Final stats:', finalStats.data.data.stats);

    // Simulate user removing reaction
    console.log('\n5. Simulating user removing reaction...');
    await axios.delete(`${API_BASE}/reactions/${testProposalId}`, { headers });
    console.log('   ✓ Reaction removed');

    // Check final stats
    console.log('   → Checking stats after removal...');
    const emptyStats = await axios.get(`${API_BASE}/reactions/${testProposalId}`, { headers });
    console.log('   ✓ Stats after removal:', emptyStats.data.data.stats);

    console.log('\n✅ All reaction frontend flow tests passed!');
    console.log('\n📋 Summary of tested functionality:');
    console.log('   • Loading user reaction on component mount');
    console.log('   • Loading reaction statistics');
    console.log('   • Creating like reaction with comment');
    console.log('   • Updating reaction from like to dislike');
    console.log('   • Updating comment text');
    console.log('   • Removing reaction');
    console.log('   • Real-time stats updates');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up test data...');
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
    console.log('✓ Backend server is running\n');
    return true;
  } catch (error) {
    console.log('❌ Backend server is not running. Please start it with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testReactionFrontendFlow();
  }
}

main();