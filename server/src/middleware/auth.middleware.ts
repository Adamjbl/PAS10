import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import User from '../models/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded: JwtPayload = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found'
      });
      return;
    }

    // Attach user to request
    req.user = {
      _id: (user._id as any).toString(),
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Invalid token'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded: JwtPayload = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (user) {
        req.user = {
          _id: (user._id as any).toString(),
          username: user.username,
          email: user.email
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
