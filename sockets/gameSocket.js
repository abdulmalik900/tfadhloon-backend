import GameRoom from '../models/GameRoom.js';
import Question from '../models/Question.js';

// Store active socket connections
const activeConnections = new Map();
const roomSockets = new Map(); // roomId -> Set of socketIds

export const setupGameSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);

    // Join game room
    socket.on('join-room', async (data) => {
      try {
        const { gameCode, playerId, playerName } = data;

        console.log(`🎮 Player ${playerName} (${playerId}) joining room ${gameCode}`);

        const gameRoom = await GameRoom.findOne({ gameCode });
        
        if (!gameRoom) {
          socket.emit('error', { message: 'Game room not found' });
          return;
        }

        // Update player connection status
        const player = gameRoom.players.find(p => p.id === playerId);
        if (player) {
          player.isConnected = true;
          await gameRoom.save();
        }

        // Join socket room
        socket.join(gameCode);
        
        // Store connection info
        activeConnections.set(socket.id, { gameCode, playerId, playerName });
        
        if (!roomSockets.has(gameCode)) {
          roomSockets.set(gameCode, new Set());
        }
        roomSockets.get(gameCode).add(socket.id);

        // Notify all players in room
        socket.to(gameCode).emit('player-joined', {
          player: player,
          totalPlayers: gameRoom.players.length
        });

        // Send room data to joining player
        socket.emit('room-joined', {
          gameRoom: {
            gameCode: gameRoom.gameCode,
            hostId: gameRoom.hostId,
            players: gameRoom.players,
            status: gameRoom.status,
            currentRound: gameRoom.currentRound,
            totalRounds: gameRoom.totalRounds,
            language: gameRoom.language,
            gameSettings: gameRoom.gameSettings,
            leaderboard: gameRoom.leaderboard
          }
        });

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Player ready status
    socket.on('player-ready', async (data) => {
      try {
        const { gameCode, playerId, isReady } = data;

        const gameRoom = await GameRoom.findOne({ gameCode });
        if (!gameRoom) return;

        const player = gameRoom.players.find(p => p.id === playerId);
        if (player) {
          player.isReady = isReady;
          await gameRoom.save();

          // Notify all players
          io.to(gameCode).emit('player-ready-status', {
            playerId,
            isReady,
            allReady: gameRoom.players.every(p => p.isReady)
          });
        }

      } catch (error) {
        console.error('Player ready error:', error);
      }
    });

    // Start game
    socket.on('start-game', async (data) => {
      try {
        const { gameCode, hostId } = data;

        const gameRoom = await GameRoom.findOne({ gameCode });
        
        if (!gameRoom || gameRoom.hostId !== hostId) {
          socket.emit('error', { message: 'Only host can start the game' });
          return;
        }

        if (gameRoom.players.length < 2) {
          socket.emit('error', { message: 'At least 2 players required' });
          return;
        }

        // Start the game
        gameRoom.status = 'playing';
        gameRoom.currentRound = 1;
        await gameRoom.save();

        // Notify all players
        io.to(gameCode).emit('game-started', {
          status: 'playing',
          currentRound: 1,
          totalRounds: gameRoom.totalRounds
        });

        // Start first round
        setTimeout(() => {
          startNewRound(io, gameCode);
        }, 2000);

      } catch (error) {
        console.error('Start game error:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Submit predictions
    socket.on('submit-predictions', async (data) => {
      try {
        const { gameCode, playerId, predictions, questionId } = data;

        const gameRoom = await GameRoom.findOne({ gameCode });
        if (!gameRoom) return;

        const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
        if (!currentRound) return;

        // Remove existing predictions from this player
        currentRound.predictions = currentRound.predictions.filter(p => p.playerId !== playerId);

        // Add new predictions
        predictions.forEach(prediction => {
          currentRound.predictions.push({
            playerId,
            questionId,
            targetPlayerId: prediction.targetPlayerId,
            predictedChoice: prediction.predictedChoice,
            submittedAt: new Date()
          });
        });

        await gameRoom.save();

        // Notify all players
        io.to(gameCode).emit('predictions-submitted', {
          playerId,
          submittedCount: predictions.length,
          totalSubmitted: getCurrentRoundSubmissions(gameRoom)
        });

        // Check if all predictions are in
        const expectedPredictions = gameRoom.players.length - 1; // Everyone except current player
        const currentSubmissions = getCurrentRoundSubmissions(gameRoom);
        
        if (currentSubmissions >= expectedPredictions) {
          // All predictions submitted, start answer phase
          io.to(gameCode).emit('prediction-phase-complete', {
            message: 'All predictions submitted! Waiting for answer...'
          });
        }

      } catch (error) {
        console.error('Submit predictions error:', error);
      }
    });

    // Submit answer
    socket.on('submit-answer', async (data) => {
      try {
        const { gameCode, playerId, answer } = data;

        const gameRoom = await GameRoom.findOne({ gameCode });
        if (!gameRoom) return;

        const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
        if (!currentRound || currentRound.currentPlayerId !== playerId) return;

        // Set answer and calculate scores
        currentRound.playerAnswer = answer;
        currentRound.answeredAt = new Date();

        // Calculate scores
        currentRound.predictions.forEach(prediction => {
          if (prediction.predictedChoice === answer) {
            prediction.isCorrect = true;
            const predictor = gameRoom.players.find(p => p.id === prediction.playerId);
            if (predictor) {
              predictor.score += 10;
            }
          } else {
            prediction.isCorrect = false;
          }
        });

        currentRound.isCompleted = true;
        await gameRoom.updateLeaderboard();

        // Send results to all players
        io.to(gameCode).emit('round-completed', {
          answer,
          predictions: currentRound.predictions,
          leaderboard: gameRoom.leaderboard,
          roundNumber: currentRound.roundNumber
        });

        // Start next round or end game
        setTimeout(() => {
          if (gameRoom.currentRound >= gameRoom.totalRounds * gameRoom.players.length) {
            endGame(io, gameCode);
          } else {
            startNewRound(io, gameCode);
          }
        }, 5000);

      } catch (error) {
        console.error('Submit answer error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      const connectionInfo = activeConnections.get(socket.id);
      if (connectionInfo) {
        const { gameCode, playerId, playerName } = connectionInfo;

        try {
          // Update player connection status
          const gameRoom = await GameRoom.findOne({ gameCode });
          if (gameRoom) {
            const player = gameRoom.players.find(p => p.id === playerId);
            if (player) {
              player.isConnected = false;
              await gameRoom.save();

              // Notify other players
              socket.to(gameCode).emit('player-disconnected', {
                playerId,
                playerName,
                remainingPlayers: gameRoom.players.filter(p => p.isConnected).length
              });
            }
          }

          // Clean up connections
          activeConnections.delete(socket.id);
          if (roomSockets.has(gameCode)) {
            roomSockets.get(gameCode).delete(socket.id);
            if (roomSockets.get(gameCode).size === 0) {
              roomSockets.delete(gameCode);
            }
          }

        } catch (error) {
          console.error('Disconnect handling error:', error);
        }
      }
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
};

// Helper function to start a new round
async function startNewRound(io, gameCode) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    // Determine next player
    const currentPlayerIndex = (gameRoom.currentRound - 1) % gameRoom.players.length;
    const currentPlayer = gameRoom.players[currentPlayerIndex];    // Get random question
    const questions = await Question.getRandomQuestions(1, gameRoom.usedQuestions);
    if (questions.length === 0) {
      io.to(gameCode).emit('error', { message: 'No more questions available' });
      return;
    }

    const question = questions[0];
    gameRoom.usedQuestions.push(question._id);

    // Create new round
    const newRound = {
      roundNumber: gameRoom.currentRound,
      currentPlayerId: currentPlayer.id,
      questionId: question._id,
      predictions: [],
      startedAt: new Date(),
      isCompleted: false
    };

    gameRoom.rounds.push(newRound);
    await gameRoom.save();

    // Increment question usage
    await Question.findByIdAndUpdate(question._id, { $inc: { usageCount: 1 } });

    // Send new round data to all players
    io.to(gameCode).emit('new-round', {
      roundNumber: gameRoom.currentRound,
      currentPlayer: {
        id: currentPlayer.id,
        name: currentPlayer.name
      },
      question: {
        id: question._id,
        text: question.text,
        options: {
          A: question.options.A,
          B: question.options.B
        },
        category: question.category
      },
      timeLimit: gameRoom.gameSettings.predictionTime
    });

    // Move to next round
    gameRoom.currentRound += 1;
    await gameRoom.save();

  } catch (error) {
    console.error('Start new round error:', error);
  }
}

// Helper function to end the game
async function endGame(io, gameCode) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    gameRoom.status = 'finished';
    await gameRoom.updateLeaderboard();

    const winner = gameRoom.leaderboard[0];

    io.to(gameCode).emit('game-ended', {
      winner,
      finalLeaderboard: gameRoom.leaderboard,
      gameStats: {
        totalRounds: gameRoom.rounds.length,
        totalPlayers: gameRoom.players.length,
        duration: new Date() - gameRoom.createdAt
      }
    });

  } catch (error) {
    console.error('End game error:', error);
  }
}

// Helper function to count current round submissions
function getCurrentRoundSubmissions(gameRoom) {
  const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
  if (!currentRound) return 0;

  const uniqueSubmitters = new Set();
  currentRound.predictions.forEach(pred => uniqueSubmitters.add(pred.playerId));
  return uniqueSubmitters.size;
}
