import { Router } from 'express';
import {
  createGameRoom,
  joinGameRoom,
  getGameRoom,
  startGame,
  getQuestion,
  submitPredictions,
  submitAnswer,
  getLeaderboard,
  leaveGameRoom
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

// Game room management
router.post('/create', createGameRoom);
router.post('/join', joinGameRoom);
router.get('/:gameCode', getGameRoom);
router.post('/:gameCode/start', startGame);
router.post('/:gameCode/leave', leaveGameRoom);

// Game flow
router.get('/:gameCode/question', getQuestion);
router.post('/:gameCode/predictions', submitPredictions);
router.post('/:gameCode/answer', submitAnswer);
router.get('/:gameCode/leaderboard', getLeaderboard);

export default router;