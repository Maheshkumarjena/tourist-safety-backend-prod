import request from 'supertest';
import mongoose from 'mongoose';
import app from '@/app';
import Location from '@/modules/location/location.model';
import User from '@/modules/user/user.model';

describe('Location API', () => {
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
    await Location.deleteMany({});
  });

  it('should record location', async () => {
    const locationData = {
      coordinates: { latitude: 28.6139, longitude: 77.2090 },
      timestamp: new Date(),
    };

    const response = await request(app)
      .post('/api/v1/location/ping')
      .set('Authorization', `Bearer ${authToken}`)
      .send(locationData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.location.coordinates.latitude).toBe(locationData.coordinates.latitude);
  });

  it('should get location history', async () => {
    const response = await request(app)
      .get('/api/v1/location/history')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.locations).toBeInstanceOf(Array);
  });
});