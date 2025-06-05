import GameRoom from '../models/GameRoom.js';
import Question from '../models/Question.js';

// Create a new game room
export const createGameRoom = async (req, res) => {
  try {
    const { playerName } = req.body;

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Player name is required'
      });
    }

    // Generate unique game code
    const gameCode = await GameRoom.generateGameCode();
    const hostId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new game room
    const gameRoom = new GameRoom({
      gameCode,
      hostId,
      players: [{
        id: hostId,
        name: playerName.trim(),
        score: 0,
        isReady: false,
        isConnected: true,
        joinedAt: new Date()
      }]
    });

    await gameRoom.save();

    res.status(201).json({
      status: 'success',
      message: 'Game room created successfully',
      data: {
        gameCode,
        hostId,
        roomId: gameRoom._id,
        player: gameRoom.players[0],
        maxPlayers: 4,
        gameSettings: gameRoom.gameSettings
      }
    });

  } catch (error) {
    console.error('Create game room error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create game room'
    });
  }
};

// Join an existing game room
export const joinGameRoom = async (req, res) => {
  try {
    const { gameCode, playerName } = req.body;

    if (!gameCode || !playerName) {
      return res.status(400).json({
        status: 'error',
        message: 'Game code and player name are required'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode, status: 'waiting' });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found or already started'
      });
    }

    if (gameRoom.players.length >= 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Game room is full (maximum 4 players)'
      });
    }

    // Check if player name already exists
    const existingPlayer = gameRoom.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (existingPlayer) {
      return res.status(400).json({
        status: 'error',
        message: 'Player name already taken'
      });
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPlayer = {
      id: playerId,
      name: playerName.trim(),
      score: 0,
      isReady: false,
      isConnected: true,
      joinedAt: new Date()
    };

    gameRoom.players.push(newPlayer);
    await gameRoom.updateActivity();

    res.status(200).json({
      status: 'success',
      message: 'Successfully joined the game room',
      data: {
        gameCode,
        playerId,
        roomId: gameRoom._id,
        player: newPlayer,
        totalPlayers: gameRoom.players.length,
        maxPlayers: 4,
        gameSettings: gameRoom.gameSettings,
        canStart: gameRoom.players.length === 4
      }
    });

  } catch (error) {
    console.error('Join game room error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to join game room'
    });
  }
};

// Validate game code
export const validateGameCode = async (req, res) => {
  try {
    const { gameCode } = req.params;

    if (!gameCode || gameCode.length !== 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid game code format'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }    res.status(200).json({
      status: 'success',
      data: {
        gameCode,
        isValid: true,
        roomStatus: gameRoom.status,
        playerCount: gameRoom.players.length,
        maxPlayers: 4,
        canJoin: gameRoom.status === 'waiting' && gameRoom.players.length < 4,
        isGameActive: gameRoom.status === 'playing'
      }
    });

  } catch (error) {
    console.error('Validate game code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate game code'
    });
  }
};

// Get game room details
export const getGameRoom = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode })
      .populate('rounds.questionId')
      .populate('usedQuestions');

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        gameRoom: {
          gameCode: gameRoom.gameCode,
          hostId: gameRoom.hostId,
          players: gameRoom.players,
          status: gameRoom.status,
          currentRound: gameRoom.currentRound,
          totalRounds: gameRoom.totalRounds,
          gameSettings: gameRoom.gameSettings,
          leaderboard: gameRoom.leaderboard,
          rounds: gameRoom.rounds,
          createdAt: gameRoom.createdAt,
          lastActivity: gameRoom.lastActivity
        }
      }
    });

  } catch (error) {
    console.error('Get game room error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get game room'
    });
  }
};

// Start the game (requires exactly 4 players)
export const startGame = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { hostId } = req.body;

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    // Verify host permission
    if (gameRoom.hostId !== hostId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the host can start the game'
      });
    }

    // Check if exactly 4 players
    if (gameRoom.players.length !== 4) {
      return res.status(400).json({
        status: 'error',
        message: `Need exactly 4 players to start. Currently have ${gameRoom.players.length} players.`
      });
    }

    // Check if game already started
    if (gameRoom.status !== 'waiting') {
      return res.status(400).json({
        status: 'error',
        message: 'Game has already started or finished'
      });
    }

    // Randomly select first player
    const randomIndex = Math.floor(Math.random() * gameRoom.players.length);
    const firstPlayer = gameRoom.players[randomIndex];

    // Update game status
    gameRoom.status = 'playing';
    gameRoom.currentRound = 1;
    gameRoom.currentPlayer = firstPlayer.id;
    await gameRoom.updateActivity();

    res.status(200).json({
      status: 'success',
      message: 'Game started successfully',
      data: {
        gameCode,
        currentRound: gameRoom.currentRound,
        totalRounds: gameRoom.totalRounds,
        currentPlayer: {
          id: firstPlayer.id,
          name: firstPlayer.name
        },
        players: gameRoom.players,
        gameSettings: gameRoom.gameSettings
      }
    });

  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start game'
    });
  }
};

// Get current question for the round
export const getCurrentQuestion = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode, status: 'playing' });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Active game room not found'
      });
    }

    // Check if current round already has a question
    const currentRoundData = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
    
    let question;
    
    if (currentRoundData && currentRoundData.questionId) {
      // Use existing question for this round
      question = await Question.findById(currentRoundData.questionId);
    } else {
      // Get a new random question that hasn't been used
      const usedQuestionIds = gameRoom.usedQuestions;
      question = await Question.aggregate([
        { $match: { _id: { $nin: usedQuestionIds } } },
        { $sample: { size: 1 } }
      ]);

      if (!question || question.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No available questions'
        });
      }

      question = question[0];
      
      // Add question to used questions
      gameRoom.usedQuestions.push(question._id);
      
      // Create or update round data
      if (currentRoundData) {
        currentRoundData.questionId = question._id;
      } else {
        gameRoom.rounds.push({
          roundNumber: gameRoom.currentRound,
          currentPlayerId: gameRoom.currentPlayer,
          questionId: question._id,
          predictions: [],
          startedAt: new Date(),
          isCompleted: false
        });
      }
      
      await gameRoom.save();
    }

    // Get current player info
    const currentPlayer = gameRoom.players.find(p => p.id === gameRoom.currentPlayer);

    res.status(200).json({
      status: 'success',
      data: {
        roundNumber: gameRoom.currentRound,
        totalRounds: gameRoom.totalRounds,
        currentPlayer: {
          id: currentPlayer.id,
          name: currentPlayer.name
        },
        question: {
          id: question._id,
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          category: question.category
        },
        gameSettings: {
          predictionTime: gameRoom.gameSettings.predictionTime,
          answerTime: gameRoom.gameSettings.answerTime
        }
      }
    });

  } catch (error) {
    console.error('Get current question error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get current question'
    });
  }
};

// Submit predictions from other players
export const submitPredictions = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerId, predictedChoice } = req.body;

    if (!playerId || !predictedChoice || !['A', 'B'].includes(predictedChoice)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid player ID and prediction choice (A or B) are required'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode, status: 'playing' });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Active game room not found'
      });
    }

    // Get current round
    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
    
    if (!currentRound) {
      return res.status(400).json({
        status: 'error',
        message: 'No active round found'
      });
    }

    // Check if player is the current player (can't predict for themselves)
    if (playerId === gameRoom.currentPlayer) {
      return res.status(400).json({
        status: 'error',
        message: 'Current player cannot make predictions'
      });
    }

    // Check if player already made a prediction for this round
    const existingPrediction = currentRound.predictions.find(p => p.playerId === playerId);
    
    if (existingPrediction) {
      return res.status(400).json({
        status: 'error',
        message: 'Player has already made a prediction for this round'
      });
    }

    // Add prediction
    currentRound.predictions.push({
      playerId,
      questionId: currentRound.questionId,
      targetPlayerId: gameRoom.currentPlayer,
      predictedChoice,
      submittedAt: new Date()
    });

    await gameRoom.save();

    // Check if all predictions are in (3 other players)
    const expectedPredictions = gameRoom.players.length - 1; // All players except current player
    const receivedPredictions = currentRound.predictions.length;

    res.status(200).json({
      status: 'success',
      message: 'Prediction submitted successfully',
      data: {
        roundNumber: gameRoom.currentRound,
        predictionsReceived: receivedPredictions,
        predictionsExpected: expectedPredictions,
        allPredictionsReceived: receivedPredictions === expectedPredictions,
        canCurrentPlayerAnswer: receivedPredictions === expectedPredictions
      }
    });

  } catch (error) {
    console.error('Submit predictions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit prediction'
    });
  }
};

// Submit answer from current player
export const submitAnswer = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerId, answer } = req.body;

    if (!playerId || !answer || !['A', 'B'].includes(answer)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid player ID and answer (A or B) are required'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode, status: 'playing' });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Active game room not found'
      });
    }

    // Verify it's the current player
    if (playerId !== gameRoom.currentPlayer) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the current player can submit an answer'
      });
    }

    // Get current round
    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
    
    if (!currentRound) {
      return res.status(400).json({
        status: 'error',
        message: 'No active round found'
      });
    }

    if (currentRound.playerAnswer) {
      return res.status(400).json({
        status: 'error',
        message: 'Answer already submitted for this round'
      });
    }

    // Check if all predictions are received
    const expectedPredictions = gameRoom.players.length - 1;
    if (currentRound.predictions.length < expectedPredictions) {
      return res.status(400).json({
        status: 'error',
        message: 'Waiting for all player predictions'
      });
    }

    // Submit answer and calculate scores
    currentRound.playerAnswer = answer;
    currentRound.answeredAt = new Date();
    currentRound.isCompleted = true;

    // Calculate scores for predictions
    let scores = {};
    let roundScoreDetails = [];
    
    currentRound.predictions.forEach(prediction => {
      const isCorrect = prediction.predictedChoice === answer;
      prediction.isCorrect = isCorrect;
      
      const player = gameRoom.players.find(p => p.id === prediction.playerId);
      const pointsEarned = isCorrect ? 10 : 0;
      
      if (isCorrect) {
        scores[prediction.playerId] = (scores[prediction.playerId] || 0) + pointsEarned;
      }
      
      roundScoreDetails.push({
        playerId: prediction.playerId,
        playerName: player ? player.name : 'Unknown',
        predictedChoice: prediction.predictedChoice,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned
      });
    });

    // Update player scores
    gameRoom.players.forEach(player => {
      if (scores[player.id]) {
        player.score += scores[player.id];
      }
    });

    // Set game phase to scoring for 3 seconds
    gameRoom.gamePhase = 'scoring';
    
    // Determine next player and round
    let isGameComplete = false;
    let nextPlayer = null;

    if (gameRoom.currentRound >= gameRoom.totalRounds) {
      // Game is complete - will transition to final scores after scoring phase
      isGameComplete = true;
    } else {
      // Move to next round with next player
      const currentPlayerIndex = gameRoom.players.findIndex(p => p.id === gameRoom.currentPlayer);
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameRoom.players.length;
      
      gameRoom.currentRound += 1;
      gameRoom.currentPlayer = gameRoom.players[nextPlayerIndex].id;
      nextPlayer = gameRoom.players[nextPlayerIndex];
    }

    // Update leaderboard
    gameRoom.updateLeaderboard();
    await gameRoom.save();

    res.status(200).json({
      status: 'success',
      message: 'Answer submitted successfully',
      data: {
        roundNumber: currentRound.roundNumber,
        currentPlayerAnswer: answer,
        gamePhase: 'scoring', // Show scores for 3 seconds
        scoreDisplayTime: gameRoom.gameSettings.scoreDisplayTime,
        roundScoreDetails,
        scoreUpdates: scores,
        isGameComplete,
        nextRound: isGameComplete ? null : gameRoom.currentRound,
        nextPlayer: nextPlayer ? { id: nextPlayer.id, name: nextPlayer.name } : null,
        currentScores: gameRoom.players.map(p => ({
          playerId: p.id,
          playerName: p.name,
          score: p.score,
          rank: 0 // Will be calculated in leaderboard
        })).sort((a, b) => b.score - a.score).map((p, index) => ({
          ...p,
          rank: index + 1
        }))
      }
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit answer'
    });
  }
};

// Transition from scoring phase to next round or final scores
export const completeScoring = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode, gamePhase: 'scoring' });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found or not in scoring phase'
      });
    }

    // Check if game is complete
    if (gameRoom.currentRound > gameRoom.totalRounds) {
      // Transition to final scores
      gameRoom.gamePhase = 'final_scores';
      gameRoom.status = 'finished';
      await gameRoom.save();

      res.status(200).json({
        status: 'success',
        message: 'Game completed - showing final scores',
        data: {
          gamePhase: 'final_scores',
          finalScoreDisplayTime: gameRoom.gameSettings.finalScoreDisplayTime,
          leaderboard: gameRoom.leaderboard,
          winner: gameRoom.leaderboard[0]
        }
      });
    } else {
      // Continue to next round
      gameRoom.gamePhase = 'playing';
      await gameRoom.save();

      const currentPlayer = gameRoom.players.find(p => p.id === gameRoom.currentPlayer);

      res.status(200).json({
        status: 'success',
        message: 'Moving to next round',
        data: {
          gamePhase: 'playing',
          currentRound: gameRoom.currentRound,
          totalRounds: gameRoom.totalRounds,
          currentPlayer: {
            id: currentPlayer.id,
            name: currentPlayer.name
          }
        }
      });
    }

  } catch (error) {
    console.error('Complete scoring error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete scoring'
    });
  }
};

// Transition from final scores to winner animation
export const showWinnerAnimation = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode, gamePhase: 'final_scores' });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found or not in final scores phase'
      });
    }

    gameRoom.gamePhase = 'winner_animation';
    await gameRoom.save();

    const winner = gameRoom.leaderboard[0];

    res.status(200).json({
      status: 'success',
      message: 'Showing winner animation',
      data: {
        gamePhase: 'winner_animation',
        winnerAnimationTime: gameRoom.gameSettings.winnerAnimationTime,
        winner: {
          playerId: winner.playerId,
          playerName: winner.playerName,
          score: winner.score,
          accuracy: winner.correctPredictions ? 
            (winner.correctPredictions / (gameRoom.totalRounds - gameRoom.totalRounds / 4) * 100).toFixed(1) : 0
        },
        leaderboard: gameRoom.leaderboard
      }
    });

  } catch (error) {
    console.error('Show winner animation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to show winner animation'
    });
  }
};

// Complete game and return to main screen
export const completeGame = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode, gamePhase: 'winner_animation' });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found or not in winner animation phase'
      });
    }

    gameRoom.gamePhase = 'finished';
    gameRoom.status = 'finished';
    await gameRoom.save();

    res.status(200).json({
      status: 'success',
      message: 'Game completed - ready to return to main screen',
      data: {
        gamePhase: 'finished',
        finalStats: {
          totalRounds: gameRoom.totalRounds,
          totalPlayers: gameRoom.players.length,
          winner: gameRoom.leaderboard[0],
          completedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Complete game error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete game'
    });
  }
};

// Legacy compatibility - keeping old function names
export const getQuestion = getCurrentQuestion;
export const submitPrediction = submitPredictions;

// Get current game state
export const getGameState = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode })
      .populate('rounds.questionId', 'questionText choices')
      .lean();

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    // Get current round info
    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);
    
    res.status(200).json({
      status: 'success',
      data: {
        gameCode: gameRoom.gameCode,
        gamePhase: gameRoom.gamePhase,
        status: gameRoom.status,
        currentRound: gameRoom.currentRound,
        totalRounds: gameRoom.totalRounds,
        currentPlayer: gameRoom.currentPlayer,
        players: gameRoom.players.map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
          isConnected: p.isConnected
        })),
        currentQuestion: currentRound ? {
          questionText: currentRound.questionId?.questionText,
          choices: currentRound.questionId?.choices,
          roundNumber: currentRound.roundNumber
        } : null,
        gameSettings: gameRoom.gameSettings,
        leaderboard: gameRoom.leaderboard
      }
    });

  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get game state'
    });
  }
};

// Get current leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    // Update leaderboard before sending
    await gameRoom.updateLeaderboard();

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: gameRoom.leaderboard,
        gamePhase: gameRoom.gamePhase,
        currentRound: gameRoom.currentRound,
        totalRounds: gameRoom.totalRounds,
        isFinished: gameRoom.status === 'finished'
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get leaderboard'
    });
  }
};

// Leave game room
export const leaveGameRoom = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Player ID is required'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    // Remove player from room
    await gameRoom.removePlayer(playerId);

    res.status(200).json({
      status: 'success',
      message: 'Player left the game room',
      data: {
        gameCode,
        remainingPlayers: gameRoom.players.length
      }
    });

  } catch (error) {
    console.error('Leave game room error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to leave game room'
    });
  }
};

// Get game players
export const getPlayers = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Players retrieved successfully',
      data: {
        gameCode,
        players: gameRoom.players,
        totalPlayers: gameRoom.players.length,
        maxPlayers: gameRoom.maxPlayers,
        hostId: gameRoom.hostId
      }
    });

  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve players'
    });
  }
};

// Get game settings
export const getGameSettings = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Game settings retrieved successfully',
      data: {
        gameCode,
        settings: gameRoom.gameSettings,
        totalRounds: gameRoom.totalRounds,
        maxPlayers: gameRoom.maxPlayers,
        gamePhase: gameRoom.gamePhase,
        status: gameRoom.status
      }
    });

  } catch (error) {
    console.error('Get game settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve game settings'
    });
  }
};

// Get game rounds
export const getRounds = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode }).populate('rounds.questionId');

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Rounds retrieved successfully',
      data: {
        gameCode,
        rounds: gameRoom.rounds,
        totalRounds: gameRoom.totalRounds,
        currentRound: gameRoom.currentRound,
        completedRounds: gameRoom.rounds.filter(r => r.isCompleted).length
      }
    });

  } catch (error) {
    console.error('Get rounds error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve rounds'
    });
  }
};

// Get current round
export const getCurrentRound = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode }).populate('rounds.questionId');

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);

    res.status(200).json({
      status: 'success',
      message: 'Current round retrieved successfully',
      data: {
        gameCode,
        currentRound: currentRound || null,
        roundNumber: gameRoom.currentRound,
        gamePhase: gameRoom.gamePhase,
        currentPlayer: gameRoom.currentPlayer,
        totalRounds: gameRoom.totalRounds
      }
    });

  } catch (error) {
    console.error('Get current round error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve current round'
    });
  }
};

// Get game statistics
export const getGameStats = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    const completedRounds = gameRoom.rounds.filter(r => r.isCompleted).length;
    const totalPredictions = gameRoom.rounds.reduce((sum, round) => sum + round.predictions.length, 0);
    const correctPredictions = gameRoom.rounds.reduce((sum, round) => 
      sum + round.predictions.filter(p => p.isCorrect).length, 0);

    const stats = {
      gameCode,
      status: gameRoom.status,
      gamePhase: gameRoom.gamePhase,
      totalPlayers: gameRoom.players.length,
      maxPlayers: gameRoom.maxPlayers,
      currentRound: gameRoom.currentRound,
      totalRounds: gameRoom.totalRounds,
      completedRounds,
      progress: `${completedRounds}/${gameRoom.totalRounds}`,
      totalPredictions,
      correctPredictions,
      predictionAccuracy: totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) + '%' : '0%',
      averageScore: gameRoom.players.length > 0 ? 
        Math.round(gameRoom.players.reduce((sum, p) => sum + p.score, 0) / gameRoom.players.length) : 0,
      topScore: Math.max(...gameRoom.players.map(p => p.score), 0),
      createdAt: gameRoom.createdAt,
      lastActivity: gameRoom.lastActivity,
      gameSettings: gameRoom.gameSettings
    };

    res.status(200).json({
      status: 'success',
      message: 'Game statistics retrieved successfully',
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve game statistics'
    });
  }
};

// Mark player ready
export const markPlayerReady = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Player ID is required'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    const player = gameRoom.players.find(p => p.id === playerId);

    if (!player) {
      return res.status(404).json({
        status: 'error',
        message: 'Player not found in this room'
      });
    }

    // Toggle ready status
    player.isReady = !player.isReady;
    await gameRoom.save();

    const readyPlayers = gameRoom.players.filter(p => p.isReady).length;
    const allReady = readyPlayers === gameRoom.players.length && gameRoom.players.length === gameRoom.maxPlayers;

    res.status(200).json({
      status: 'success',
      message: `Player ${player.isReady ? 'marked as ready' : 'marked as not ready'}`,
      data: {
        gameCode,
        playerId,
        playerName: player.name,
        isReady: player.isReady,
        readyPlayers,
        totalPlayers: gameRoom.players.length,
        allReady,
        canStartGame: allReady
      }
    });

  } catch (error) {
    console.error('Mark player ready error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark player ready'
    });
  }
};