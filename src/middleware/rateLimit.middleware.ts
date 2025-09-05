import rateLimit from 'express-rate-limit';
import { config } from '@/config/env';
import { AppError } from './error.middleware';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new AppError('Too many requests, please try again later.', 429);
  },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new AppError('Too many login attempts, please try again after 15 minutes.', 429);
  },
});

// Strict rate limiter for SOS endpoints
export const sosLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 SOS alerts per minute
  message: 'Too many SOS alerts, please wait before sending another.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new AppError('Too many SOS alerts, please wait before sending another.', 429);
  },
});