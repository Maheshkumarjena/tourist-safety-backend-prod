import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import { AppError } from '@/middleware/error.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import User from '@/modules/user/user.model';
import { AuthRequest } from '@/middleware/auth.middleware';

// Generate JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

// Generate Refresh Token
const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpire,
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    email,
    password,
    phoneNumber,
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    fcmToken,
    deviceInfo,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  if (existingUser) {
    throw new AppError('User with this email or phone number already exists', 400);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    phoneNumber,
    firstName,
    lastName,
    dateOfBirth: new Date(dateOfBirth),
    nationality,
    fcmToken,
    deviceInfo,
  });

  // Generate tokens
  const token = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
      refreshToken,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, fcmToken, deviceInfo } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if password is correct
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is blocked
  if (user.isBlocked) {
    throw new AppError('Account is blocked. Please contact support.', 403);
  }

  // Update FCM token and device info if provided
  if (fcmToken) {
    user.fcmToken = fcmToken;
  }
  if (deviceInfo) {
    user.deviceInfo = deviceInfo;
  }

  // Generate tokens
  const token = generateToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
      refreshToken,
    },
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const decoded = jwt.verify(refreshToken, config.jwtSecret) as any;
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('Invalid refresh token', 401);
  }

  const newToken = generateToken(user._id.toString());
  const newRefreshToken = generateRefreshToken(user._id.toString());

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
    },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  // Remove FCM token (optional, depending on your requirements)
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { fcmToken: 1 } });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether email exists or not
    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
    return;
  }

  // Generate reset token (simplified for MVP)
  const resetToken = generateToken(user._id.toString());
  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

  // TODO: Send email with reset link
  logger.info(`Password reset link for ${email}: ${resetUrl}`);

  res.status(200).json({
    success: true,
    message: 'If the email exists, a reset link has been sent',
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    throw new AppError('Invalid or expired reset token', 400);
  }
});