import express from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile
router.post('/profile', UserController.updateProfile);

// Get current trip itinerary
router.get('/current-trip', UserController.getCurrentTrip);

// Update emergency contacts
router.post('/emergency-contacts', UserController.updateEmergencyContacts);

// Get emergency contacts
router.get('/emergency-contacts', UserController.getEmergencyContacts);

// Update user settings
router.post('/settings', UserController.updateSettings);

export default router;