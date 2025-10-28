import { Router } from 'express';
import User from '../models/User';
import Room from '../models/Room';
import GameState from '../models/GameState';

const router = Router();

// Test database models
router.get('/test/db', async (_req, res) => {
  try {
    // Count documents in each collection
    const userCount = await User.countDocuments();
    const roomCount = await Room.countDocuments();
    const gameStateCount = await GameState.countDocuments();

    res.json({
      status: 'ok',
      message: 'Database models are working!',
      collections: {
        users: userCount,
        rooms: roomCount,
        gameStates: gameStateCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
