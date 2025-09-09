import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../modules/auth/auth.model';
import { Admin } from '../modules/admin/admin.model';
import { AppError } from '../utils/appError';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: any;
  admin?: any;
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
      throw new AppError('Access denied. No token provided.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role?: string };

    // Check if it's a user or admin token
    if (decoded.role === 'admin') {
      // Get admin from token
      const admin = await Admin.findById(decoded.id).select('-password');

      if (!admin || !admin.isActive) {
        throw new AppError('Admin no longer exists or is inactive.', 401);
      }

      req.admin = admin;
    } else {
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        throw new AppError('User no longer exists.', 401);
      }

      req.user = user;
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(new AppError('Invalid token.', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.admin) {
      // Admin authorization
      if (!roles.includes(req.admin.role)) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
      }
    } else if (req.user) {
      // User authorization
      if (!roles.includes(req.user.role)) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
      }
    } else {
      throw new AppError('Access denied. No user or admin found.', 403);
    }

    next();
  };
};