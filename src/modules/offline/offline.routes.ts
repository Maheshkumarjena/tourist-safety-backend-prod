import express from 'express';
import { OfflineController } from './offline.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// Get offline sync status (requires authentication)
router.get('/status', authenticate, OfflineController.getStatus);

// Process offline requests (admin endpoint)
router.post('/process', OfflineController.processRequests);

export default router;