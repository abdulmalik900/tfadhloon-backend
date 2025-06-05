import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  score: {
    type: Number,
    default: 0
  },
  isReady: {
    type: Boolean,
    default: false
  },
  isConnected: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: null
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const predictionSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  targetPlayerId: {
    type: String,
    required: true
  },
  predictedChoice: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const roundSchema = new mongoose.Schema({
  roundNumber: {
    type: Number,
    required: true
  },
  currentPlayerId: {
    type: String,
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  playerAnswer: {
    type: String,
    enum: ['A', 'B', null],
    default: null
  },
  predictions: [predictionSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  answeredAt: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const gameRoomSchema = new mongoose.Schema({
  gameCode: {
    type: String,
    required: true,
    unique: true,
    length: 4
  },
  hostId: {
    type: String,
    required: true
  },
  players: [playerSchema],  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  currentRound: {
    type: Number,
    default: 0
  },
  currentPlayer: {
    type: String,
    default: null
  },
  totalRounds: {
    type: Number,
    default: 12  // 4 players × 3 cycles = 12 rounds
  },rounds: [roundSchema],  maxPlayers: {
    type: Number,
    default: 4,
    min: 4,
    max: 4
  },
  gameSettings: {
    predictionTime: {
      type: Number,
      default: 30 // seconds
    },
    answerTime: {
      type: Number,
      default: 15 // seconds
    },
    roundBreak: {
      type: Number,
      default: 5 // seconds
    },
    scoreDisplayTime: {
      type: Number,
      default: 3 // seconds - time to show scores after each round
    },
    finalScoreDisplayTime: {
      type: Number,
      default: 10 // seconds - time to show final leaderboard
    },
    winnerAnimationTime: {
      type: Number,
      default: 10 // seconds - time for winner animation
    }
  },
  usedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  leaderboard: [{
    playerId: String,
    playerName: String,
    score: Number,
    correctPredictions: Number
  }],  createdAt: {
    type: Date,
    default: Date.now
    // No expiration - game codes never expire
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  gamePhase: {
    type: String,
    enum: ['waiting', 'playing', 'predicting', 'answering', 'scoring', 'final_scores', 'winner_animation', 'finished'],
    default: 'waiting'
  }
});

// Generate unique 4-digit game code
gameRoomSchema.statics.generateGameCode = async function() {
  let gameCode;
  let isUnique = false;
  
  while (!isUnique) {
    gameCode = Math.floor(1000 + Math.random() * 9000).toString();
    const existingRoom = await this.findOne({ gameCode });
    if (!existingRoom) {
      isUnique = true;
    }
  }
  
  return gameCode;
};

// Update last activity
gameRoomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Add player to room
gameRoomSchema.methods.addPlayer = function(playerData) {
  if (this.players.length >= this.maxPlayers) {
    throw new Error('Room is full');
  }
  
  const existingPlayer = this.players.find(p => p.id === playerData.id);
  if (existingPlayer) {
    throw new Error('Player already in room');
  }
  
  this.players.push(playerData);
  return this.save();
};

// Remove player from room
gameRoomSchema.methods.removePlayer = function(playerId) {
  this.players = this.players.filter(p => p.id !== playerId);
  
  // If host leaves, assign new host
  if (this.hostId === playerId && this.players.length > 0) {
    this.hostId = this.players[0].id;
  }
  
  return this.save();
};

// Calculate and update leaderboard
gameRoomSchema.methods.updateLeaderboard = function() {
  const leaderboard = this.players.map(player => {
    const playerPredictions = this.rounds
      .flatMap(round => round.predictions)
      .filter(pred => pred.playerId === player.id);
    
    const correctPredictions = playerPredictions.filter(pred => pred.isCorrect).length;
    
    return {
      playerId: player.id,
      playerName: player.name,
      score: player.score,
      correctPredictions
    };
  }).sort((a, b) => b.score - a.score);
  
  this.leaderboard = leaderboard;
  return this.save();
};

export default mongoose.model('GameRoom', gameRoomSchema);
