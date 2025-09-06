import { UserProfile, DigitalID, IUserProfile, IDigitalID, KYCDetails, TripItinerary, EmergencyContact, UserSettings } from './user.model';
import { UpdateProfileRequest, UpdateEmergencyContactsRequest, UpdateSettingsRequest } from './user.types';
import { AppError } from '../../utils/appError';
import QRCode from 'qrcode';
import { logger } from '../../config/logger';

export class UserService {
  // Get user profile
  static async getProfile(userId: string): Promise<IUserProfile> {
    const profile = await UserProfile.findOne({ userId }).populate('userId', 'firstName lastName email phoneNumber');

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile;
  }

  // Update user profile
  static async updateProfile(userId: string, profileData: UpdateProfileRequest): Promise<IUserProfile> {
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      // Create new profile if it doesn't exist
      profile = new UserProfile({ userId, ...profileData });
    } else {
      // Update existing profile
      if (profileData.kycDetails) {
        profile.kycDetails = { ...profile.kycDetails, ...profileData.kycDetails };
      }

      if (profileData.tripItineraries) {
        profile.tripItineraries = profileData.tripItineraries;
      }
    }

    await profile.save();

    // If KYC details were provided and this is the first time, generate mock digital ID
    if (profileData.kycDetails && !profileData.kycDetails.verified) {
      await this.generateMockDigitalID(userId);
    }

    return profile;
  }

  // Get current trip itinerary
  static async getCurrentTrip(userId: string): Promise<TripItinerary | null> {
    const profile = await UserProfile.findOne({ userId });

    if (!profile || profile.tripItineraries.length === 0) {
      return null;
    }

    const now = new Date();

    // Find the current trip (where current date is between start and end date)
    const currentTrip = profile.tripItineraries.find(trip =>
      trip.startDate <= now && trip.endDate >= now
    );

    return currentTrip || profile.tripItineraries[0]; // Return first trip if no current trip
  }

  // Update emergency contacts
  static async updateEmergencyContacts(userId: string, contactsData: UpdateEmergencyContactsRequest): Promise<EmergencyContact[]> {
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    profile.emergencyContacts = contactsData.contacts;
    await profile.save();

    return profile.emergencyContacts;
  }

  // Get emergency contacts
  static async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile.emergencyContacts;
  }

  // Update user settings
  static async updateSettings(userId: string, settingsData: UpdateSettingsRequest): Promise<UserSettings> {
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    profile.settings = { ...profile.settings, ...settingsData.settings };
    await profile.save();

    return profile.settings;
  }

  // Generate mock digital ID (for blockchain simulation)
  private static async generateMockDigitalID(userId: string): Promise<IDigitalID> {
    // Check if digital ID already exists
    const existingID = await DigitalID.findOne({ userId });
    if (existingID) {
      return existingID;
    }

    // Generate ID data
    const idData = JSON.stringify({
      userId,
      issuedAt: new Date(),
      type: 'tourist-safety-id',
      status: 'active'
    });

    // Set expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(idData);

    // Create digital ID
    const digitalID = new DigitalID({
      userId,
      idData,
      expiryDate,
      qrCode
    });

    await digitalID.save();

    logger.info(`Mock digital ID generated for user ${userId}`);

    return digitalID;
  }
}