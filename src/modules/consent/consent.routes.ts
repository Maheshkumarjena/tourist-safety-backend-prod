import express from 'express';
import { ConsentController } from './consent.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get consent history
router.get('/history', ConsentController.getHistory);

// Record consent
router.post('/record', ConsentController.recordConsent);

// Revoke consent
router.post('/revoke', ConsentController.revokeConsent);

export default router;