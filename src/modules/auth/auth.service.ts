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

    // Generate OTP (mock implementation)
    const otp = '123456'; // In production, generate a random 6-digit number
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;

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
    

    // Log OTP (in production, send via SMS/email)
    logger.info(`OTP for ${user.email}: ${otp}`);

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

    // Check if user is verified
    if (!user.isVerified) {
      throw new AppError('Please verify your account first', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

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

  // Verify OTP
  static async verifyOtp(otpData: VerifyOtpRequest): Promise<{ message: string }> {
    const { email, otp } = otpData;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return { message: 'Account verified successfully' };
  }
}