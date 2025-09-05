import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import Alert from '@/modules/alerts/alerts.model';
import User from '@/modules/user/user.model';

describe('Alerts API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      // ... other fields
    });
    userId = user._id.toString();
    authToken = user.generateAuthToken();
  });

  afterAll(async () => {
    await Alert.deleteMany({});
  });

  it('should create SOS alert', async () => {
    const alertData = {
      coordinates: { latitude: 28.6139, longitude: 77.2090 },
      message: 'Help needed',
    };

    const response = await request(app)
      .post('/api/v1/alerts/panic')
      .set('Authorization', `Bearer ${authToken}`)
      .send(alertData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.alert.message).toBe(alertData.message);
  });

  it('should get alert history', async () => {
    const response = await request(app)
      .get('/api/v1/alerts/history')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.alerts).toBeInstanceOf(Array);
  });
});