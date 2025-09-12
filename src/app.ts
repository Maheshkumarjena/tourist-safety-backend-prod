import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { logger } from './config/logger';
import { swaggerSetup } from './config/swagger';
import { initSocket } from './config/socket';


// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import locationRoutes from './modules/location/location.routes';
import alertsRoutes from './modules/alerts/alerts.routes';
import mediaRoutes from './modules/media/media.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import qrRoutes from './modules/qr/qr.routes';
import consentRoutes from './modules/consent/consent.routes';
import offlineRoutes from './modules/offline/offline.routes';
// ... existing imports ...
import adminRoutes from './modules/admin/admin.routes';
import aiRoutes from './modules/ai/ai.routes';

// ... existing code ...
 // New AI service routes

// ... rest of the code ...


const app = express();

app.use(initSocket); // Initialize Socket.io

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-production-domain.com']
        : ['http://localhost:8080', 'http://localhost:3001'],
    credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Swagger documentation
swaggerSetup(app);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/blockchain', qrRoutes); // QR routes under blockchain path
app.use('/api/consent', consentRoutes);
app.use('/api/offline', offlineRoutes);
app.use('/api/ai', alertsRoutes); // AI routes under alerts
app.use('/api/admin', adminRoutes);
app.use('/api/ai-service', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);
app.use(notFoundHandler);

export default app;