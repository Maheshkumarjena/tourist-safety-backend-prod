import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import User from '@/modules/user/user.model';
import { config } from '@/config/env';

describe('User API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create test user and get token
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      phoneNumber: '+1234567890',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      nationality: 'US',
    });

    userId = user._id.toString();
    authToken = user.generateAuthToken();
  });

  describe('PUT /api/v1/user/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        nationality: 'UK',
      };

      const response = await request(app)
        .put('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.lastName).toBe(updateData.lastName);
      expect(response.body.data.user.nationality).toBe(updateData.nationality);
    });
  });

  describe('PUT /api/v1/user/emergency-contacts', () => {
    it('should update emergency contacts', async () => {
      const contactsData = {
        emergencyContacts: [
          {
            name: 'Emergency Contact',
            phoneNumber: '+1234567890',
            relationship: 'family',
            isPrimary: true,
          },
        ],
      };

      const response = await request(app)
        .put('/api/v1/user/emergency-contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contactsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emergencyContacts).toHaveLength(1);
      expect(response.body.data.emergencyContacts[0].name).toBe('Emergency Contact');
    });
  });

  describe('POST /api/v1/user/kyc', () => {
    it('should submit KYC documents', async () => {
      const kycData = {
        kycDocuments: [
          {
            type: 'passport',
            frontImage: 'https://example.com/passport-front.jpg',
            number: 'A12345678',
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/user/kyc')
        .set('Authorization', `Bearer ${authToken}`)
        .send(kycData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kycStatus).toBe('pending');
      expect(response.body.data.kycDocuments).toHaveLength(1);
    });
  });
});