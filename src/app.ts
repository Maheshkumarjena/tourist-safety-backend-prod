import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/env';
import { errorMiddleware } from '@/middleware/error.middleware';
import { logger } from '@/config/logger';
import { swaggerSpec, swaggerUi } from '@/config/swagger';

// Import all module routes
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/user/user.routes';
import locationRoutes from '@/modules/location/location.routes';
import alertsRoutes from '@/modules/alerts/alerts.routes';
import mediaRoutes from '@/modules/media/media.routes';
import notificationsRoutes from '@/modules/notifications/notifications.routes';
import qrRoutes from '@/modules/qr/qr.routes';
import consentRoutes from '@/modules/consent/consent.routes';
import offlineRoutes from '@/modules/offline/offline.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: config.isProduction ? config.clientUrl : '*',
        credentials: true,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Static files
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Tourist Safety API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.isProduction ? 'production' : 'development',
    });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/consent', consentRoutes);
app.use('/api/v1/offline', offlineRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Global error handler
app.use(errorMiddleware);

export default app;