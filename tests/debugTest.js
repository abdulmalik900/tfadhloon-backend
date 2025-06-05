// Simple API Test to Debug Issues
import axios from 'axios';

const API_BASE = 'http://localhost:3005/api/game';

async function testCreateGameDetailed() {
  console.log('🧪 Testing Create Game with detailed error info...');
  
  try {
    console.log('Making request to:', `${API_BASE}/create`);
    console.log('Request body:', { playerName: 'Test Host Player' });
    
    const response = await axios.post(`${API_BASE}/create`, {
      playerName: 'Test Host Player'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ SUCCESS!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.log('❌ ERROR!');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received');
      console.log('Request:', error.request);
    }
    
    throw error;
  }
}

// Test basic connectivity
async function testServerConnection() {
  console.log('🔗 Testing server connection...');
  
  try {
    const response = await axios.get('http://localhost:3005/', {
      timeout: 5000
    });
    console.log('✅ Server is reachable');
    console.log('Response status:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Cannot reach server');
    console.log('Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Running Detailed API Tests');
  console.log('='.repeat(50));
  
  // Test 1: Server connectivity
  const serverOk = await testServerConnection();
  if (!serverOk) {
    console.log('❌ Server not reachable, stopping tests');
    return;
  }
  
  console.log('');
  
  // Test 2: Create game
  try {
    const result = await testCreateGameDetailed();
    console.log('🎯 Game created successfully with code:', result.data?.gameCode);
    
    // Test a simple GET request with the created game code
    if (result.data?.gameCode) {
      console.log('\n🧪 Testing validate endpoint...');
      try {
        const validateResponse = await axios.get(`${API_BASE}/validate/${result.data.gameCode}`);
        console.log('✅ Validate endpoint works');
        console.log('Validate response:', JSON.stringify(validateResponse.data, null, 2));
      } catch (validateError) {
        console.log('❌ Validate endpoint failed');
        console.log('Error:', validateError.message);
        if (validateError.response) {
          console.log('Response:', JSON.stringify(validateError.response.data, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Create game failed, cannot test other endpoints');
  }
}

runTests().catch(console.error);
