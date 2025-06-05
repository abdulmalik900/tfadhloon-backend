import express from 'express';
import gameRoutes from './gameRoutes.js';

const router = express.Router();

// Game routes
router.use('/game', gameRoutes);

export default router;
