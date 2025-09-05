import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import User from '@/modules/user/user.model';
import { AuthenticationError, AuthorizationError } from '@/middleware/error.middleware';
import { logger } from '@/config/logger';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

/**
 * Extract token from request headers
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return null;

  // Check for Bearer token format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
};

/**
 * Authenticate user using JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('Access denied. No token provided.');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new AuthenticationError('Token is not valid. User not found.');
    }

    if (user.isBlocked) {
      throw new AuthorizationError('Account is blocked. Please contact support.');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      next(error);
    } else {
      logger.error('Auth middleware error:', error);
      next(new AuthenticationError('Token is not valid.'));
    }
  }
};

/**
 * Optional authentication - continues even if no token is provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');
        req.user = user;
        req.token = token;
      } catch (error) {
        // For optional auth, we ignore token errors
        logger.warn('Optional auth token error:', error);
      }
    }

    next();
  } catch (error) {
    // For optional auth, we just continue without user
    next();
  }
};

/**
 * Check if user has required role(s)
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required.');
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      throw new AuthorizationError('Insufficient permissions.');
    }

    next();
  };
};

/**
 * Check if user is the owner of the resource or has admin role
 */
export const requireOwnershipOrAdmin = (resourceUserIdPath: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required.');
    }

    // Get resource user ID from request params or body
    const resourceUserId = req.params[resourceUserIdPath] || req.body[resourceUserIdPath];

    if (!resourceUserId) {
      throw new AuthorizationError('Resource ownership cannot be determined.');
    }

    // Allow if user is admin or owns the resource
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user._id.toString() === resourceUserId;

    if (!isAdmin && !isOwner) {
      throw new AuthorizationError('Access denied. You do not own this resource.');
    }

    next();
  };
};