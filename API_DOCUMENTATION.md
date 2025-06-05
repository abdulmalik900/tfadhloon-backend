# TFADHLOON Game API Documentation

## Project Overview
TFADHLOON is a real-time 4-player prediction game where players take turns answering questions while others predict their choices. The game consists of 12 rounds (3 cycles × 4 players) with automatic scoring and real-time updates.

### Key Features
- 4-player multiplayer game
- Real-time Socket.io communication
- Automatic game flow management
- 12-round prediction-based gameplay
- Live scoring and leaderboards
- No authentication required

## Base URLs
 `https://backend.tfadhloon.com`

## Game Flow
1. Host creates a game room → receives 4-digit code
2. 3 players join using the code → game auto-starts
3. Each round: Current player answers, others predict
4. Real-time scoring (10 points per correct prediction)
5. Final leaderboard and winner celebration

## API Structure
All responses follow this format:
```json
{
  "status": "success|error",
  "message": "Description",
  "data": { ... }
}
```

---

## REST API Endpoints

### Room Management

#### 1. Create Game Room
`POST /api/game/create`

**Request:**
```json
{
  "playerName": "string (required)"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "gameCode": "1234",
    "hostId": "player_123...",
    "player": { "id": "...", "name": "...", "score": 0 }
  }
}
```

#### 2. Join Game Room
`POST /api/game/join`

**Request:**
```json
{
  "gameCode": "1234",
  "playerName": "string (required)"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "gameCode": "1234",
    "playerId": "player_456...",
    "player": { "id": "...", "name": "...", "score": 0 },
    "totalPlayers": 2
  }
}
```

#### 3. Validate Game Code
`GET /api/game/validate/{gameCode}`

**Response:**
```json
{
  "status": "success",
  "data": {
    "isValid": true,
    "canJoin": true,
    "playerCount": 2,
    "maxPlayers": 4
  }
}
```

### Game Information

#### 4. Get Game State
`GET /api/game/{gameCode}/state`

**Response:**
```json
{
  "status": "success",
  "data": {
    "gameCode": "1234",
    "status": "playing",
    "currentRound": 5,
    "totalRounds": 12,
    "players": [...],
    "currentPlayer": "player_123...",
    "gamePhase": "predicting"
  }
}
```

#### 5. Get Current Question
`GET /api/game/{gameCode}/question`

**Response:**
```json
{
  "status": "success",
  "data": {
    "question": {
      "questionText": "What is your favorite color?",
      "choices": { "A": "Red", "B": "Blue" }
    },
    "roundNumber": 5,
    "currentPlayer": { "id": "...", "name": "..." }
  }
}
```

#### 6. Get Leaderboard
`GET /api/game/{gameCode}/leaderboard`

**Response:**
```json
{
  "status": "success",
  "data": {
    "leaderboard": [
      { "playerId": "...", "playerName": "...", "score": 30, "rank": 1 }
    ],
    "isGameComplete": false
  }
}
```

### Game Actions

#### 7. Submit Prediction
`POST /api/game/{gameCode}/predictions`

**Request:**
```json
{
  "playerId": "player_123...",
  "predictedChoice": "A"
}
```

#### 8. Submit Answer
`POST /api/game/{gameCode}/answer`

**Request:**
```json
{
  "playerId": "player_123...",
  "answer": "B"
}
```

#### 9. Leave Game
`POST /api/game/{gameCode}/leave`

**Request:**
```json
{
  "playerId": "player_123..."
}
```

### Game Flow (Auto-managed)

#### 10. Start Game
`POST /api/game/{gameCode}/start`

#### 11. Complete Scoring
`POST /api/game/{gameCode}/complete-scoring`

#### 12. Show Winner
`POST /api/game/{gameCode}/show-winner`

#### 13. Complete Game
`POST /api/game/{gameCode}/complete-game`

---

## Socket.io Real-time Events

### Connection
```javascript
const socket = io('http://localhost:3005');
```

### Client Emits (Send to Server)

#### Join Room
```javascript
socket.emit('joinRoom', {
  gameCode: '1234',
  playerId: 'player_123...',
  playerName: 'Player Name'
});
```

#### Submit Prediction
```javascript
socket.emit('submitPrediction', {
  gameCode: '1234',
  playerId: 'player_123...',
  predictedChoice: 'A'
});
```

#### Submit Answer
```javascript
socket.emit('submitAnswer', {
  gameCode: '1234',
  playerId: 'player_123...',
  answer: 'B'
});
```

### Server Emits (Receive from Server)

#### Room Update
```javascript
socket.on('roomUpdate', (data) => {
  // Players joined/left
});
```

#### Game Started
```javascript
socket.on('gameStarted', (data) => {
  // Game begins with 4 players
});
```

#### Round Started
```javascript
socket.on('roundStarted', (data) => {
  // New round begins, show question
});
```

#### Prediction Update
```javascript
socket.on('predictionUpdate', (data) => {
  // Prediction received indicator
});
```

#### Answering Phase
```javascript
socket.on('answeringPhase', (data) => {
  // Current player's turn to answer
});
```

#### Round Results
```javascript
socket.on('roundResults', (data) => {
  // Show correct answer and scores
});
```

#### Final Scores
```javascript
socket.on('finalScores', (data) => {
  // Game complete, show leaderboard
});
```

#### Player Disconnected
```javascript
socket.on('playerDisconnected', (data) => {
  // Player left the game
});
```

---

## Error Handling

### Common Error Responses
- **400**: Invalid request data
- **404**: Game room not found
- **500**: Server error

### Error Format
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

## Frontend Developer Notes

### Quick Start
1. **Create Game**: POST to `/api/game/create` with player name
2. **Join Game**: POST to `/api/game/join` with game code and player name
3. **Connect Socket**: Use the game code and player ID from step 1/2
4. **Listen for Events**: Handle real-time game updates via Socket.io

### Game Flow Management
- Game automatically starts when 4 players join
- All game progression is handled by Socket.io events
- Use REST endpoints for initial setup and state queries
- Socket.io handles real-time gameplay communication

### Real-time Integration
- Connect to Socket.io immediately after joining
- Listen to `roundStarted` for new questions
- Emit predictions/answers based on game phase
- Handle `roundResults` for score updates
- Process `finalScores` for game completion

### UI State Management
- Track `gamePhase` from events to show correct UI
- Display timers for prediction (30s) and answer (15s) phases
- Show score animations between rounds (3s display)
- Handle winner celebration (10s animation)

### Best Practices
- Always validate game code before joining
- Handle player disconnections gracefully
- Implement loading states for API calls
- Cache game state for offline resilience
- Show real-time indicators for predictions received

---

**Server Status**: ✅ Ready for Frontend Integration  
**Last Updated**: June 5, 2025  
**API Version**: 1.0  
**Socket.io**: Ready for real-time connections

