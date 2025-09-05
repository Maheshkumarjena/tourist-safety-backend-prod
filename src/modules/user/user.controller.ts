import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import User from './user.model';
import { AppError } from '@/middleware/error.middleware';

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/user/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    profileImage,
    settings,
  } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(nationality && { nationality }),
      ...(profileImage && { profileImage }),
      ...(settings && { settings: { ...req.user.settings, ...settings } }),
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

/**
 * @desc    Get user profile
 * @route   GET /api/v1/user/profile
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
 * @desc    Add or update emergency contacts
 * @route   PUT /api/v1/user/emergency-contacts
 * @access  Private
 */
export const updateEmergencyContacts = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { emergencyContacts } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { emergencyContacts },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Emergency contacts updated successfully',
    data: {
      emergencyContacts: user.emergencyContacts,
    },
  });
});

/**
 * @desc    Get emergency contacts
 * @route   GET /api/v1/user/emergency-contacts
 * @access  Private
 */
export const getEmergencyContacts = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id).select('emergencyContacts');

  res.status(200).json({
    success: true,
    data: {
      emergencyContacts: user?.emergencyContacts || [],
    },
  });
});

/**
 * @desc    Update user settings
 * @route   PUT /api/v1/user/settings
 * @access  Private
 */
export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { settings } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { settings: { ...req.user.settings, ...settings } },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      settings: user.settings,
    },
  });
});

/**
 * @desc    Get user settings
 * @route   GET /api/v1/user/settings
 * @access  Private
 */
export const getSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id).select('settings');

  res.status(200).json({
    success: true,
    data: {
      settings: user?.settings || {},
    },
  });
});

/**
 * @desc    Submit KYC documents
 * @route   POST /api/v1/user/kyc
 * @access  Private
 */
export const submitKyc = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { kycDocuments } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      kycDocuments,
      kycStatus: 'pending'
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'KYC documents submitted successfully',
    data: {
      kycStatus: user.kycStatus,
      kycDocuments: user.kycDocuments,
    },
  });
});

/**
 * @desc    Add itinerary item
 * @route   POST /api/v1/user/itinerary
 * @access  Private
 */
export const addItineraryItem = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const itineraryItem = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { itinerary: itineraryItem } },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Itinerary item added successfully',
    data: {
      itinerary: user.itinerary,
    },
  });
});

/**
 * @desc    Get itinerary
 * @route   GET /api/v1/user/itinerary
 * @access  Private
 */
export const getItinerary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id).select('itinerary');

  res.status(200).json({
    success: true,
    data: {
      itinerary: user?.itinerary || [],
    },
  });
});

/**
 * @desc    Delete itinerary item
 * @route   DELETE /api/v1/user/itinerary/:itemId
 * @access  Private
 */
export const deleteItineraryItem = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { itemId } = req.params;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { itinerary: { _id: itemId } } },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Itinerary item deleted successfully',
    data: {
      itinerary: user.itinerary,
    },
  });
});