import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../modules/auth/auth.model'; // Corrected import (was '../modules/user/user.model')import { AppError } from '../utils/appError';
import { logger } from '../config/logger';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new Error('Access denied. No token provided.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new Error('User no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(new Error('Invalid token.', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Access denied. Insufficient permissions.', 403);
    }
    next();
  };
};