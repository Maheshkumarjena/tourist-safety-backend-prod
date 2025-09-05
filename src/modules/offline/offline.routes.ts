import { Router } from 'express';
import Joi from 'joi';
import {
    syncOfflineData,
    getSyncStatus,
    getOfflineConfig,
} from './offline.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';

const router = Router();

// Validation schemas
const syncSchema = Joi.object({
    locations: Joi.array().items(
        Joi.object({
            coordinates: Joi.object({
                latitude: Joi.number().min(-90).max(90).required(),
                longitude: Joi.number().min(-180).max(180).required(),
            }).required(),
            accuracy: Joi.number().min(0).optional(),
            altitude: Joi.number().optional(),
            speed: Joi.number().min(0).optional(),
            heading: Joi.number().min(0).max(360).optional(),
            timestamp: Joi.date().required(),
            batteryLevel: Joi.number().min(0).max(100).optional(),
            isMoving: Joi.boolean().optional(),
            activityType: Joi.string()
                .valid('stationary', 'walking', 'running', 'cycling', 'driving', 'unknown')
                .optional(),
            geofenceId: Joi.string().optional(),
            locationType: Joi.string().valid('ping', 'sos', 'checkpoint').optional(),
        })
    ).optional(),
    alerts: Joi.array().items(
        Joi.object({
            type: Joi.string().valid('sos', 'geofence', 'inactivity', 'manual', 'system').required(),
            coordinates: Joi.object({
                latitude: Joi.number().min(-90).max(90).required(),
                longitude: Joi.number().min(-180).max(180).required(),
            }).required(),
            accuracy: Joi.number().min(0).optional(),
            message: Joi.string().max(500).optional(),
            media: Joi.array().items(
                Joi.object({
                    type: Joi.string().valid('image', 'video', 'audio').required(),
                    url: Joi.string().uri().required(),
                    thumbnail: Joi.string().uri().optional(),
                    duration: Joi.number().min(0).optional(),
                })
            ).optional(),
            additionalData: Joi.object({
                batteryLevel: Joi.number().min(0).max(100).optional(),
                networkType: Joi.string().valid('wifi', 'cellular', 'none', 'unknown').optional(),
                nearbyWifi: Joi.array().items(Joi.string()).optional(),
                audioRecording: Joi.string().uri().optional(),
            }).optional(),
            timestamp: Joi.date().required(),
        })
    ).optional(),
});

// Routes
router.post('/sync', authenticate, validate(syncSchema), syncOfflineData);
router.get('/status', authenticate, getSyncStatus);
router.get('/config', authenticate, getOfflineConfig);

export default router;