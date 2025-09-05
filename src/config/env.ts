import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  isProduction: boolean;
  isDevelopment: boolean;
  port: number;
  serverUrl: string;
  clientUrl: string;
  mongoUri: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpire: string;
  jwtRefreshExpire: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion: string;
  s3BucketName: string;
  firebaseProjectId?: string;
  firebasePrivateKey?: string;
  firebaseClientEmail?: string;
  emailHost?: string;
  emailPort: number;
  emailUser?: string;
  emailPass?: string;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  appSettings: {
    defaultLanguage: string;
    supportedLanguages: string[];
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  safetyScore: {
    nightTravelRiskMultiplier: number;
    riskyAreaMultiplier: number;
    inactivityThresholdMinutes: number;
    maxSafetyScore: number;
  };
}

export const config: Config = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tourist_safety',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  s3BucketName: process.env.S3_BUCKET_NAME || 'tourist-safety-uploads',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  emailHost: process.env.EMAIL_HOST,
  emailPort: parseInt(process.env.EMAIL_PORT || '587', 10),
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  appSettings: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,es,fr,de,hi').split(','),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,video/mp4,audio/mpeg').split(','),
  },
  safetyScore: {
    nightTravelRiskMultiplier: parseFloat(process.env.NIGHT_TRAVEL_RISK_MULTIPLIER || '2.5'),
    riskyAreaMultiplier: parseFloat(process.env.RISKY_AREA_MULTIPLIER || '3.0'),
    inactivityThresholdMinutes: parseInt(process.env.INACTIVITY_THRESHOLD_MINUTES || '30', 10),
    maxSafetyScore: parseInt(process.env.MAX_SAFETY_SCORE || '100', 10),
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
];

if (config.isProduction) {
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is required in production`);
    }
  });
}