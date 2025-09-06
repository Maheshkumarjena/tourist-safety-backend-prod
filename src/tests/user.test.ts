import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../modules/auth/auth.model';
import { UserProfile } from '../modules/user/user.model';
import { connectDB } from '../config/db';
import { generateToken } from '../utils/jwt';

describe('User API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await UserProfile.deleteMany({});

    // Create a test user
    const user = new User({
      email: 'test@example.com',
      password: 'hashedpassword',
      phoneNumber: '+1234567890',
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'US',
      isVerified: true
    });
    await user.save();

    userId = user._id.toString();
    authToken = generateToken({ id: userId });
  });

  describe('GET /api/v1/user/profile', () => {
    it('should get user profile', async () => {
      // Create a user profile first
      const userProfile = new UserProfile({
        userId,
        emergencyContacts: [],
        settings: {
          trackingEnabled: true,
          notificationsEnabled: true,
          language: 'en',
          emergencyAlertContacts: true
        }
      });
      await userProfile.save();

      const response = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.userId).toBe(userId);
    });

    it('should return 404 if profile not found', async () => {
      const response = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/user/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .post('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          kycDetails: {
            documentType: 'passport',
            documentNumber: 'AB1234567',
            verified: false
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.kycDetails.documentNumber).toBe('AB1234567');
    });
  });
});