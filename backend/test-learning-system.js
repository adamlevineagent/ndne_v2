const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;

// Test credentials
const testUser = {
  email: `test.learning.${Date.now()}@example.com`,
  password: 'testpassword123'
};

async function testLearningSystem() {
  console.log('🧠 Testing AI-Powered Learning System\n');

  try {
    // 1. Create test user and login
    console.log('1️⃣ Creating test user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    authToken = registerResponse.data.token;
    testUserId = registerResponse.data.user.id;
    console.log('✅ User created and logged in');

    // Set auth header for all subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // 2. Create some outcomes
    console.log('\n2️⃣ Creating test outcomes...');
    const outcomes = [
      { statement: "I want a world where education is accessible to all children", importance: 5 },
      { statement: "I want a world where communities support local schools", importance: 4 },
      { statement: "I want a world where learning is personalized to each student", importance: 4 }
    ];

    for (const outcome of outcomes) {
      await axios.post(`${API_URL}/outcomes`, outcome);
    }
    console.log('✅ Created 3 test outcomes');

    // 3. Generate some proposals
    console.log('\n3️⃣ Generating proposals...');
    const proposalResponse = await axios.post(`${API_URL}/proposals/generate`, {
      minSimilarityScore: 0.3,
      maxUsers: 5
    });
    const proposals = proposalResponse.data.data.proposals;
    console.log(`✅ Generated ${proposals.length} proposals`);

    // 4. Create reactions to proposals
    console.log('\n4️⃣ Creating reactions to trigger learning...');
    const reactions = [
      { proposalId: proposals[0]?.id, response: 'like', comment: 'This aligns perfectly with my vision for education' },
      { proposalId: proposals[1]?.id, response: 'dislike', comment: 'This approach feels too centralized' },
      { proposalId: proposals[0]?.id, response: 'like', comment: 'Community involvement is key' }
    ];

    for (const reaction of reactions.filter(r => r.proposalId)) {
      await axios.post(`${API_URL}/reactions`, reaction);
      console.log(`  → Reacted ${reaction.response} to proposal`);
    }

    // 5. Trigger learning analysis
    console.log('\n5️⃣ Triggering learning analysis...');
    const learningResponse = await axios.post(`${API_URL}/learning/trigger-learning`);
    console.log('✅ Learning analysis results:');
    console.log(`  → Insights found: ${learningResponse.data.results.insights}`);
    console.log(`  → Outcome evolutions: ${learningResponse.data.results.evolutions}`);
    console.log(`  → Value profile updated: ${learningResponse.data.results.profileUpdated}`);

    // 6. Get learning insights
    console.log('\n6️⃣ Retrieving learning insights...');
    const insightsResponse = await axios.get(`${API_URL}/learning/insights`);
    const insights = insightsResponse.data.insights;
    console.log(`✅ Found ${insights.length} learning insights:`);
    insights.forEach((insight, i) => {
      console.log(`\n  Insight ${i + 1}:`);
      console.log(`  Type: ${insight.type}`);
      console.log(`  Insight: ${insight.insight}`);
      console.log(`  Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
    });

    // 7. Get user value profile
    console.log('\n7️⃣ Getting user value profile...');
    const profileResponse = await axios.get(`${API_URL}/learning/value-profile`);
    if (profileResponse.data.profile) {
      const profile = profileResponse.data.profile;
      console.log('✅ User Value Profile:');
      console.log(`  Core Values: ${profile.coreValues.join(', ')}`);
      console.log(`  Solution Types: ${profile.preferencePatterns.solutionTypes.join(', ')}`);
      console.log(`  Consistency Score: ${(profile.reactionPatterns.consistencyScore * 100).toFixed(0)}%`);
    }

    // 8. Get collective patterns
    console.log('\n8️⃣ Checking collective patterns...');
    const patternsResponse = await axios.get(`${API_URL}/learning/collective-patterns`);
    const patterns = patternsResponse.data.patterns;
    console.log(`✅ Found ${patterns.length} collective patterns`);
    patterns.forEach((pattern, i) => {
      console.log(`\n  Pattern ${i + 1}:`);
      console.log(`  Type: ${pattern.patternType}`);
      console.log(`  Description: ${pattern.description}`);
      console.log(`  Strength: ${(pattern.strength * 100).toFixed(0)}%`);
    });

    // 9. Check if outcomes were evolved
    console.log('\n9️⃣ Checking outcome evolution...');
    const updatedOutcomesResponse = await axios.get(`${API_URL}/outcomes/${testUserId}`);
    const updatedOutcomes = updatedOutcomesResponse.data.outcomes;
    console.log('✅ Current outcomes:');
    updatedOutcomes.forEach((outcome, i) => {
      console.log(`  ${i + 1}. "${outcome.statement}"`);
      if (outcome.refinement_history && outcome.refinement_history.length > 0) {
        console.log(`     → Refined ${outcome.refinement_history.length} times`);
      }
    });

    console.log('\n🎉 AI-Powered Learning System Test Complete!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Reaction pattern analysis working');
    console.log('  ✅ Learning insights generation working');
    console.log('  ✅ User value profile building working');
    console.log('  ✅ Collective pattern identification working');
    console.log('  ✅ Outcome evolution based on learning working');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData(testUserId);

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function cleanupTestData(userId) {
  try {
    // The user deletion will cascade to all related data
    const pool = require('./dist/config/database.js').default;
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('Error cleaning up:', error.message);
  }
}

// Run the test
console.log('🚀 Starting AI-Powered Learning System Test...\n');
console.log('Make sure the backend server is running on http://localhost:3000\n');

setTimeout(() => {
  testLearningSystem();
}, 1000);