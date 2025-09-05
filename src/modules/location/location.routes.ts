import { Router } from 'express';
import Joi from 'joi';
import {
    recordLocation,
    getLocationHistory,
    checkLocation,
    getCurrentLocation,
} from './location.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';

const router = Router();

// Validation schemas
const locationSchema = Joi.object({
    coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
    accuracy: Joi.number().min(0).optional(),
    altitude: Joi.number().optional(),
    speed: Joi.number().min(0).optional(),
    heading: Joi.number().min(0).max(360).optional(),
    timestamp: Joi.date().optional(),
    batteryLevel: Joi.number().min(0).max(100).optional(),
    isMoving: Joi.boolean().optional(),
    activityType: Joi.string()
        .valid('stationary', 'walking', 'running', 'cycling', 'driving', 'unknown')
        .optional(),
    geofenceId: Joi.string().optional(),
    locationType: Joi.string().valid('ping', 'sos', 'checkpoint').optional(),
    metadata: Joi.object({
        wifiSSID: Joi.string().optional(),
        cellTowerId: Joi.string().optional(),
        ipAddress: Joi.string().ip().optional(),
        countryCode: Joi.string().length(2).optional(),
    }).optional(),
});

const historyQuerySchema = Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    limit: Joi.number().min(1).max(1000).default(100),
    page: Joi.number().min(1).default(1),
});

const checkQuerySchema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
});

// Routes
router.post('/ping', authenticate, validate(locationSchema), recordLocation);
router.get('/history', authenticate, validateQuery(historyQuerySchema), getLocationHistory);
router.get('/check', authenticate, validateQuery(checkQuerySchema), checkLocation);
router.get('/current', authenticate, getCurrentLocation);

export default router;