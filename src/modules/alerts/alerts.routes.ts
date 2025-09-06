import express from 'express';
import { AlertController } from './alerts.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create panic alert
router.post('/panic', AlertController.panic);

// Get alert summary
router.get('/tourist-summary', AlertController.getSummary);

// Get alert history
router.get('/history', AlertController.getHistory);

// Get safety score (mock AI endpoint)
router.get('/safety-score', AlertController.getSafetyScore);

export default router;