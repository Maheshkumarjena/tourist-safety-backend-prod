import { Router } from 'express';
import Joi from 'joi';
import {
    register,
    login,
    refreshToken,
    logout,
    getProfile,
    changePassword,
    forgotPassword,
    resetPassword,
} from './auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { authLimiter } from '@/middleware/rateLimit.middleware';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required(),
    dateOfBirth: Joi.date().max('now').required(),
    nationality: Joi.string().required(),
    fcmToken: Joi.string().optional(),
    deviceInfo: Joi.object({
        os: Joi.string().valid('android', 'ios', 'web').required(),
        model: Joi.string().optional(),
        appVersion: Joi.string().optional(),
    }).optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    fcmToken: Joi.string().optional(),
    deviceInfo: Joi.object({
        os: Joi.string().valid('android', 'ios', 'web').optional(),
        model: Joi.string().optional(),
        appVersion: Joi.string().optional(),
    }).optional(),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
});

// Routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;