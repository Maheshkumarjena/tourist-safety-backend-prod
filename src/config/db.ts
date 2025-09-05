import mongoose from 'mongoose';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes
    await createIndexes();
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const createIndexes = async (): Promise<void> => {
  try {
    // Create geospatial index for location data
    await mongoose.connection.collection('locations').createIndex({
      coordinates: '2dsphere'
    });

    // Create TTL index for location data (auto-delete after 30 days)
    await mongoose.connection.collection('locations').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 2592000 } // 30 days
    );

    // Create index for alerts
    await mongoose.connection.collection('alerts').createIndex({ userId: 1 });
    await mongoose.connection.collection('alerts').createIndex({ status: 1 });
    await mongoose.connection.collection('alerts').createIndex({ createdAt: -1 });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
  }
};

// MongoDB connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});