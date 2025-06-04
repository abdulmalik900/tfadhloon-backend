import GameRoom from '../models/GameRoom.js';
import Question from '../models/Question.js';
import GameSession from '../models/GameSession.js';

// Create a new game room
export const createGameRoom = async (req, res) => {
  try {
    const { playerName, maxPlayers = 101 } = req.body;

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
      maxPlayers,
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

    if (gameRoom.players.length >= gameRoom.maxPlayers) {
      return res.status(400).json({
        status: 'error',
        message: 'Game room is full'
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
      message: 'Joined game room successfully',
      data: {
        gameCode,
        playerId,
        roomId: gameRoom._id,
        player: newPlayer,
        players: gameRoom.players,
        gameSettings: gameRoom.gameSettings
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
          language: gameRoom.language,
          gameSettings: gameRoom.gameSettings,
          leaderboard: gameRoom.leaderboard,
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

// Start the game
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

    if (gameRoom.hostId !== hostId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the host can start the game'
      });
    }    if (gameRoom.players.length < 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum 4 players required to start the game (including host)'
      });
    }

    if (gameRoom.status !== 'waiting') {
      return res.status(400).json({
        status: 'error',
        message: 'Game has already started'
      });
    }    // Start the game
    gameRoom.status = 'playing';
    gameRoom.currentRound = 1;
    // Calculate total rounds: 3 cycles * number of players
    gameRoom.totalRounds = gameRoom.players.length * 3;
    await gameRoom.updateActivity();

    // Create game session for tracking
    const gameSession = new GameSession({
      gameRoomId: gameRoom._id,
      gameCode: gameRoom.gameCode,
      totalPlayers: gameRoom.players.length,
      totalRounds: gameRoom.totalRounds,
      language: gameRoom.language
    });
    await gameSession.save();

    res.status(200).json({
      status: 'success',
      message: 'Game started successfully',
      data: {
        gameRoom: {
          gameCode: gameRoom.gameCode,
          status: gameRoom.status,
          currentRound: gameRoom.currentRound,
          players: gameRoom.players
        },
        sessionId: gameSession._id
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

// Get a random question for the current round
export const getQuestion = async (req, res) => {
  try {
    const { gameCode } = req.params;

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }    // Get random question excluding already used ones
    const questions = await Question.getRandomQuestions(
      1, 
      gameRoom.usedQuestions
    );

    if (questions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No more questions available'
      });
    }

    const question = questions[0];
    
    // Add to used questions
    gameRoom.usedQuestions.push(question._id);
    await gameRoom.updateActivity();

    // Increment question usage
    await Question.findByIdAndUpdate(question._id, { $inc: { usageCount: 1 } });

    res.status(200).json({
      status: 'success',
      data: {
        question: {
          id: question._id,
          text: question.text,
          options: {
            A: question.options.A,
            B: question.options.B
          },
          category: question.category
        }
      }
    });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get question'
    });
  }
};

// Submit player predictions
export const submitPredictions = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerId, predictions, questionId } = req.body;

    if (!predictions || predictions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Predictions are required'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    // Find current round
    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);

    if (!currentRound) {
      return res.status(400).json({
        status: 'error',
        message: 'Current round not found'
      });
    }

    // Validate predictions
    for (const prediction of predictions) {
      if (!prediction.targetPlayerId || !prediction.predictedChoice) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid prediction format'
        });
      }

      if (!['A', 'B'].includes(prediction.predictedChoice)) {
        return res.status(400).json({
          status: 'error',
          message: 'Predicted choice must be A or B'
        });
      }
    }

    // Add predictions to current round
    predictions.forEach(prediction => {
      currentRound.predictions.push({
        playerId,
        questionId,
        targetPlayerId: prediction.targetPlayerId,
        predictedChoice: prediction.predictedChoice,
        submittedAt: new Date()
      });
    });

    await gameRoom.updateActivity();

    res.status(200).json({
      status: 'success',
      message: 'Predictions submitted successfully',
      data: {
        submittedPredictions: predictions.length
      }
    });

  } catch (error) {
    console.error('Submit predictions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit predictions'
    });
  }
};

// Submit player answer
export const submitAnswer = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerId, answer } = req.body;

    if (!answer || !['A', 'B'].includes(answer)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid answer (A or B) is required'
      });
    }

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    // Find current round
    const currentRound = gameRoom.rounds.find(r => r.roundNumber === gameRoom.currentRound);

    if (!currentRound || currentRound.currentPlayerId !== playerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Not your turn to answer'
      });
    }

    // Set player answer
    currentRound.playerAnswer = answer;
    currentRound.answeredAt = new Date();

    // Calculate scores for correct predictions
    currentRound.predictions.forEach(prediction => {
      if (prediction.predictedChoice === answer) {
        prediction.isCorrect = true;
        
        // Award points to predictor
        const predictor = gameRoom.players.find(p => p.id === prediction.playerId);
        if (predictor) {
          predictor.score += 10; // 10 points for correct prediction
        }
      } else {
        prediction.isCorrect = false;
      }
    });

    currentRound.isCompleted = true;
    await gameRoom.updateLeaderboard();
    await gameRoom.updateActivity();

    res.status(200).json({
      status: 'success',
      message: 'Answer submitted successfully',
      data: {
        answer,
        correctPredictions: currentRound.predictions.filter(p => p.isCorrect).length,
        leaderboard: gameRoom.leaderboard
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

// Get game leaderboard
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

    await gameRoom.updateLeaderboard();

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: gameRoom.leaderboard,
        currentRound: gameRoom.currentRound,
        totalRounds: gameRoom.totalRounds,
        gameStatus: gameRoom.status
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

    const gameRoom = await GameRoom.findOne({ gameCode });

    if (!gameRoom) {
      return res.status(404).json({
        status: 'error',
        message: 'Game room not found'
      });
    }

    await gameRoom.removePlayer(playerId);

    // If no players left, delete the room
    if (gameRoom.players.length === 0) {
      await GameRoom.findByIdAndDelete(gameRoom._id);
    }

    res.status(200).json({
      status: 'success',
      message: 'Left game room successfully'
    });

  } catch (error) {
    console.error('Leave game room error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to leave game room'
    });
  }
};