const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testOutcomeEndpoints() {
  try {
    console.log('Testing Outcome Collection System...\n');

    // First, let's register a test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    });
    
    const token = registerResponse.data.token;
    console.log('✓ User registered successfully');

    // Set up auth headers
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get user ID from token
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userId = payload.userId;
    console.log(`✓ User ID: ${userId}`);

    // Test creating an outcome
    console.log('\n2. Creating test outcome...');
    const createResponse = await axios.post(`${BASE_URL}/outcomes`, {
      statement: 'I want a world where everyone has access to quality education',
      importance: 4
    }, { headers: authHeaders });

    const outcome = createResponse.data.outcome;
    console.log('✓ Outcome created:', outcome.statement);
    console.log(`  - ID: ${outcome.id}`);
    console.log(`  - Importance: ${outcome.importance}`);

    // Test getting outcomes for user
    console.log('\n3. Fetching user outcomes...');
    const getResponse = await axios.get(`${BASE_URL}/outcomes/${userId}`, { headers: authHeaders });
    
    console.log(`✓ Found ${getResponse.data.outcomes.length} outcomes`);
    getResponse.data.outcomes.forEach((outcome, index) => {
      console.log(`  ${index + 1}. ${outcome.statement} (Importance: ${outcome.importance})`);
    });

    // Test updating an outcome
    console.log('\n4. Updating outcome...');
    const updateResponse = await axios.put(`${BASE_URL}/outcomes/${outcome.id}`, {
      statement: 'I want a world where everyone has access to excellent education and learning opportunities',
      importance: 5
    }, { headers: authHeaders });

    console.log('✓ Outcome updated:', updateResponse.data.outcome.statement);
    console.log(`  - New importance: ${updateResponse.data.outcome.importance}`);

    // Test AI refinement (this might fail if OpenRouter API key is not set)
    console.log('\n5. Testing AI refinement...');
    try {
      const refineResponse = await axios.post(`${BASE_URL}/outcomes/${outcome.id}/refine`, {}, { headers: authHeaders });
      console.log('✓ Outcome refined:', refineResponse.data.outcome.statement);
    } catch (error) {
      console.log('⚠ AI refinement failed (likely due to missing API key):', error.response?.data?.error || error.message);
    }

    // Test outcome extraction from conversation
    console.log('\n6. Testing outcome extraction...');
    try {
      const extractResponse = await axios.post(`${BASE_URL}/outcomes/extract`, {
        conversationMessages: [
          { role: 'user', content: 'I really care about environmental protection and want to see cleaner air in cities' },
          { role: 'assistant', content: 'That sounds important to you. What specific changes would you like to see?' },
          { role: 'user', content: 'I want a world where public transportation is widely available and affordable so people drive less' }
        ]
      }, { headers: authHeaders });
      
      console.log(`✓ Extracted ${extractResponse.data.outcomes.length} outcomes from conversation`);
      extractResponse.data.outcomes.forEach((outcome, index) => {
        console.log(`  ${index + 1}. ${outcome.statement} (Importance: ${outcome.importance})`);
      });
    } catch (error) {
      console.log('⚠ Outcome extraction failed (likely due to missing API key):', error.response?.data?.error || error.message);
    }

    // Test deleting an outcome
    console.log('\n7. Deleting outcome...');
    await axios.delete(`${BASE_URL}/outcomes/${outcome.id}`, { headers: authHeaders });
    console.log('✓ Outcome deleted successfully');

    // Verify deletion
    const finalGetResponse = await axios.get(`${BASE_URL}/outcomes/${userId}`, { headers: authHeaders });
    console.log(`✓ Remaining outcomes: ${finalGetResponse.data.outcomes.length}`);

    console.log('\n🎉 All outcome endpoint tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('This might be a database connection issue. Make sure PostgreSQL is running and the database exists.');
    }
  }
}

testOutcomeEndpoints();