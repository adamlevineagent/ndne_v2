const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuthEndpoints() {
  console.log('Testing NDNE V2 Authentication Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check passed:', healthResponse.data);

    // Test 2: Register a new user
    console.log('\n2. Testing user registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✓ User registration successful:', {
      user: registerResponse.data.user,
      tokenExists: !!registerResponse.data.token
    });

    const token = registerResponse.data.token;

    // Test 3: Login with the same user
    console.log('\n3. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, registerData);
    console.log('✓ User login successful:', {
      user: loginResponse.data.user,
      tokenExists: !!loginResponse.data.token
    });

    // Test 4: Access protected endpoint
    console.log('\n4. Testing protected endpoint access...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✓ Protected endpoint access successful:', meResponse.data.user);

    // Test 5: Token validation
    console.log('\n5. Testing token validation...');
    const validateResponse = await axios.post(`${BASE_URL}/auth/validate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✓ Token validation successful:', validateResponse.data);

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    if (error.response) {
      console.error('❌ Test failed:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to server. Make sure the server is running on port 3000');
      console.log('Run: npm run dev');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

testAuthEndpoints();