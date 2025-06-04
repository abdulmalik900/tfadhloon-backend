# 🎮 TFADHLOON Game API - Simple Guide

## 🚀 Quick Start

**Base URL:** `http://localhost:3005/api/games`  
**Real-time:** `ws://localhost:3005` (Socket.IO)  
**Game:** 4 players, 3 full cycles (each player answers 3 times = 12 rounds), prediction-based scoring

---

## 📍 Core Endpoints

### 1. Create Game (Host)
```http
POST /api/games/create
Content-Type: application/json

{
  "playerName": "Host Name"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "gameCode": "1234",
    "hostId": "player_1733328000000_abc123",
    "player": {
      "id": "player_1733328000000_abc123", 
      "name": "Host Name",
      "score": 0
    }
  }
}
```

### 2. Join Game
```http
POST /api/games/join
Content-Type: application/json

{
  "gameCode": "1234",
  "playerName": "Player Name"
}
```
**Response:**
```json
{
  "status": "success", 
  "data": {
    "gameCode": "1234",
    "playerId": "player_1733328001000_def456",
    "player": {
      "id": "player_1733328001000_def456",
      "name": "Player Name", 
      "score": 0
    },
    "gameRoom": {
      "players": [...],
      "status": "waiting",
      "playersCount": 2
    }
  }
}
```

### 3. Validate Code (Before Joining)
```http
GET /api/games/validate/1234
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "isValid": true,
    "canJoin": true,
    "playersCount": 2,
    "maxPlayers": 4
  }
}
```

### 4. Get Game Status
```http
GET /api/games/1234
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "gameRoom": {
      "gameCode": "1234",
      "players": [...],
      "status": "playing",
      "currentRound": 5,
      "totalRounds": 12
    }
  }
}
```

### 5. Get Current Question
```http
GET /api/games/1234/question
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "question": {
      "id": "question_id",
      "text": "Would you rather eat pizza or burgers?",
      "options": {
        "A": "Pizza",
        "B": "Burgers"
      }
    }
  }
}
```

### 6. Submit Predictions
```http
POST /api/games/1234/predictions
Content-Type: application/json

{
  "playerId": "player_id",
  "questionId": "question_id",
  "predictions": [
    {
      "targetPlayerId": "current_player_id",
      "predictedChoice": "A"
    }
  ]
}
```

### 7. Submit Answer
```http
POST /api/games/1234/answer
Content-Type: application/json

{
  "playerId": "current_player_id",
  "answer": "A"
}
```

### 8. Get Leaderboard
```http
GET /api/games/1234/leaderboard
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "leaderboard": [
      {
        "playerId": "player_id",
        "playerName": "Player Name",
        "score": 30,
        "correctPredictions": 3
      }
    ],
    "currentRound": 8,
    "totalRounds": 12,
    "gameStatus": "playing"
  }
}
```

---

## ⚡ Real-time Events (Socket.IO)

### Connect & Join Room
```javascript
const socket = io('http://localhost:3005');

// Join room for real-time updates
socket.emit('join-room', {
  gameCode: '1234',
  playerId: 'player_id', 
  playerName: 'Player Name'
});
```

### Key Events to Listen For
```javascript
// Players joining/leaving
socket.on('player-joined', (data) => {
  console.log('New player:', data.player);
  // Update UI with new player list
});

// Game automatically starts when 4 players join
socket.on('game-auto-started', (data) => {
  console.log('Game starting!');
  // Switch to game screen
});

// New round begins
socket.on('new-round', (data) => {
  console.log('Round', data.roundNumber, 'of 12');
  console.log('Current player:', data.currentPlayer);
  console.log('Question:', data.question);
  // Show question and prediction interface for other 3 players
});

// Round completed - see who predicted correctly
socket.on('round-completed', (data) => {
  console.log('Answer:', data.answer);
  console.log('Correct predictions:', data.predictions.filter(p => p.isCorrect));
  console.log('Updated leaderboard:', data.leaderboard);
  // Show results and updated scores
});

// Game finished after 3 full cycles
socket.on('game-ended', (data) => {
  console.log('Winner:', data.winner);
  console.log('Final scores:', data.finalLeaderboard);
  // Show final results - who had the most correct predictions
});
```

---

## 🎮 Game Flow

1. **Host creates game** → Gets 4-digit code (never expires)
2. **3 players join** → Using the code
3. **Game auto-starts** → When 4th player joins
4. **3 Full Cycles** → Each of the 4 players answers 3 "Would You Rather" questions
   - **Round 1-4:** Player A, B, C, D each answer once
   - **Round 5-8:** Player A, B, C, D each answer again
   - **Round 9-12:** Player A, B, C, D each answer a third time
5. **Prediction & Scoring** → Other players predict each answer, +10 points for correct predictions
6. **Real-time leaderboard** → Shows who has the most correct predictions
7. **Winner declared** → Player with highest score after 3 full cycles (12 rounds)

---

## ⚠️ Error Handling

All errors follow this format:
```json
{
  "status": "error",
  "message": "Error description"
}
```

Common errors:
- `400` - Bad request (missing data, invalid format)
- `404` - Game room not found
- `409` - Room full or game already started
- `500` - Server error

---

## 🔧 Testing

Test the API health:
```http
GET /api/games/test
```

Expected response:
```json
{
  "message": "TFADHLOON Game API is working!",
  "timestamp": "2025-06-04T10:30:00.000Z"
}
```

---

**✅ Key Features:**
- Game codes **never expire**
- **Real-time** updates via Socket.IO  
- **Auto-start** when 4 players join
- **3 full cycles** - each player answers 3 "Would You Rather" questions
- **Prediction scoring** - see who knows their friends best!
- **Live leaderboard** - track who has the most correct predictions
- **No mock data** - all live gameplay

*Last updated: June 4, 2025*
