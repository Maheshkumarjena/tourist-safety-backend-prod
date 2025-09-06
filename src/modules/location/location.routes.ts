import express from 'express';
import { LocationController } from './location.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// Record location ping (requires authentication)
router.post('/ping', authenticate, LocationController.ping);

// Get location history (requires authentication)
router.get('/history', authenticate, LocationController.getHistory);

// Check zone (public endpoint)
router.get('/check', LocationController.checkZone);

export default router;