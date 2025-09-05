import { Router } from 'express';
import Joi from 'joi';
import {
    updateProfile,
    getProfile,
    updateEmergencyContacts,
    getEmergencyContacts,
    updateSettings,
    getSettings,
    submitKyc,
    addItineraryItem,
    getItinerary,
    deleteItineraryItem,
} from './user.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateParams } from '@/middleware/validate.middleware';

const router = Router();

// Validation schemas
const profileSchema = Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    nationality: Joi.string().optional(),
    profileImage: Joi.string().uri().optional(),
    settings: Joi.object({
        language: Joi.string().valid('en', 'es', 'fr', 'de', 'hi').optional(),
        notifications: Joi.boolean().optional(),
        locationTracking: Joi.boolean().optional(),
        offlineMode: Joi.boolean().optional(),
        emergencyAlertSound: Joi.boolean().optional(),
        vibration: Joi.boolean().optional(),
        theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    }).optional(),
});

const emergencyContactsSchema = Joi.object({
    emergencyContacts: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
            relationship: Joi.string().valid('family', 'friend', 'colleague', 'other').required(),
            email: Joi.string().email().optional(),
            isPrimary: Joi.boolean().default(false),
        })
    ).min(1).required(),
});

const settingsSchema = Joi.object({
    settings: Joi.object({
        language: Joi.string().valid('en', 'es', 'fr', 'de', 'hi').optional(),
        notifications: Joi.boolean().optional(),
        locationTracking: Joi.boolean().optional(),
        offlineMode: Joi.boolean().optional(),
        emergencyAlertSound: Joi.boolean().optional(),
        vibration: Joi.boolean().optional(),
        theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    }).required(),
});

const kycSchema = Joi.object({
    kycDocuments: Joi.array().items(
        Joi.object({
            type: Joi.string().valid('passport', 'aadhaar', 'driving_license', 'voter_id', 'other').required(),
            frontImage: Joi.string().uri().required(),
            backImage: Joi.string().uri().optional(),
            number: Joi.string().optional(),
            expiryDate: Joi.date().optional(),
        })
    ).min(1).required(),
});

const itinerarySchema = Joi.object({
    destination: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    accommodation: Joi.string().optional(),
    coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }).required(),
    notes: Joi.string().max(500).optional(),
});

const itineraryParamsSchema = Joi.object({
    itemId: Joi.string().hex().length(24).required(),
});

// Routes
router.put('/profile', authenticate, validate(profileSchema), updateProfile);
router.get('/profile', authenticate, getProfile);
router.put('/emergency-contacts', authenticate, validate(emergencyContactsSchema), updateEmergencyContacts);
router.get('/emergency-contacts', authenticate, getEmergencyContacts);
router.put('/settings', authenticate, validate(settingsSchema), updateSettings);
router.get('/settings', authenticate, getSettings);
router.post('/kyc', authenticate, validate(kycSchema), submitKyc);
router.post('/itinerary', authenticate, validate(itinerarySchema), addItineraryItem);
router.get('/itinerary', authenticate, getItinerary);
router.delete('/itinerary/:itemId', authenticate, validateParams(itineraryParamsSchema), deleteItineraryItem);

export default router;