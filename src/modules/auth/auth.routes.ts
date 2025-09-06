import express from 'express';
import { AuthController } from './auth.controller';
import { authLimiter } from '../../middleware/rateLimit.middleware';

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Register a new user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

// Verify OTP
router.post('/verify-otp', AuthController.verifyOtp);

export default router;