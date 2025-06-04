import express from 'express';
import gameRoutes from './gameRoutes.js';

const router = express.Router();


// Game routes
router.use('/games', gameRoutes);

export default router;
