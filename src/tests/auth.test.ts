import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../modules/auth/auth.model';
import { connectDB } from '../config/db';

describe('Auth API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '+1234567890',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should not register user with existing email', async () => {
      // Create a user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '+1234567890',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US'
        });

      // Try to create another user with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '+0987654321',
          firstName: 'Test2',
          lastName: 'User2',
          dateOfBirth: '1990-01-01',
          nationality: 'US'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login existing user', async () => {
      // Register user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '+1234567890',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US'
        });

      // Verify OTP first (mock)
      await User.updateOne({ email: 'test@example.com' }, { isVerified: true });

      // Login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with wrong password', async () => {
      // Register user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '+1234567890',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US'
        });

      // Verify OTP first (mock)
      await User.updateOne({ email: 'test@example.com' }, { isVerified: true });

      // Login with wrong password
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('Invalid email or password');
    });
  });
});