import { Router } from 'express';
import Joi from 'joi';
import {
    recordConsent,
    getConsentHistory,
    getConsentStatus,
    getConsentRequirements,
} from './consent.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';

const router = Router();

// Validation schemas
const consentSchema = Joi.object({
    type: Joi.string()
        .valid('privacy_policy', 'terms_of_service', 'location_tracking', 'data_processing')
        .required(),
    version: Joi.string().required(),
    accepted: Joi.boolean().required(),
    language: Joi.string().default('en'),
    metadata: Joi.object({
        deviceId: Joi.string().optional(),
        appVersion: Joi.string().optional(),
        location: Joi.string().optional(),
    }).optional(),
});

const historyQuerySchema = Joi.object({
    type: Joi.string()
        .valid('privacy_policy', 'terms_of_service', 'location_tracking', 'data_processing')
        .optional(),
    limit: Joi.number().min(1).max(100).default(20),
    page: Joi.number().min(1).default(1),
});

// Routes
router.post('/', authenticate, validate(consentSchema), recordConsent);
router.get('/history', authenticate, validateQuery(historyQuerySchema), getConsentHistory);
router.get('/status', authenticate, getConsentStatus);
router.get('/requirements', getConsentRequirements);

export default router;