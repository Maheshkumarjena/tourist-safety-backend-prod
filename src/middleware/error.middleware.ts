import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../config/logger';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  // Log error
  logger.error(error);

  // If not an AppError, create a generic one
  if (!(err instanceof AppError)) {
    err = new AppError('Something went wrong.', 500);
  }

  const appError = err as AppError;

  res.status(appError.statusCode).json({
    error: {
      message: appError.message,
      status: appError.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: appError.stack }),
    },
  });
};