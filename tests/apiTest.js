// Complete API Test Suite for TFADHLOON Backend
// Tests all 12 API endpoints with comprehensive validation

import axios from 'axios';

const API_BASE = 'http://localhost:3005/api/game';
let testGameCode = '';
let testPlayerId = '';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, passed, response = null, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
    if (response && response.data) {
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Message: ${response.data.message}`);
    }
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED`);
    if (error) {
      console.log(`   Error: ${error.message || 'Unknown error'}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      } else if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
    }
  }
  console.log('');
  testResults.details.push({ testName, passed, error: error?.message || error?.code });
}

// Test 1: Create Game Room
async function testCreateGame() {
  console.log('🧪 Testing: Create Game Room');
  try {
    const response = await axios.post(`${API_BASE}/create`, {
      playerName: 'Test Host Player'
    });

    const isValid = response.data.status === 'success' && 
                   response.data.data.gameCode && 
                   response.data.data.playerId;
    
    if (isValid) {
      testGameCode = response.data.data.gameCode;
      testPlayerId = response.data.data.playerId;
    }

    logTest('POST /api/game/create', isValid, response);
    return isValid;
  } catch (error) {
    logTest('POST /api/game/create', false, null, error);
    return false;
  }
}

// Test 2: Join Game Room
async function testJoinGame() {
  console.log('🧪 Testing: Join Game Room');
  try {
    const response = await axios.post(`${API_BASE}/join`, {
      gameCode: testGameCode,
      playerName: 'Test Player 2'
    });

    const isValid = response.data.status === 'success' && 
                   response.data.data.playerId;

    logTest('POST /api/game/join', isValid, response);
    return isValid;
  } catch (error) {
    logTest('POST /api/game/join', false, null, error);
    return false;
  }
}

// Test 3: Validate Game Code
async function testValidateGame() {
  console.log('🧪 Testing: Validate Game Code');
  try {
    const response = await axios.get(`${API_BASE}/validate/${testGameCode}`);

    const isValid = response.data.status === 'success' && 
                   response.data.data.isValid === true;

    logTest('GET /api/game/validate/:gameCode', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/validate/:gameCode', false, null, error);
    return false;
  }
}

// Test 4: Get Game State
async function testGetGameState() {
  console.log('🧪 Testing: Get Game State');
  try {
    const response = await axios.get(`${API_BASE}/${testGameCode}/state`);

    const isValid = response.data.status === 'success' && 
                   response.data.data.gameCode === testGameCode;

    logTest('GET /api/game/:gameCode/state', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/:gameCode/state', false, null, error);
    return false;
  }
}

// Test 5: Get Leaderboard
async function testGetLeaderboard() {
  console.log('🧪 Testing: Get Leaderboard');
  try {
    const response = await axios.get(`${API_BASE}/${testGameCode}/leaderboard`);

    const isValid = response.data.status === 'success' && 
                   Array.isArray(response.data.data.leaderboard);

    logTest('GET /api/game/:gameCode/leaderboard', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/:gameCode/leaderboard', false, null, error);
    return false;
  }
}

// Test 6: Get Rounds
async function testGetRounds() {
  console.log('🧪 Testing: Get Rounds');
  try {
    const response = await axios.get(`${API_BASE}/${testGameCode}/rounds`);

    const isValid = response.data.status === 'success' && 
                   Array.isArray(response.data.data.rounds);

    logTest('GET /api/game/:gameCode/rounds', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/:gameCode/rounds', false, null, error);
    return false;
  }
}

// Test 7: Get Current Round
async function testGetCurrentRound() {
  console.log('🧪 Testing: Get Current Round');
  try {
    const response = await axios.get(`${API_BASE}/${testGameCode}/current-round`);

    const isValid = response.data.status === 'success';

    logTest('GET /api/game/:gameCode/current-round', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/:gameCode/current-round', false, null, error);
    return false;
  }
}

// Test 8: Get Players
async function testGetPlayers() {
  console.log('🧪 Testing: Get Players');
  try {
    const response = await axios.get(`${API_BASE}/${testGameCode}/players`);

    const isValid = response.data.status === 'success' && 
                   Array.isArray(response.data.data.players);

    logTest('GET /api/game/:gameCode/players', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/:gameCode/players', false, null, error);
    return false;
  }
}

// Test 9: Mark Player Ready
async function testMarkPlayerReady() {
  console.log('🧪 Testing: Mark Player Ready');
  try {
    const response = await axios.post(`${API_BASE}/${testGameCode}/ready`, {
      playerId: testPlayerId
    });

    const isValid = response.data.status === 'success';

    logTest('POST /api/game/:gameCode/ready', isValid, response);
    return isValid;
  } catch (error) {
    logTest('POST /api/game/:gameCode/ready', false, null, error);
    return false;
  }
}

// Test 10: Get Game Settings
async function testGetGameSettings() {
  console.log('🧪 Testing: Get Game Settings');
  try {
    const response = await axios.get(`${API_BASE}/${testGameCode}/settings`);

    const isValid = response.data.status === 'success' && 
                   response.data.data.settings;

    logTest('GET /api/game/:gameCode/settings', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/:gameCode/settings', false, null, error);
    return false;
  }
}

// Test 11: Get Game Stats
async function testGetGameStats() {
  console.log('🧪 Testing: Get Game Stats');
  try {
    const response = await axios.get(`${API_BASE}/${testGameCode}/stats`);

    const isValid = response.data.status === 'success' && 
                   response.data.data.stats;

    logTest('GET /api/game/:gameCode/stats', isValid, response);
    return isValid;
  } catch (error) {
    logTest('GET /api/game/:gameCode/stats', false, null, error);
    return false;
  }
}

// Test 12: Leave Game
async function testLeaveGame() {
  console.log('🧪 Testing: Leave Game');
  try {
    const response = await axios.delete(`${API_BASE}/${testGameCode}/leave`, {
      data: { playerId: testPlayerId }
    });

    const isValid = response.data.status === 'success';

    logTest('DELETE /api/game/:gameCode/leave', isValid, response);
    return isValid;
  } catch (error) {
    logTest('DELETE /api/game/:gameCode/leave', false, null, error);
    return false;
  }
}

// Test invalid game code validation
async function testInvalidGameCode() {
  console.log('🧪 Testing: Invalid Game Code Validation');
  try {
    const response = await axios.get(`${API_BASE}/validate/9999`);
    // Should not reach here
    logTest('GET /api/game/validate/9999 (invalid)', false, response);
    return false;
  } catch (error) {
    // Should return 404 or error response
    const isValid = error.response?.data?.status === 'error';
    logTest('GET /api/game/validate/9999 (invalid)', isValid, null, error);
    return isValid;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Complete API Test Suite');
  console.log('='.repeat(50));
  
  const tests = [
    testCreateGame,
    testJoinGame,
    testValidateGame,
    testGetGameState,
    testGetLeaderboard,
    testGetRounds,
    testGetCurrentRound,
    testGetPlayers,
    testMarkPlayerReady,
    testGetGameSettings,
    testGetGameStats,
    testLeaveGame,
    testInvalidGameCode
  ];

  for (const test of tests) {
    await test();
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print final results
  console.log('='.repeat(50));
  console.log('🏁 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.testName}: ${t.error}`));
  }

  console.log('\n🎯 Test Game Code Used:', testGameCode);
  console.log('🎮 Server Status: Backend is', testResults.passed >= 10 ? '✅ WORKING' : '❌ NEEDS FIXES');
}

// Run tests
runAllTests().catch(console.error);
