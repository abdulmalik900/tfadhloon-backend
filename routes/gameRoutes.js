import { Router } from 'express';
import {
  createGameRoom,
  joinGameRoom,
  getGameRoom,
  startGame,
  getCurrentQuestion,
  submitPredictions,
  submitAnswer,
  completeScoring,
  showWinnerAnimation,
  completeGame,
  getLeaderboard,
  leaveGameRoom,
  getGameState,
  validateGameCode,
  getPlayers,
  getGameSettings,
  getRounds,
  getCurrentRound,
  getGameStats,
  markPlayerReady
} from '../controller/gameController.js';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'TFADHLOON Game API is working!',
    endpoint: 'games',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection test
router.get('/test-socket', (req, res) => {
  res.json({
    message: 'Socket.io connection test endpoint',
    instructions: {
      step1: 'Connect to: ws://localhost:3005 or wss://backend.tfadhloon.com',
      step2: 'Emit: test-connection with any data',
      step3: 'Listen for: connection-test-response',
      step4: 'Check browser console for connection details'
    },
    timestamp: new Date().toISOString(),
    server: 'TFADHLOON Socket.io Server'
  });
});

// Game room management
router.post('/create', createGameRoom);
router.post('/join', joinGameRoom);
router.get('/validate/:gameCode', validateGameCode);
router.get('/:gameCode', getGameRoom);
router.get('/:gameCode/state', getGameState);
router.get('/:gameCode/players', getPlayers);
router.get('/:gameCode/settings', getGameSettings);
router.get('/:gameCode/rounds', getRounds);
router.get('/:gameCode/current-round', getCurrentRound);
router.get('/:gameCode/stats', getGameStats);
router.post('/:gameCode/ready', markPlayerReady);
router.post('/:gameCode/start', startGame);
router.delete('/:gameCode/leave', leaveGameRoom);

// Game flow
router.get('/:gameCode/question', getCurrentQuestion);
router.get('/:gameCode/current-question', getCurrentQuestion); // Alternative endpoint
router.post('/:gameCode/predictions', submitPredictions);
router.post('/:gameCode/answer', submitAnswer);

// Score display phases
router.post('/:gameCode/complete-scoring', completeScoring);
router.post('/:gameCode/show-winner', showWinnerAnimation);
router.post('/:gameCode/complete-game', completeGame);

router.get('/:gameCode/leaderboard', getLeaderboard);

export default router;