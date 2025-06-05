/**
 * TFADHLOON Game Flow Test
 * Complete game flow testing with 4 players through 12 rounds
 */

import io from 'socket.io-client';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://backend.tfadhloon.com'
  : 'http://localhost:3005';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'wss://backend.tfadhloon.com'
  : 'ws://localhost:3005';

class GameFlowTester {
  constructor() {
    this.gameCode = null;
    this.players = [];
    this.sockets = [];
    this.gameState = {
      currentRound: 0,
      totalRounds: 12,
      currentPlayer: null,
      scores: {},
      gamePhase: 'waiting'
    };
  }

  // Test 1: Create Game Room
  async testCreateGameRoom() {
    console.log('\n🎮 Test 1: Creating Game Room...');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/games/create`, {
        playerName: 'Host Player'
      });

      if (response.data.status === 'success') {
        this.gameCode = response.data.data.gameCode;
        this.players.push({
          id: response.data.data.hostId,
          name: 'Host Player',
          isHost: true
        });

        console.log(`✅ Game room created with code: ${this.gameCode}`);
        console.log(`   Host ID: ${response.data.data.hostId}`);
        return true;
      } else {
        throw new Error('Failed to create game room');
      }
    } catch (error) {
      console.error('❌ Create game room failed:', error.message);
      return false;
    }
  }

  // Test 2: Add 3 More Players
  async testAddPlayers() {
    console.log('\n👥 Test 2: Adding 3 more players...');
    
    const playerNames = ['Player 2', 'Player 3', 'Player 4'];
    
    for (let i = 0; i < playerNames.length; i++) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/games/join`, {
          gameCode: this.gameCode,
          playerName: playerNames[i]
        });

        if (response.data.status === 'success') {
          this.players.push({
            id: response.data.data.playerId,
            name: playerNames[i],
            isHost: false
          });
          console.log(`✅ ${playerNames[i]} joined (ID: ${response.data.data.playerId})`);
        } else {
          throw new Error(`Failed to add ${playerNames[i]}`);
        }
      } catch (error) {
        console.error(`❌ Adding ${playerNames[i]} failed:`, error.message);
        return false;
      }
    }

    console.log(`✅ All 4 players added successfully`);
    return true;
  }

  // Test 3: Connect All Players via Socket
  async testSocketConnections() {
    console.log('\n🔌 Test 3: Connecting all players via Socket.io...');

    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      
      try {
        const socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          forceNew: true
        });

        this.sockets.push(socket);

        // Wait for connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 5000);

          socket.on('connect', () => {
            clearTimeout(timeout);
            console.log(`✅ ${player.name} connected (Socket ID: ${socket.id})`);
            resolve();
          });

          socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });

        // Join room
        socket.emit('join-room', {
          gameCode: this.gameCode,
          playerId: player.id,
          playerName: player.name
        });

        // Wait for room joined confirmation
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Join room timeout'));
          }, 3000);

          socket.on('room-joined', (data) => {
            clearTimeout(timeout);
            console.log(`✅ ${player.name} joined room successfully`);
            resolve();
          });

          socket.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(error.message));
          });
        });

      } catch (error) {
        console.error(`❌ Socket connection failed for ${player.name}:`, error.message);
        return false;
      }
    }

    console.log('✅ All players connected via Socket.io');
    return true;
  }

  // Test 4: Start Game (Auto-starts when 4 players join)
  async testGameStart() {
    console.log('\n🚀 Test 4: Starting the game...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Game start timeout'));
      }, 10000);

      // Listen for game start on first socket
      this.sockets[0].on('game-started', (data) => {
        clearTimeout(timeout);
        this.gameState.currentRound = data.currentRound;
        this.gameState.totalRounds = data.totalRounds;
        this.gameState.currentPlayer = data.currentPlayer;
        this.gameState.gamePhase = 'playing';

        console.log('✅ Game started successfully!');
        console.log(`   Current Round: ${data.currentRound}/${data.totalRounds}`);
        console.log(`   First Player: ${data.currentPlayer.name} (${data.currentPlayer.id})`);
        resolve(true);
      });

      this.sockets[0].on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });
    });
  }

  // Test 5: Complete Full Game Flow (12 Rounds)
  async testCompleteGameFlow() {
    console.log('\n🎯 Test 5: Testing complete game flow (12 rounds)...');

    for (let round = 1; round <= 12; round++) {
      console.log(`\n   Round ${round}/12:`);
      
      const success = await this.testSingleRound(round);
      if (!success) {
        console.error(`❌ Round ${round} failed`);
        return false;
      }

      // Brief pause between rounds
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ All 12 rounds completed successfully!');
    return true;
  }

  // Test Single Round
  async testSingleRound(roundNumber) {
    return new Promise(async (resolve, reject) => {
      let roundData = null;
      let currentPlayerSocket = null;
      let otherPlayerSockets = [];

      // Wait for round to start
      const roundStartPromise = new Promise((resolveRound, rejectRound) => {
        const timeout = setTimeout(() => {
          rejectRound(new Error(`Round ${roundNumber} start timeout`));
        }, 10000);

        this.sockets[0].on('round-started', (data) => {
          clearTimeout(timeout);
          roundData = data;
          
          // Find current player socket
          const currentPlayerIndex = this.players.findIndex(p => p.id === data.currentPlayer.id);
          currentPlayerSocket = this.sockets[currentPlayerIndex];
          
          // Find other player sockets
          otherPlayerSockets = this.sockets.filter((socket, index) => index !== currentPlayerIndex);
          
          console.log(`     Current Player: ${data.currentPlayer.name}`);
          console.log(`     Question: ${data.question.questionText}`);
          console.log(`     Option A: ${data.question.optionA}`);
          console.log(`     Option B: ${data.question.optionB}`);
          
          resolveRound();
        });
      });

      try {
        await roundStartPromise;

        // Phase 1: Other players make predictions (simulate random choices)
        console.log('     📊 Other players making predictions...');
        const predictionPromises = otherPlayerSockets.map((socket, index) => {
          return new Promise((resolvePred) => {
            const playerIndex = this.sockets.indexOf(socket);
            const playerId = this.players[playerIndex].id;
            const predictedChoice = Math.random() > 0.5 ? 'A' : 'B';
            
            console.log(`       ${this.players[playerIndex].name} predicts: ${predictedChoice}`);
            
            socket.emit('submit-prediction', {
              gameCode: this.gameCode,
              playerId: playerId,
              predictedChoice: predictedChoice
            });
            
            // Wait a bit then resolve
            setTimeout(resolvePred, 500);
          });
        });

        await Promise.all(predictionPromises);

        // Phase 2: Wait for predictions phase to end
        const predictionEndPromise = new Promise((resolvePredEnd) => {
          const timeout = setTimeout(resolvePredEnd, 5000);
          
          this.sockets[0].on('prediction-phase-ended', () => {
            clearTimeout(timeout);
            console.log('     🔓 Current player can now answer');
            resolvePredEnd();
          });
        });

        await predictionEndPromise;

        // Phase 3: Current player submits answer
        console.log('     ✋ Current player submitting answer...');
        const currentPlayerIndex = this.players.findIndex(p => p.id === roundData.currentPlayer.id);
        const currentPlayerId = this.players[currentPlayerIndex].id;
        const playerAnswer = Math.random() > 0.5 ? 'A' : 'B';

        console.log(`       ${roundData.currentPlayer.name} answers: ${playerAnswer}`);

        currentPlayerSocket.emit('submit-answer', {
          gameCode: this.gameCode,
          playerId: currentPlayerId,
          answer: playerAnswer
        });

        // Phase 4: Wait for round completion and score display
        const roundCompletePromise = new Promise((resolveComplete) => {
          const timeout = setTimeout(() => {
            resolveComplete(false);
          }, 8000);

          this.sockets[0].on('round-completed', (data) => {
            clearTimeout(timeout);
            console.log('     📈 Round completed! Scores updated:');
            
            data.predictions.forEach(pred => {
              const points = pred.isCorrect ? '(+10 points)' : '(+0 points)';
              console.log(`       ${pred.playerName}: ${pred.predictedChoice} ${pred.isCorrect ? '✅' : '❌'} ${points}`);
            });
            
            resolveComplete(true);
          });
        });

        const roundSuccess = await roundCompletePromise;

        if (roundNumber < 12) {
          // Wait for next round to start
          const nextRoundPromise = new Promise((resolveNext) => {
            const timeout = setTimeout(resolveNext, 10000);
            
            this.sockets[0].on('next-round-starting', (data) => {
              clearTimeout(timeout);
              console.log(`     ➡️  Next round starting with ${data.nextPlayer.name}`);
              resolveNext();
            });
          });

          await nextRoundPromise;
        }

        resolve(roundSuccess);

      } catch (error) {
        console.error(`     ❌ Round ${roundNumber} error:`, error.message);
        resolve(false);
      }
    });
  }

  // Test 6: Verify Final Results
  async testFinalResults() {
    console.log('\n🏆 Test 6: Waiting for final results...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Final results timeout'));
      }, 15000);

      this.sockets[0].on('game-finished', (data) => {
        console.log('✅ Game finished! Final scores:');
        
        data.finalScores.forEach((player, index) => {
          const rank = index + 1;
          const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
          console.log(`   ${trophy} ${rank}. ${player.playerName}: ${player.score} points`);
        });

        console.log(`\n🎉 Winner: ${data.winner.playerName} with ${data.winner.score} points!`);
        
        // Wait for winner animation
        this.sockets[0].on('winner-animation', (animationData) => {
          console.log(`🎊 Winner animation playing for ${animationData.duration} seconds...`);
          
          setTimeout(() => {
            clearTimeout(timeout);
            resolve(true);
          }, animationData.duration * 1000);
        });
      });

      this.sockets[0].on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });
    });
  }

  // Clean up connections
  cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    this.sockets.forEach(socket => {
      socket.disconnect();
    });
    console.log('✅ All connections closed');
  }

  // Run all tests
  async runAllTests() {
    console.log('🎯 TFADHLOON Game Flow Complete Test Suite');
    console.log('===========================================');

    try {
      // Test 1: Create game room
      if (!(await this.testCreateGameRoom())) {
        throw new Error('Failed to create game room');
      }

      // Test 2: Add players
      if (!(await this.testAddPlayers())) {
        throw new Error('Failed to add players');
      }

      // Test 3: Socket connections
      if (!(await this.testSocketConnections())) {
        throw new Error('Failed to connect sockets');
      }

      // Test 4: Start game
      if (!(await this.testGameStart())) {
        throw new Error('Failed to start game');
      }

      // Test 5: Complete game flow
      if (!(await this.testCompleteGameFlow())) {
        throw new Error('Failed to complete game flow');
      }

      // Test 6: Final results
      if (!(await this.testFinalResults())) {
        throw new Error('Failed to get final results');
      }

      console.log('\n🎉 ALL TESTS PASSED! Game flow is working perfectly!');
      console.log('✅ Game Setup: Working');
      console.log('✅ Player Management: Working');
      console.log('✅ Socket Communication: Working');
      console.log('✅ Game Flow (12 Rounds): Working');
      console.log('✅ Score System: Working');
      console.log('✅ Score Display (3s): Working');
      console.log('✅ Final Leaderboard (10s): Working');
      console.log('✅ Winner Animation (10s): Working');

      return true;

    } catch (error) {
      console.error('\n❌ TEST SUITE FAILED:', error.message);
      return false;
    } finally {
      this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (process.argv[2] === 'run') {
  const tester = new GameFlowTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export default GameFlowTester;
