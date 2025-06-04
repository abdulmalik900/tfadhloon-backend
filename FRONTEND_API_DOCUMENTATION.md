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
    },      "players": [
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
      "hostId": "player_1701234567890_abc123def",      "players": [
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
        },
        {
          "id": "player_1701234567892_ghi789jkl",
          "name": "Mike Johnson",
          "score": 8,
          "isReady": true,
          "isConnected": true
        },
        {
          "id": "player_1701234567893_jkl012mno",
          "name": "Sarah Wilson",
          "score": 12,
          "isReady": true,
          "isConnected": true
        }
      ],
      "status": "waiting",
      "currentRound": 0,
      "totalRounds": 3,
      "gameSettings": {
        "predictionTime": 30,
        "answerTime": 15,
        "roundBreak": 5
      },      "leaderboard": [
        {
          "playerId": "player_1701234567890_abc123def",
          "playerName": "John Doe",
          "score": 15,
          "correctPredictions": 2,
          "rank": 1
        },
        {
          "playerId": "player_1701234567891_def456ghi",
          "playerName": "Jane Smith", 
          "score": 10,
          "correctPredictions": 1,
          "rank": 2
        },
        {
          "playerId": "player_1701234567892_ghi789jkl",
          "playerName": "Mike Johnson",
          "score": 8,
          "correctPredictions": 1,
          "rank": 3
        },
        {
          "playerId": "player_1701234567893_jkl012mno",
          "playerName": "Sarah Wilson",
          "score": 12,
          "correctPredictions": 1,
          "rank": 2
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
  "data": {    "gameRoom": {
      "gameCode": "1234",
      "status": "playing",
      "currentRound": 1,
      "totalRounds": 6,
      "players": [
        {
          "id": "player_1701234567890_abc123def",
          "name": "John Doe",
          "score": 0,
          "isReady": true,
          "isConnected": true
        },
        {
          "id": "player_1701234567891_def456ghi",
          "name": "Jane Smith", 
          "score": 0,
          "isReady": true,
          "isConnected": true
        },
        {
          "id": "player_1701234567892_ghi789jkl",
          "name": "Mike Johnson",
          "score": 0,
          "isReady": true,
          "isConnected": true
        },
        {
          "id": "player_1701234567893_jkl012mno",
          "name": "Sarah Wilson",
          "score": 0,
          "isReady": true,
          "isConnected": true
        }
      ]
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
  "message": "Exactly 4 players required to start the game (1 host + 3 players)"
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

## 🚨 Error Handling & Response Format

### Standard Response Structure
All API responses follow this consistent format:

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Descriptive error message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details if available"
  }
}
```

### Common Error Codes

| HTTP Code | Error Type | Description |
|-----------|------------|-------------|
| `200` | Success | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data or validation error |
| `403` | Forbidden | Permission denied (e.g., not host, not current player) |
| `404` | Not Found | Game room, player, or resource not found |
| `409` | Conflict | Resource conflict (e.g., game already started, name taken) |
| `500` | Server Error | Internal server error |

### Validation Errors
```json
{
  "status": "error",
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "playerName": "Player name must be between 2-20 characters",
      "gameCode": "Game code must be 4 digits"
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
| `409` | Conflict (duplicate/already exists) |
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

### 4. Real-time Updates (Socket.io)
- Use Socket.io for real-time game updates
- Socket endpoint: `ws://localhost:3005`
- **Key Events to Listen For:**
  - `player-joined` - New player joins room
  - `player-left` - Player leaves room  
  - `game-started` - Game begins
  - `new-round` - New round starts
  - `predictions-complete` - All predictions submitted
  - `round-complete` - Round finished with results
  - `game-complete` - Game finished

**Socket.io Connection Example:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3005');

// Join a game room for real-time updates
socket.emit('join-room', { gameCode: '1234', playerId: 'player_id' });

// Listen for game events
socket.on('player-joined', (data) => {
  console.log('New player joined:', data.player);
  // Update players list in UI
  updatePlayersList(data.players);
});

socket.on('player-left', (data) => {
  console.log('Player left:', data.player);
  // Remove player from UI
  removePlayerFromList(data.playerId);
});

socket.on('game-started', (data) => {
  console.log('Game started!', data);
  // Redirect to game screen
  setGameState('playing');
  loadFirstQuestion();
});

socket.on('new-round', (data) => {
  console.log('New round:', data.round);
  // Update round info and load new question
  setCurrentRound(data.round);
  setCurrentPlayer(data.currentPlayer);
  loadQuestion();
});

socket.on('predictions-complete', (data) => {
  console.log('All predictions submitted');
  // Show "waiting for answer" state
  setPhase('waiting-for-answer');
});

socket.on('round-complete', (data) => {
  console.log('Round finished:', data.results);
  // Show round results
  displayRoundResults(data.results);
  updateScores(data.scores);
});

socket.on('game-complete', (data) => {
  console.log('Game finished:', data.finalResults);
  // Show final leaderboard
  displayFinalResults(data.finalResults);
  setGameState('completed');
});

// Error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
  showErrorMessage(error.message);
});

// Connection status
socket.on('connect', () => {
  console.log('Connected to game server');
  setConnectionStatus('connected');
});

socket.on('disconnect', () => {
  console.log('Disconnected from game server');
  setConnectionStatus('disconnected');
});
```

### Socket Event Data Structures

#### `player-joined` Event:
```javascript
{
  player: {
    id: "player_1701234567890_abc123def",
    name: "New Player",
    score: 0,
    isReady: false,
    isConnected: true
  },
  players: [...], // Updated full players list
  playersCount: 3
}
```

#### `game-started` Event:
```javascript
{
  gameCode: "1234",
  status: "playing",
  currentRound: 1,
  totalRounds: 6,
  currentPlayer: {
    id: "player_id",
    name: "Player Name"
  }
}
```

#### `new-round` Event:
```javascript
{
  round: 2,
  currentPlayer: {
    id: "player_1701234567891_def456ghi",
    name: "Jane Smith"
  },
  question: {
    text: "Would you rather...",
    options: { A: "Option A", B: "Option B" }
  }
}
```

#### `round-complete` Event:
```javascript
{
  results: {
    question: "Would you rather have the ability to fly or be invisible?",
    currentPlayer: "John Doe",
    actualAnswer: "A",
    correctPredictions: ["Jane Smith", "Mike Johnson"],
    incorrectPredictions: ["Sarah Wilson"]
  },
  scores: {
    "John Doe": 5,
    "Jane Smith": 15,
    "Mike Johnson": 12,
    "Sarah Wilson": 8
  },
  nextRound: 3
}
```

---

## 🔧 Testing Guide

### Prerequisites
- Server running on `http://localhost:3005`
- MongoDB connected and seeded with questions
- Postman or similar API testing tool

### Complete Game Flow Test Sequence

#### 1. Setup Phase
```bash
# Test API health
GET http://localhost:3005/api/games/test

# Expected: 200 OK with API status message
```

#### 2. Create Game Room (Host)
```bash
POST http://localhost:3005/api/games/create
Content-Type: application/json

{
  "playerName": "Host Player",
  "maxPlayers": 4
}

# Save: gameCode, hostId, roomId from response
```

#### 3. Join Game Room (3 Players)
```bash
# Player 2
POST http://localhost:3005/api/games/join
Content-Type: application/json

{
  "gameCode": "{{gameCode}}",
  "playerName": "Player 2"
}

# Player 3  
POST http://localhost:3005/api/games/join
Content-Type: application/json

{
  "gameCode": "{{gameCode}}",
  "playerName": "Player 3"
}

# Player 4
POST http://localhost:3005/api/games/join
Content-Type: application/json

{
  "gameCode": "{{gameCode}}",
  "playerName": "Player 4"
}
```

#### 4. Check Room Status
```bash
GET http://localhost:3005/api/games/{{gameCode}}

# Verify: 4 players, status: "waiting"
```

#### 5. Start Game (Host Only)
```bash
POST http://localhost:3005/api/games/{{gameCode}}/start
Content-Type: application/json

{
  "hostId": "{{hostId}}"
}

# Verify: status changes to "playing", currentRound: 1
```

#### 6. Game Loop (Repeat for each round)
```bash
# Get current question
GET http://localhost:3005/api/games/{{gameCode}}/question

# Submit predictions (3 players predict for current player)
POST http://localhost:3005/api/games/{{gameCode}}/predictions
Content-Type: application/json

{
  "playerId": "{{predictorPlayerId}}",
  "predictions": [
    {
      "targetPlayerId": "{{currentPlayerId}}",
      "prediction": "A"
    }
  ]
}

# Submit answer (current player only)
POST http://localhost:3005/api/games/{{gameCode}}/answer
Content-Type: application/json

{
  "playerId": "{{currentPlayerId}}",
  "answer": "A"
}

# Check leaderboard
GET http://localhost:3005/api/games/{{gameCode}}/leaderboard
```

#### 7. Game Completion
After 6 rounds (3 cycles), check final leaderboard:
```bash
GET http://localhost:3005/api/games/{{gameCode}}/leaderboard

# Verify: gameStatus.status = "completed", winner declared
```

### Environment Variables for Postman
```json
{
  "baseUrl": "http://localhost:3005",
  "gameCode": "{{extracted_from_create_response}}",
  "hostId": "{{extracted_from_create_response}}",
  "player2Id": "{{extracted_from_join_response}}",
  "player3Id": "{{extracted_from_join_response}}",
  "player4Id": "{{extracted_from_join_response}}"
}
```

### Testing Edge Cases

#### Error Scenarios to Test:
1. **Join non-existent game:** Use invalid gameCode
2. **Start game without enough players:** Try with < 4 players  
3. **Join full game:** Try joining when 4 players already present
4. **Duplicate player names:** Use same name twice in one room
5. **Non-host starts game:** Use non-host playerId to start
6. **Invalid predictions:** Submit invalid choice (not A or B)
7. **Wrong player answers:** Submit answer from non-current player

#### Expected Error Responses:
- `404` for non-existent games
- `400` for validation errors
- `403` for permission errors
- `409` for conflicts (full room, duplicate names)

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
   - Test with exactly 4 players for complete game flow (1 host + 3 other players)

---

## 📱 Quick Reference for Frontend Developers

### Key Data to Store in Frontend State
```javascript
// Game Session Data
const gameState = {
  // From create/join responses
  gameCode: "1234",
  playerId: "player_1701234567890_abc123def", 
  playerName: "John Doe",
  isHost: true,
  roomId: "64f8a1b2c3d4e5f6g7h8i9j0",
  
  // Game Progress
  currentRound: 1,
  totalRounds: 6,
  gameStatus: "playing", // "waiting", "playing", "completed"
  currentPlayer: {
    id: "player_id",
    name: "Player Name"
  },
  
  // Players List
  players: [
    { id: "player1", name: "Player 1", score: 10, isConnected: true },
    { id: "player2", name: "Player 2", score: 15, isConnected: true }
    // ... up to 4 players
  ]
};
```

### HTTP Request Helper Functions
```javascript
const API_BASE = 'http://localhost:3005/api/games';

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) config.body = JSON.stringify(body);
  
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

// Usage Examples:
const createGame = (playerName) => 
  apiRequest('/create', 'POST', { playerName, maxPlayers: 4 });

const joinGame = (gameCode, playerName) => 
  apiRequest('/join', 'POST', { gameCode, playerName });

const startGame = (gameCode, hostId) => 
  apiRequest(`/${gameCode}/start`, 'POST', { hostId });

const getCurrentQuestion = (gameCode) => 
  apiRequest(`/${gameCode}/question`);

const submitPredictions = (gameCode, playerId, predictions) => 
  apiRequest(`/${gameCode}/predictions`, 'POST', { playerId, predictions });

const submitAnswer = (gameCode, playerId, answer) => 
  apiRequest(`/${gameCode}/answer`, 'POST', { playerId, answer });

const getLeaderboard = (gameCode) => 
  apiRequest(`/${gameCode}/leaderboard`);
```

### Game Flow State Machine
```javascript
const GAME_STATES = {
  LOBBY: 'waiting',
  PLAYING: 'playing', 
  FINISHED: 'completed'
};

const ROUND_PHASES = {
  PREDICTION: 'prediction',
  ANSWER: 'answer',
  RESULTS: 'results'
};

// State management example
const gameFlow = {
  currentState: GAME_STATES.LOBBY,
  currentPhase: ROUND_PHASES.PREDICTION,
  
  canStartGame: (players, isHost) => 
    players.length === 4 && isHost,
    
  canSubmitPrediction: (playerId, currentPlayerId) => 
    playerId !== currentPlayerId,
    
  canSubmitAnswer: (playerId, currentPlayerId) => 
    playerId === currentPlayerId
};
```

---

## 🚀 Production Deployment Checklist

### Environment Variables
```bash
# Required for production
PORT=3005
MONGODB_URI=mongodb://localhost:27017/tfadhloon_game
NODE_ENV=production

# Optional configurations  
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Server Configuration
```javascript
// Update server.js for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
};

app.use(cors(corsOptions));
```

### Security Considerations
- Enable CORS for your frontend domain only
- Add rate limiting for API endpoints
- Validate all input data
- Use HTTPS in production
- Implement proper error logging
- Add request timeouts

### Database Setup
```bash
# MongoDB setup for production
# 1. Create database: tfadhloon_game
# 2. Seed questions collection
# 3. Set up indexes for performance
# 4. Configure backup strategy
```

---

## 📝 Additional Notes

- All timestamps are in ISO 8601 format
- Game codes are 4-digit alphanumeric strings
- Player names are case-sensitive and must be unique per room
- Maximum 4 players per room: Host (Player A) + 3 other players (B, C, D)
- Game automatically progresses through rounds and cycles
- Real-time updates available via Socket.io on the same port
- Questions are randomly selected from the database pool

---

**🎯 End of API Documentation**

---

## 🐛 Troubleshooting Guide

### Common Issues & Solutions

#### 1. "Game room not found" Error
```javascript
// Problem: Using wrong gameCode or game expired
// Solution: Verify gameCode is correct and game hasn't finished
const checkGameExists = async (gameCode) => {
  try {
    const response = await fetch(`http://localhost:3005/api/games/${gameCode}`);
    return response.ok;
  } catch (error) {
    return false;
  }
};
```

#### 2. "Player name already taken" Error  
```javascript
// Problem: Duplicate player name in same room
// Solution: Add name validation before joining
const validatePlayerName = (name, existingPlayers) => {
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    return { valid: false, message: "Name must be 2-20 characters" };
  }
  
  const nameTaken = existingPlayers.some(p => 
    p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  
  if (nameTaken) {
    return { valid: false, message: "Name already taken" };
  }
  
  return { valid: true };
};
```

#### 3. Socket Connection Issues
```javascript
// Problem: Socket not connecting or disconnecting frequently
// Solution: Add reconnection logic and connection monitoring
const connectWithRetry = () => {
  const socket = io('http://localhost:3005', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection failed:', error);
    // Show connection error to user
  });
  
  return socket;
};
```

#### 4. API Request Timeout
```javascript
// Problem: Requests hanging or timing out
// Solution: Add timeout to fetch requests
const apiRequestWithTimeout = async (url, options, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};
```

### Server Health Checks
```bash
# Check server is running
curl http://localhost:3005/api/games/test

# Check MongoDB connection
# Look for "Connected to MongoDB" in server logs

# Check for CORS errors in browser console
# Verify frontend URL is allowed in CORS settings
```

### Debug Mode
```javascript
// Enable detailed logging for development
const DEBUG = process.env.NODE_ENV === 'development';

const debugLog = (message, data) => {
  if (DEBUG) {
    console.log(`[TFADHLOON DEBUG] ${message}:`, data);
  }
};

// Use throughout your frontend code
debugLog('Game created', gameData);
debugLog('Player joined', playerData);
debugLog('Round started', roundData);
```

---

**🎯 Complete API Documentation - Ready for Frontend Integration**
