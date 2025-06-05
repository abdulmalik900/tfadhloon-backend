// Working API Test Suite for TFADHLOON Backend
import axios from 'axios';

const API_BASE = 'http://localhost:3005/api/game';
let testGameCode = '';
let testPlayerId = '';
let player2Id = '';

// Test results
const testResults = { passed: 0, failed: 0, total: 0 };

function logTest(name, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name} - PASSED ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - FAILED ${details}`);
  }
}

async function runAllTests() {
  console.log('🚀 TFADHLOON API Test Suite');
  console.log('='.repeat(50));

  try {
    // Test 1: Create Game
    console.log('\n1️⃣ Testing: Create Game Room');
    const createResponse = await axios.post(`${API_BASE}/create`, {
      playerName: 'Test Host Player'
    });
    
    const createSuccess = createResponse.data.status === 'success' && createResponse.data.data.gameCode;
    logTest('POST /api/game/create', createSuccess);
    
    if (createSuccess) {
      testGameCode = createResponse.data.data.gameCode;
      testPlayerId = createResponse.data.data.hostId;
      console.log(`   🎯 Game Code: ${testGameCode}`);
      console.log(`   👤 Host ID: ${testPlayerId}`);
    }

    // Test 2: Validate Game Code (valid)
    console.log('\n2️⃣ Testing: Validate Game Code (Valid)');
    const validateResponse = await axios.get(`${API_BASE}/validate/${testGameCode}`);
    const validateSuccess = validateResponse.data.status === 'success' && validateResponse.data.data.isValid;
    logTest('GET /api/game/validate/:gameCode (valid)', validateSuccess);

    // Test 3: Join Game
    console.log('\n3️⃣ Testing: Join Game Room');
    const joinResponse = await axios.post(`${API_BASE}/join`, {
      gameCode: testGameCode,
      playerName: 'Test Player 2'
    });
    const joinSuccess = joinResponse.data.status === 'success';
    logTest('POST /api/game/join', joinSuccess);
    
    if (joinSuccess) {
      player2Id = joinResponse.data.data.playerId;
      console.log(`   👤 Player 2 ID: ${player2Id}`);
    }

    // Test 4: Get Game State
    console.log('\n4️⃣ Testing: Get Game State');
    const stateResponse = await axios.get(`${API_BASE}/${testGameCode}/state`);
    const stateSuccess = stateResponse.data.status === 'success' && stateResponse.data.data.gameCode === testGameCode;
    logTest('GET /api/game/:gameCode/state', stateSuccess);

    // Test 5: Get Players
    console.log('\n5️⃣ Testing: Get Players');
    const playersResponse = await axios.get(`${API_BASE}/${testGameCode}/players`);
    const playersSuccess = playersResponse.data.status === 'success' && Array.isArray(playersResponse.data.data.players);
    logTest('GET /api/game/:gameCode/players', playersSuccess);
    
    if (playersSuccess) {
      console.log(`   👥 Player Count: ${playersResponse.data.data.players.length}`);
    }

    // Test 6: Get Game Settings
    console.log('\n6️⃣ Testing: Get Game Settings');
    const settingsResponse = await axios.get(`${API_BASE}/${testGameCode}/settings`);
    const settingsSuccess = settingsResponse.data.status === 'success' && settingsResponse.data.data.settings;
    logTest('GET /api/game/:gameCode/settings', settingsSuccess);
    
    if (settingsSuccess) {
      const settings = settingsResponse.data.data.settings;
      console.log(`   ⏱️ Score Display Time: ${settings.scoreDisplayTime}s`);
      console.log(`   ⏱️ Final Score Time: ${settings.finalScoreDisplayTime}s`);
      console.log(`   ⏱️ Winner Animation: ${settings.winnerAnimationTime}s`);
    }

    // Test 7: Get Leaderboard
    console.log('\n7️⃣ Testing: Get Leaderboard');
    const leaderboardResponse = await axios.get(`${API_BASE}/${testGameCode}/leaderboard`);
    const leaderboardSuccess = leaderboardResponse.data.status === 'success';
    logTest('GET /api/game/:gameCode/leaderboard', leaderboardSuccess);

    // Test 8: Get Rounds
    console.log('\n8️⃣ Testing: Get Rounds');
    const roundsResponse = await axios.get(`${API_BASE}/${testGameCode}/rounds`);
    const roundsSuccess = roundsResponse.data.status === 'success' && Array.isArray(roundsResponse.data.data.rounds);
    logTest('GET /api/game/:gameCode/rounds', roundsSuccess);

    // Test 9: Get Current Round
    console.log('\n9️⃣ Testing: Get Current Round');
    const currentRoundResponse = await axios.get(`${API_BASE}/${testGameCode}/current-round`);
    const currentRoundSuccess = currentRoundResponse.data.status === 'success';
    logTest('GET /api/game/:gameCode/current-round', currentRoundSuccess);

    // Test 10: Mark Player Ready
    console.log('\n🔟 Testing: Mark Player Ready');
    const readyResponse = await axios.post(`${API_BASE}/${testGameCode}/ready`, {
      playerId: testPlayerId
    });
    const readySuccess = readyResponse.data.status === 'success';
    logTest('POST /api/game/:gameCode/ready', readySuccess);

    // Test 11: Get Game Stats
    console.log('\n1️⃣1️⃣ Testing: Get Game Stats');
    const statsResponse = await axios.get(`${API_BASE}/${testGameCode}/stats`);
    const statsSuccess = statsResponse.data.status === 'success';
    logTest('GET /api/game/:gameCode/stats', statsSuccess);

    // Test 12: Validate Invalid Game Code
    console.log('\n1️⃣2️⃣ Testing: Validate Invalid Game Code');
    try {
      await axios.get(`${API_BASE}/validate/9999`);
      logTest('GET /api/game/validate/9999 (invalid)', false, '- Should have failed');
    } catch (error) {
      const invalidSuccess = error.response?.data?.status === 'error';
      logTest('GET /api/game/validate/9999 (invalid)', invalidSuccess, '- Correctly rejected');
    }

    // Test 13: Leave Game
    console.log('\n1️⃣3️⃣ Testing: Leave Game');
    const leaveResponse = await axios.delete(`${API_BASE}/${testGameCode}/leave`, {
      data: { playerId: player2Id }
    });
    const leaveSuccess = leaveResponse.data.status === 'success';
    logTest('DELETE /api/game/:gameCode/leave', leaveSuccess);

  } catch (error) {
    console.log('❌ Test suite error:', error.message);
    if (error.response?.data) {
      console.log('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Final Results
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.passed >= 10) {
    console.log('🎉 API Backend Status: ✅ FULLY FUNCTIONAL');
    console.log('🚀 Ready for Frontend Development!');
  } else {
    console.log('⚠️ API Backend Status: ❌ NEEDS ATTENTION');
  }
  
  console.log(`\n🎯 Test Game Code: ${testGameCode}`);
  console.log('🌐 Server: http://localhost:3005');
}

runAllTests().catch(console.error);
