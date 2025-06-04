# 🎮 TFADHLOON Game API - Frontend Developer Guide

## 🚀 Quick Start

**Base URL:** `http://localhost:3005`  
**API Endpoints:** `http://localhost:3005/api/games`  
**Content-Type:** `application/json` for all requests  
**Game Design:** Supports exactly 4 players - Host (Player A) + 3 other players (B, C, D)

---

## 📋 API Endpoints Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/games/test` | API health check |
| `POST` | `/api/games/create` | Create new game room |
| `POST` | `/api/games/join` | Join existing game room |
| `GET` | `/api/games/{gameCode}` | Get room status |
| `POST` | `/api/games/{gameCode}/start` | Start the game |
| `POST` | `/api/games/{gameCode}/leave` | Leave game room |
| `GET` | `/api/games/{gameCode}/question` | Get current question |
| `POST` | `/api/games/{gameCode}/predictions` | Submit predictions |
| `POST` | `/api/games/{gameCode}/answer` | Submit answer |
| `GET` | `/api/games/{gameCode}/leaderboard` | Get leaderboard |

---

## 1. 🏥 API Health Check

### Endpoint
```
GET http://localhost:3005/api/games/test
```

### Request
No body required

### Response (200)
```json
{
  "message": "TFADHLOON Game API is working!",
  "endpoint": "games",
  "timestamp": "2025-06-03T10:30:00.000Z"
}
```

---

## 2. 🏠 Create Game Room

### Endpoint
```
POST http://localhost:3005/api/games/create
```

### Request Body
```json
{
  "playerName": "John Doe",
  "maxPlayers": 4
}

```

### Response (201)
```json
{
  "status": "success",
  "message": "Game room created successfully",
  "data": {
    "gameCode": "1234",
    "hostId": "player_1701234567890_abc123def",
    "roomId": "64f8a1b2c3d4e5f6g7h8i9j0",
    "player": {
      "id": "player_1701234567890_abc123def",
      "name": "John Doe",
      "score": 0,
      "isReady": false,
      "isConnected": true,
      "joinedAt": "2025-06-03T10:30:00.000Z"
    },
    "gameSettings": {
      "predictionTime": 30,
      "answerTime": 15,
      "roundBreak": 5
    }
  }
}
```

### Error Response (400)
```json
{
  "status": "error",
  "message": "Player name is required"
}
```

---

## 3. 🚪 Join Game Room

### Endpoint
```
POST http://localhost:3005/api/games/join
```

### Request Body
```json
{
  "gameCode": "9017",
  "playerName": "Jane Smith"
}
```

### Response (200)
```json
{
  "status": "success",
  "message": "Joined game room successfully",
  "data": {
    "gameCode": "1234",
    "playerId": "player_1701234567891_def456ghi",
    "roomId": "64f8a1b2c3d4e5f6g7h8i9j0",
    "player": {
      "id": "player_1701234567891_def456ghi",
      "name": "Jane Smith",
      "score": 0,
      "isReady": false,
      "isConnected": true,
      "joinedAt": "2025-06-03T10:31:00.000Z"
    },
    "players": [
      {
        "id": "player_1701234567890_abc123def",
        "name": "John Doe",
        "score": 0,
        "isReady": false,
        "isConnected": true
      },
      {
        "id": "player_1701234567891_def456ghi",
        "name": "Jane Smith",
        "score": 0,
        "isReady": false,
        "isConnected": true
      }
    ],
    "gameSettings": {
      "predictionTime": 30,
      "answerTime": 15,
      "roundBreak": 5
    }
  }
}
```

### Error Responses
```json
// Game not found (404)
{
  "status": "error",
  "message": "Game room not found or already started"
}

// Game full (400)
{
  "status": "error",
  "message": "Game room is full"
}

// Name taken (400)
{
  "status": "error",
  "message": "Player name already taken"
}
```

---

## 4. 📊 Get Game Room Status

### Endpoint
```
GET http://localhost:3005/api/games/{gameCode}
```

### Example
```
GET http://localhost:3005/api/games/1234
```

### Response (200)
```json
{
  "status": "success",
  "data": {
    "gameRoom": {
      "gameCode": "1234",
      "hostId": "player_1701234567890_abc123def",
      "players": [
        {
          "id": "player_1701234567890_abc123def",
          "name": "John Doe",
          "score": 15,
          "isReady": true,
          "isConnected": true
        },
        {
          "id": "player_1701234567891_def456ghi",
          "name": "Jane Smith",
          "score": 10,
          "isReady": true,
          "isConnected": true
        }      ],
      "status": "waiting",
      "currentRound": 0,
      "totalRounds": 3,
      "gameSettings": {
        "predictionTime": 30,
        "answerTime": 15,
        "roundBreak": 5
      },
      "leaderboard": [
        {
          "playerId": "player_1701234567890_abc123def",
          "playerName": "John Doe",
          "score": 15,
          "correctPredictions": 2
        }
      ],
      "createdAt": "2025-06-03T10:30:00.000Z",
      "lastActivity": "2025-06-03T10:35:00.000Z"
    }
  }
}
```

---

## 5. 🎯 Start Game

### Endpoint
```
POST http://localhost:3005/api/games/{gameCode}/start
```

### Example
```
POST http://localhost:3005/api/games/1234/start
```

### Request Body
```json
{
  "hostId": "player_1701234567890_abc123def"
}
```

### Response (200)
```json
{
  "status": "success",
  "message": "Game started successfully",
  "data": {
    "gameRoom": {
      "gameCode": "1234",
      "status": "playing",
      "currentRound": 1,
      "players": [...]
    },
    "sessionId": "64f8a1b2c3d4e5f6g7h8i9j1"
  }
}
```

### Error Responses
```json
// Not host (403)
{
  "status": "error",
  "message": "Only the host can start the game"
}

// Not enough players (400)
{
  "status": "error",
  "message": "At least 2 players required to start the game"
}

// Game already started (400)
{
  "status": "error",
  "message": "Game has already started"
}
```

---

## 6. 🚪 Leave Game Room

### Endpoint
```
POST http://localhost:3005/api/games/{gameCode}/leave
```

### Example
```
POST http://localhost:3005/api/games/1234/leave
```

### Request Body
```json
{
  "playerId": "player_1701234567891_def456ghi"
}
```

### Response (200)
```json
{
  "status": "success",
  "message": "Left game room successfully"
}
```

### Error Response (404)
```json
{
  "status": "error",
  "message": "Game room not found"
}
```

---

## 7. ❓ Get Current Question

### Endpoint
```
GET http://localhost:3005/api/games/{gameCode}/question
```

### Example
```
GET http://localhost:3005/api/games/1234/question
```

### Response (200)
```json
{
  "status": "success",
  "data": {
    "question": {
      "_id": "64f8a1b2c3d4e5f6g7h8i9j2",
      "text": "Would you rather have the ability to fly or be invisible?",
      "options": {
        "A": "Ability to fly",
        "B": "Be invisible"
      },
      "category": "hypothetical"
    },
    "currentPlayer": {
      "id": "player_1701234567890_abc123def",
      "name": "John Doe"
    },
    "roundInfo": {
      "currentRound": 1,
      "totalRounds": 6,
      "phase": "prediction"
    }
  }
}
```

### Error Response (404)
```json
{
  "status": "error",
  "message": "No more questions available"
}
```

---

## 8. 🔮 Submit Predictions

### Endpoint
```
POST http://localhost:3005/api/games/{gameCode}/predictions
```

### Example
```
POST http://localhost:3005/api/games/1234/predictions
```

### Request Body
```json
{
  "playerId": "player_1701234567891_def456ghi",
  "predictions": [
    {
      "targetPlayerId": "player_1701234567890_abc123def",
      "prediction": "A"
    }
  ]
}
```

### Response (200)
```json
{
  "status": "success",
  "message": "Predictions submitted successfully",
  "data": {
    "predictionsCount": 1,
    "remainingPredictions": 0,
    "allPredictionsSubmitted": true
  }
}
```

### Error Responses
```json
// Invalid predictions (400)
{
  "status": "error",
  "message": "Predictions are required"
}

// Invalid choice (400)
{
  "status": "error",
  "message": "Invalid prediction choice. Must be 'A' or 'B'"
}
```

---

## 9. ✅ Submit Answer

### Endpoint
```
POST http://localhost:3005/api/games/{gameCode}/answer
```

### Example
```
POST http://localhost:3005/api/games/1234/answer
```

### Request Body
```json
{
  "playerId": "player_1701234567890_abc123def",
  "answer": "A"
}
```

### Response (200)
```json
{
  "status": "success",
  "message": "Answer submitted successfully",
  "data": {
    "roundResults": {
      "question": "Would you rather have the ability to fly or be invisible?",
      "currentPlayer": "John Doe",
      "actualAnswer": "A",
      "correctPredictions": ["Jane Smith"],
      "scores": {
        "John Doe": 5,
        "Jane Smith": 10
      }
    },
    "gameStatus": {
      "currentRound": 2,
      "totalRounds": 6,
      "isGameComplete": false
    }
  }
}
```

### Error Response (403)
```json
{
  "status": "error",
  "message": "Only the current player can submit an answer"
}
```

---

## 10. 🏆 Get Leaderboard

### Endpoint
```
GET http://localhost:3005/api/games/{gameCode}/leaderboard
```

### Example
```
GET http://localhost:3005/api/games/1234/leaderboard
```

### Response (200)
```json
{
  "status": "success",
  "data": {
    "leaderboard": [
      {
        "playerId": "player_1701234567891_def456ghi",
        "playerName": "Jane Smith",
        "score": 25,
        "correctPredictions": 3,
        "rank": 1
      },
      {
        "playerId": "player_1701234567890_abc123def",
        "playerName": "John Doe",
        "score": 15,
        "correctPredictions": 1,
        "rank": 2
      }
    ],
    "gameStatus": {
      "status": "completed",
      "totalRounds": 6,
      "completedRounds": 6,
      "winner": "Jane Smith"
    }
  }
}
```

---

## 🚨 Common Error Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad request (validation error) |
| `403` | Forbidden (permission denied) |
| `404` | Not found |
| `500` | Server error |

---

## 🎮 Game Flow for Frontend

### Step-by-Step Implementation:

1. **Create/Join Game:**
   - Use `POST /api/games/create` to create a room
   - Use `POST /api/games/join` to join existing room
   - Save `gameCode` and `playerId` from response

2. **Check Room Status:**
   - Use `GET /api/games/{gameCode}` to get current room state
   - Check `status` field: `"waiting"`, `"playing"`, or `"finished"`

3. **Start Game (Host Only):**
   - Use `POST /api/games/{gameCode}/start` with `hostId`
   - Game status will change to `"playing"`

4. **Game Loop:**
   - Get question: `GET /api/games/{gameCode}/question`
   - Submit predictions: `POST /api/games/{gameCode}/predictions`
   - Submit answer: `POST /api/games/{gameCode}/answer`
   - Check leaderboard: `GET /api/games/{gameCode}/leaderboard`

5. **Leave Game:**
   - Use `POST /api/games/{gameCode}/leave` when player wants to exit

---

## 💡 Frontend Implementation Tips

### 1. Store Important Data
```javascript
// Store these after creating/joining
const gameData = {
  gameCode: "1234",
  playerId: "player_1701234567890_abc123def",
  playerName: "John Doe",
  isHost: true
};
```

### 2. Check Game Status
```javascript
const checkGameStatus = async (gameCode) => {
  const response = await fetch(`http://localhost:3005/api/games/${gameCode}`);
  const data = await response.json();
  return data.data.gameRoom.status; // "waiting", "playing", "finished"
}
```

### 3. Handle Predictions
```javascript
const submitPredictions = async (gameCode, playerId, predictions) => {
  const response = await fetch(`http://localhost:3005/api/games/${gameCode}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, predictions })
  });
  return response.json();
}
```

### 4. Real-time Updates
- Use Socket.io for real-time game updates
- Listen for events like `new-round`, `game-started`, `player-joined`
- Socket endpoint: `ws://localhost:3005`

---

## 🔧 Testing with Postman

1. **Environment Variables**: 
   - Set `baseUrl` to `http://localhost:3005`
   - Save `gameCode` and `playerId` from responses

2. **Test Sequence**:
   1. Health check → Create game → Join game
   2. Start game → Get question → Submit predictions
   3. Submit answer → Get leaderboard

3. **Multiple Players**: 
   - Use different `playerName` values to simulate multiplayer
   - Test with 2-4 players for complete game flow (Host + up to 3 other players)

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Game codes are 4-digit alphanumeric strings
- Player names are case-sensitive and must be unique per room
- Maximum 4 players per room: Host (Player A) + 3 other players (B, C, D)
- Game automatically progresses through rounds and cycles
- Real-time updates available via Socket.io on the same port
- Questions are randomly selected from the database pool

---

**🎯 End of API Documentation**
