import { User, IUser } from './auth.model';
import { RegisterRequest, LoginRequest, VerifyOtpRequest, AuthResponse } from './auth.types';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';
import { UserProfile } from '../user/user.model';

export class AuthService {
  // Register a new user
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }]
    });

    if (existingUser) {
      throw new AppError('User with this email or phone number already exists', 400);
    }

    // Create new user
    const user = new User({
      ...userData,
      role: 'tourist' // Default role for registration
    });



    await user.save();

    const defaultProfile = new UserProfile({
      userId: user._id,
      emergencyContacts: [],  // Default empty array
      settings: {
        trackingEnabled: true,
        notificationsEnabled: true,
        language: 'en',
        emergencyAlertContacts: true
      },
      // Add any other default fields if needed (e.g., tripItineraries: [])
    });
    await defaultProfile.save();
    



    // Generate token
    const token = generateToken({ id: user._id });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }

  // Login user
  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }



    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken({ id: user._id });

    // Find blockchainHash from DigitalID if exists
    let blockchainHash = undefined;
    try {
      const { DigitalID } = require('../user/user.model');
      const digitalID = await DigitalID.findOne({ userId: user._id });
      if (digitalID && digitalID.blockchainHash) {
        blockchainHash = digitalID.blockchainHash;
      }
    } catch (err) {
      // ignore, do not block login
    }

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        blockchainHash
      }
    };
  }

  // Verify OTP

}