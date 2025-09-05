import { Router } from 'express';
import Joi from 'joi';
import {
    createSOSAlert,
    getAlertHistory,
    getAlertById,
    updateAlertStatus,
    addAlertMedia,
} from './alerts.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateParams } from '@/middleware/validate.middleware';
import { sosLimiter } from '@/middleware/rateLimit.middleware';

const router = Router();

// Validation schemas
const sosAlertSchema = Joi.object({
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
});

const statusUpdateSchema = Joi.object({
    status: Joi.string().valid('active', 'resolved', 'cancelled', 'false_alarm').required(),
    notes: Joi.string().max(1000).optional(),
});

const mediaSchema = Joi.object({
    media: Joi.array().items(
        Joi.object({
            type: Joi.string().valid('image', 'video', 'audio').required(),
            url: Joi.string().uri().required(),
            thumbnail: Joi.string().uri().optional(),
            duration: Joi.number().min(0).optional(),
        })
    ).min(1).required(),
});

const alertParamsSchema = Joi.object({
    id: Joi.string().hex().length(24).required(),
});

const historyQuerySchema = Joi.object({
    status: Joi.string().valid('active', 'resolved', 'cancelled', 'false_alarm').optional(),
    type: Joi.string().valid('sos', 'geofence', 'inactivity', 'manual', 'system').optional(),
    limit: Joi.number().min(1).max(100).default(20),
    page: Joi.number().min(1).default(1),
});

// Routes
router.post('/panic', authenticate, sosLimiter, validate(sosAlertSchema), createSOSAlert);
router.get('/history', authenticate, validate(historyQuerySchema), getAlertHistory);
router.get('/:id', authenticate, validateParams(alertParamsSchema), getAlertById);
router.patch('/:id/status', authenticate, validateParams(alertParamsSchema), validate(statusUpdateSchema), updateAlertStatus);
router.post('/:id/media', authenticate, validateParams(alertParamsSchema), validate(mediaSchema), addAlertMedia);

export default router;