import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Username, email and password are required'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 6 characters'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      res.status(409).json({
        error: 'User already exists',
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash
    });

    // Generate token
    const token = generateToken({
      userId: (user._id as any).toString(),
      username: user.username,
      email: user.email
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
      return;
    }

    // Find user (include password for verification)
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: (user._id as any).toString(),
      username: user.username,
      email: user.email
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }

    // Get full user data
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email stats')
      .populate('friendRequests.from', 'username email');

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
      return;
    }

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        friends: user.friends,
        friendRequests: user.friendRequests,
        stats: user.stats,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
