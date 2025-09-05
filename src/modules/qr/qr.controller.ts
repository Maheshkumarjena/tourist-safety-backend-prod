import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import User from '../user/user.model';
import { logger } from '@/config/logger';

/**
 * @desc    Generate QR code for user verification
 * @route   GET /api/v1/qr/generate
 * @access  Private
 */
export const generateQRCode = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Create QR code data
  const qrData = JSON.stringify({
    userId: user._id.toString(),
    timestamp: Date.now(),
    type: 'tourist_verification',
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(qrData);

  res.status(200).json({
    success: true,
    data: {
      qrCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });
});

/**
 * @desc    Verify QR code
 * @route   POST /api/v1/qr/verify
 * @access  Public (for checkpoint verification)
 */
export const verifyQRCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { qrData } = req.body;

  if (!qrData) {
    throw new AppError('QR data is required', 400);
  }

  let parsedData;
  try {
    parsedData = JSON.parse(qrData);
  } catch (error) {
    throw new AppError('Invalid QR code data', 400);
  }

  const { userId, timestamp, type } = parsedData;

  if (type !== 'tourist_verification') {
    throw new AppError('Invalid QR code type', 400);
  }

  // Check if QR code is expired (24 hours)
  if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
    throw new AppError('QR code has expired', 400);
  }

  // Get user information
  const user = await User.findById(userId).select('firstName lastName nationality kycStatus');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.kycStatus !== 'verified') {
    throw new AppError('User KYC not verified', 400);
  }

  res.status(200).json({
    success: true,
    message: 'QR code verified successfully',
    data: {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        nationality: user.nationality,
        kycStatus: user.kycStatus,
      },
      verifiedAt: new Date(),
    },
  });
});

/**
 * @desc    Get verification status
 * @route   GET /api/v1/qr/status
 * @access  Private
 */
export const getVerificationStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id).select('kycStatus kycDocuments');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      kycStatus: user.kycStatus,
      canGenerateQR: user.kycStatus === 'verified',
      documents: user.kycDocuments.map(doc => ({
        type: doc.type,
        verified: doc.verified,
        verifiedAt: doc.verifiedAt,
      })),
    },
  });
});