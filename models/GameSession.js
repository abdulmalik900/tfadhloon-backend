import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  gameRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameRoom',
    required: true
  },
  gameCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  totalPlayers: {
    type: Number,
    required: true
  },
  totalRounds: {
    type: Number,
    required: true
  },
  completedRounds: {
    type: Number,
    default: 0
  },
  winner: {
    playerId: String,
    playerName: String,
    finalScore: Number
  },
  gameStats: {
    totalPredictions: {
      type: Number,
      default: 0
    },
    correctPredictions: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    playerStats: [{
      playerId: String,
      playerName: String,
      finalScore: Number,
      correctPredictions: Number,
      totalPredictions: Number,
      averageResponseTime: Number,
      joinedAt: Date,
      leftAt: Date
    }]
  },  language: {
    type: String,
    enum: ['en'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2_592_000 // Auto-delete after 30 days
  }
});

// Calculate game statistics
gameSessionSchema.methods.calculateStats = function(gameRoom) {
  const stats = {
    totalPredictions: 0,
    correctPredictions: 0,
    playerStats: []
  };
  
  gameRoom.players.forEach(player => {
    const playerPredictions = gameRoom.rounds
      .flatMap(round => round.predictions)
      .filter(pred => pred.playerId === player.id);
    
    const correctPredictions = playerPredictions.filter(pred => pred.isCorrect).length;
    
    stats.totalPredictions += playerPredictions.length;
    stats.correctPredictions += correctPredictions;
    
    stats.playerStats.push({
      playerId: player.id,
      playerName: player.name,
      finalScore: player.score,
      correctPredictions,
      totalPredictions: playerPredictions.length,
      averageResponseTime: 0, // Can be calculated from timestamps
      joinedAt: player.joinedAt,
      leftAt: player.isConnected ? null : new Date()
    });
  });
  
  this.gameStats = stats;
  return this.save();
};

export default mongoose.model('GameSession', gameSessionSchema);
