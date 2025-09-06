import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest, VerifyOtpRequest } from './auth.types';
import { validate } from '../../middleware/validate.middleware';
import { AppError } from '../../utils/appError';

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phoneNumber: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  dateOfBirth: Joi.date().required(),
  nationality: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

export class AuthController {
  // Register a new user
  static register = [
    validate(registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userData: RegisterRequest = req.body;
        const result = await AuthService.register(userData);

        res.status(201).json({
          status: 'success',
          data: result
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Login user
  static login = [
    validate(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const loginData: LoginRequest = req.body;
        const result = await AuthService.login(loginData);

        res.status(200).json({
          status: 'success',
          data: result
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Verify OTP
  static verifyOtp = [
    validate(verifyOtpSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const otpData: VerifyOtpRequest = req.body;
        const result = await AuthService.verifyOtp(otpData);

        res.status(200).json({
          status: 'success',
          data: result
        });
      } catch (error) {
        next(error);
      }
    }
  ];
}