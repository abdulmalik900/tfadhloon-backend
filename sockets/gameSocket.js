// Game Socket with Complete 12-Round Flow and Score Animations
import GameRoom from '../models/GameRoom.js';
import Question from '../models/Question.js';

// Store active timers and game states
const gameTimers = new Map();
const gameStates = new Map();

export const setupGameSocket = (io) => {
  console.log('🎮 Game Socket initialized with score animations');

  io.on('connection', (socket) => {
    console.log(`🔌 Player connected: ${socket.id}`);

    // Join game room
    socket.on('joinRoom', async (data) => {
      try {
        const { gameCode, playerId, playerName } = data;
        
        const gameRoom = await GameRoom.findOne({ gameCode });
        if (!gameRoom) {
          socket.emit('error', { message: 'Game room not found' });
          return;
        }

        // Join socket room
        socket.join(gameCode);
        socket.gameCode = gameCode;
        socket.playerId = playerId;

        // Update player connection status
        const player = gameRoom.players.find(p => p.id === playerId);
        if (player) {
          player.isConnected = true;
          await gameRoom.save();
        }

        console.log(`🎯 Player ${playerName} joined room ${gameCode}`);

        // Emit updated room state to all players
        io.to(gameCode).emit('roomUpdate', {
          players: gameRoom.players,
          status: gameRoom.status,
          gamePhase: gameRoom.gamePhase
        });

        // Auto-start game if 4 players are ready
        if (gameRoom.players.length === 4 && gameRoom.status === 'waiting') {
          await startGameFlow(gameCode, io);
        }

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle predictions
    socket.on('submitPrediction', async (data) => {
      try {
        const { gameCode, playerId, predictedChoice } = data;
        
        const gameRoom = await GameRoom.findOne({ gameCode });
        if (!gameRoom) {
          socket.emit('error', { message: 'Game room not found' });
          return;
        }

        const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
        if (!currentRound) {
          socket.emit('error', { message: 'No active round' });
          return;
        }

        // Add prediction
        const existingPrediction = currentRound.predictions.find(p => p.playerId === playerId);
        if (existingPrediction) {
          socket.emit('error', { message: 'Prediction already submitted' });
          return;
        }

        currentRound.predictions.push({
          playerId,
          questionId: currentRound.questionId,
          targetPlayerId: gameRoom.currentPlayer,
          predictedChoice,
          submittedAt: new Date()
        });

        await gameRoom.save();

        console.log(`📝 Player ${playerId} submitted prediction: ${predictedChoice}`);

        // Check if all predictions are in
        const expectedPredictions = gameRoom.players.length - 1;
        const receivedPredictions = currentRound.predictions.length;

        io.to(gameCode).emit('predictionUpdate', {
          received: receivedPredictions,
          expected: expectedPredictions,
          playerId
        });

        // If all predictions are in, switch to answering phase
        if (receivedPredictions === expectedPredictions) {
          await switchToAnswering(gameCode, io);
        }

      } catch (error) {
        console.error('Submit prediction error:', error);
        socket.emit('error', { message: 'Failed to submit prediction' });
      }
    });

    // Handle answers
    socket.on('submitAnswer', async (data) => {
      try {
        const { gameCode, playerId, answer } = data;
        
        const gameRoom = await GameRoom.findOne({ gameCode });
        if (!gameRoom) {
          socket.emit('error', { message: 'Game room not found' });
          return;
        }

        // Verify it's the current player
        if (playerId !== gameRoom.currentPlayer) {
          socket.emit('error', { message: 'Not your turn to answer' });
          return;
        }

        const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
        if (!currentRound) {
          socket.emit('error', { message: 'No active round' });
          return;
        }

        // Save answer
        currentRound.playerAnswer = answer;
        currentRound.answeredAt = new Date();
        await gameRoom.save();

        console.log(`✅ Player ${playerId} answered: ${answer}`);

        // Calculate scores and proceed to scoring
        await calculateScoresAndProceed(gameCode, io);

      } catch (error) {
        console.error('Submit answer error:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 Player disconnected: ${socket.id}`);
      
      if (socket.gameCode && socket.playerId) {
        try {
          const gameRoom = await GameRoom.findOne({ gameCode: socket.gameCode });
          if (gameRoom) {
            const player = gameRoom.players.find(p => p.id === socket.playerId);
            if (player) {
              player.isConnected = false;
              await gameRoom.save();

              // Notify other players
              socket.to(socket.gameCode).emit('playerDisconnected', {
                playerId: socket.playerId,
                playerName: player.name
              });
            }
          }
        } catch (error) {
          console.error('Disconnect handling error:', error);
        }
      }
    });
  });
};

// Start the complete 12-round game flow
async function startGameFlow(gameCode, io) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    console.log(`🚀 Starting 12-round game flow for room ${gameCode}`);
    
    gameRoom.status = 'playing';
    gameRoom.gamePhase = 'playing';
    gameRoom.currentRound = 1;
    gameRoom.currentPlayer = gameRoom.players[0].id; // Start with first player
    gameRoom.rounds = [];
    await gameRoom.save();

    // Notify all players game is starting
    io.to(gameCode).emit('gameStarted', {
      message: 'Game is starting! Get ready for 12 rounds of predictions!',
      totalRounds: 12,
      currentRound: 1
    });

    // Start first round after 3 seconds
    setTimeout(() => {
      startRound(gameCode, io);
    }, 3000);

  } catch (error) {
    console.error('Start game flow error:', error);
  }
}

// Start a new round
async function startRound(gameCode, io) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    console.log(`🎯 Starting round ${gameRoom.currentRound} for room ${gameCode}`);

    // Get random question
    const usedQuestionIds = gameRoom.usedQuestions || [];
    const availableQuestions = await Question.find({
      _id: { $nin: usedQuestionIds }
    });

    if (availableQuestions.length === 0) {
      console.error('No more questions available');
      return;
    }

    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    
    // Add question to used questions
    gameRoom.usedQuestions.push(randomQuestion._id);

    // Create round
    const round = {
      roundNumber: gameRoom.currentRound,
      currentPlayerId: gameRoom.currentPlayer,
      questionId: randomQuestion._id,
      predictions: [],
      startedAt: new Date(),
      isCompleted: false
    };

    gameRoom.rounds.push(round);
    gameRoom.gamePhase = 'predicting';
    await gameRoom.save();

    // Get current player info
    const currentPlayer = gameRoom.players.find(p => p.id === gameRoom.currentPlayer);

    // Emit round started
    io.to(gameCode).emit('roundStarted', {
      roundNumber: gameRoom.currentRound,
      totalRounds: gameRoom.totalRounds,
      currentPlayer: {
        id: currentPlayer.id,
        name: currentPlayer.name
      },
      question: {
        questionText: randomQuestion.questionText,
        choices: randomQuestion.choices
      },
      gamePhase: 'predicting',
      predictionTime: gameRoom.gameSettings.predictionTime
    });

    // Start prediction timer
    startPredictionTimer(gameCode, io);

  } catch (error) {
    console.error('Start round error:', error);
  }
}

// Start prediction timer
function startPredictionTimer(gameCode, io) {
  const timerId = setTimeout(async () => {
    console.log(`⏰ Prediction time up for room ${gameCode}`);
    await switchToAnswering(gameCode, io);
  }, 30000); // 30 seconds for predictions

  // Store timer
  if (!gameTimers.has(gameCode)) {
    gameTimers.set(gameCode, {});
  }
  gameTimers.get(gameCode).predictionTimer = timerId;
}

// Switch to answering phase
async function switchToAnswering(gameCode, io) {
  try {
    // Clear prediction timer
    const timers = gameTimers.get(gameCode);
    if (timers && timers.predictionTimer) {
      clearTimeout(timers.predictionTimer);
    }

    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    gameRoom.gamePhase = 'answering';
    await gameRoom.save();

    console.log(`🎯 Switching to answering phase for room ${gameCode}`);

    // Get current player info
    const currentPlayer = gameRoom.players.find(p => p.id === gameRoom.currentPlayer);
    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
    const question = await Question.findById(currentRound.questionId);

    // Emit answering phase
    io.to(gameCode).emit('answeringPhase', {
      currentPlayer: {
        id: currentPlayer.id,
        name: currentPlayer.name
      },
      question: {
        questionText: question.questionText,
        choices: question.choices
      },
      answerTime: gameRoom.gameSettings.answerTime,
      predictionsReceived: currentRound.predictions.length
    });

    // Start answer timer
    startAnswerTimer(gameCode, io);

  } catch (error) {
    console.error('Switch to answering error:', error);
  }
}

// Start answer timer
function startAnswerTimer(gameCode, io) {
  const timerId = setTimeout(async () => {
    console.log(`⏰ Answer time up for room ${gameCode}`);
    
    // If no answer provided, default to 'A'
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (gameRoom) {
      const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
      if (currentRound && !currentRound.playerAnswer) {
        currentRound.playerAnswer = 'A'; // Default answer
        currentRound.answeredAt = new Date();
        await gameRoom.save();
      }
    }

    await calculateScoresAndProceed(gameCode, io);
  }, 15000); // 15 seconds for answer

  // Store timer
  if (!gameTimers.has(gameCode)) {
    gameTimers.set(gameCode, {});
  }
  gameTimers.get(gameCode).answerTimer = timerId;
}

// Calculate scores and proceed to next phase
async function calculateScoresAndProceed(gameCode, io) {
  try {
    // Clear answer timer
    const timers = gameTimers.get(gameCode);
    if (timers && timers.answerTimer) {
      clearTimeout(timers.answerTimer);
    }

    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
    if (!currentRound) return;

    console.log(`📊 Calculating scores for round ${gameRoom.currentRound} in room ${gameCode}`);

    // Calculate scores based on correct predictions
    const correctAnswer = currentRound.playerAnswer;
    const scoreUpdates = [];

    for (const prediction of currentRound.predictions) {
      const isCorrect = prediction.predictedChoice === correctAnswer;
      prediction.isCorrect = isCorrect;

      if (isCorrect) {
        // Update player score
        const player = gameRoom.players.find(p => p.id === prediction.playerId);
        if (player) {
          player.score += 10; // 10 points for correct prediction
          scoreUpdates.push({
            playerId: prediction.playerId,
            playerName: player.name,
            scoreChange: +10,
            newScore: player.score,
            isCorrect: true
          });
        }
      } else {
        const player = gameRoom.players.find(p => p.id === prediction.playerId);
        if (player) {
          scoreUpdates.push({
            playerId: prediction.playerId,
            playerName: player.name,
            scoreChange: 0,
            newScore: player.score,
            isCorrect: false
          });
        }
      }
    }

    currentRound.isCompleted = true;
    gameRoom.gamePhase = 'scoring';
    await gameRoom.save();

    // Get current player info for display
    const currentPlayer = gameRoom.players.find(p => p.id === gameRoom.currentPlayer);

    // Emit scoring results with enhanced animation data
    io.to(gameCode).emit('scoringResults', {
      roundNumber: gameRoom.currentRound,
      currentPlayer: {
        id: currentPlayer.id,
        name: currentPlayer.name
      },
      correctAnswer,
      scoreUpdates,
      totalPredictions: currentRound.predictions.length,
      correctPredictions: scoreUpdates.filter(s => s.isCorrect).length,
      roundSummary: {
        question: await Question.findById(currentRound.questionId),
        answer: correctAnswer,
        predictions: currentRound.predictions.map(p => ({
          playerName: gameRoom.players.find(pl => pl.id === p.playerId)?.name,
          prediction: p.predictedChoice,
          isCorrect: p.isCorrect
        }))
      }
    });

    // Wait for score display time, then proceed to next round or end game
    setTimeout(async () => {
      await proceedToNextRoundOrEndGame(gameCode, io);
    }, gameRoom.gameSettings.scoreDisplayTime * 1000); // 3 seconds

  } catch (error) {
    console.error('Calculate scores error:', error);
  }
}

// Proceed to next round or end the game
async function proceedToNextRoundOrEndGame(gameCode, io) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    console.log(`🎮 Round ${gameRoom.currentRound} completed for room ${gameCode}`);

    // Check if all 12 rounds are completed
    if (gameRoom.currentRound >= gameRoom.totalRounds) {
      await endGame(gameCode, io);
      return;
    }

    // Move to next round
    gameRoom.currentRound += 1;

    // Rotate to next player (cycle through all 4 players)
    const currentPlayerIndex = gameRoom.players.findIndex(p => p.id === gameRoom.currentPlayer);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameRoom.players.length;
    gameRoom.currentPlayer = gameRoom.players[nextPlayerIndex].id;

    gameRoom.gamePhase = 'playing';
    await gameRoom.save();

    // Notify players about next round
    io.to(gameCode).emit('nextRound', {
      nextRound: gameRoom.currentRound,
      totalRounds: gameRoom.totalRounds,
      nextPlayer: {
        id: gameRoom.currentPlayer,
        name: gameRoom.players[nextPlayerIndex].name
      },
      currentScores: gameRoom.players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        score: p.score
      })).sort((a, b) => b.score - a.score)
    });

    // Start next round after brief pause
    setTimeout(() => {
      startRound(gameCode, io);
    }, 2000);

  } catch (error) {
    console.error('Proceed to next round error:', error);
  }
}

// End the game and show final results
async function endGame(gameCode, io) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    console.log(`🏁 Game ended for room ${gameCode}`);

    // Update leaderboard
    await gameRoom.updateLeaderboard();
    
    gameRoom.gamePhase = 'final_scores';
    gameRoom.status = 'finished';
    await gameRoom.save();

    // Emit final scores
    io.to(gameCode).emit('finalScores', {
      message: 'Game Complete! Final Results:',
      leaderboard: gameRoom.leaderboard,
      gameStats: {
        totalRounds: gameRoom.totalRounds,
        totalPlayers: gameRoom.players.length,
        averageScore: Math.round(gameRoom.leaderboard.reduce((sum, p) => sum + p.score, 0) / gameRoom.leaderboard.length),
        topScore: gameRoom.leaderboard[0]?.score || 0
      },
      displayTime: gameRoom.gameSettings.finalScoreDisplayTime
    });

    // Show winner animation after final score display
    setTimeout(async () => {
      await showWinnerAnimation(gameCode, io);
    }, gameRoom.gameSettings.finalScoreDisplayTime * 1000); // 10 seconds

  } catch (error) {
    console.error('End game error:', error);
  }
}

// Show winner animation
async function showWinnerAnimation(gameCode, io) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    gameRoom.gamePhase = 'winner_animation';
    await gameRoom.save();

    const winner = gameRoom.leaderboard[0];
    
    console.log(`🏆 Showing winner animation for ${winner.playerName} in room ${gameCode}`);

    // Emit winner animation
    io.to(gameCode).emit('winnerAnimation', {
      winner: {
        playerId: winner.playerId,
        playerName: winner.playerName,
        finalScore: winner.score,
        correctPredictions: winner.correctPredictions
      },
      celebration: {
        message: `🎉 Congratulations ${winner.playerName}! 🎉`,
        subMessage: `Winner with ${winner.score} points!`,
        animationType: 'confetti_explosion',
        duration: gameRoom.gameSettings.winnerAnimationTime
      },
      finalLeaderboard: gameRoom.leaderboard
    });

    // Complete game after winner animation
    setTimeout(async () => {
      await completeGame(gameCode, io);
    }, gameRoom.gameSettings.winnerAnimationTime * 1000); // 10 seconds

  } catch (error) {
    console.error('Show winner animation error:', error);
  }
}

// Complete game and allow return to main screen
async function completeGame(gameCode, io) {
  try {
    const gameRoom = await GameRoom.findOne({ gameCode });
    if (!gameRoom) return;

    gameRoom.gamePhase = 'finished';
    await gameRoom.save();

    console.log(`✅ Game completed for room ${gameCode}`);

    // Emit game completion
    io.to(gameCode).emit('gameCompleted', {
      message: 'Thank you for playing TFADHLOON!',
      finalStats: {
        gameCode,
        totalRounds: gameRoom.totalRounds,
        winner: gameRoom.leaderboard[0],
        completedAt: new Date().toISOString()
      },
      canReturnToMain: true
    });

    // Clean up timers and states
    gameTimers.delete(gameCode);
    gameStates.delete(gameCode);

  } catch (error) {
    console.error('Complete game error:', error);
  }
}

// Clean up function for expired games
export const cleanupExpiredGames = () => {
  console.log('🧹 Cleaning up expired game timers and states');
  
  // This could be called periodically to clean up memory
  // Implementation would check for expired games and clean up their timers
};
