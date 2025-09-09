import express from 'express';
import { AIController } from './ai.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/auth.middleware';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Safety score calculation
router.post('/safety-score', authorize('admin', 'super_admin'), AIController.calculateSafetyScore);

// Anomaly detection
router.post('/anomaly-detection', authorize('admin', 'super_admin'), AIController.detectAnomalies);

// Predictive alerts
router.post('/predictive-alerts', authorize('admin', 'super_admin'), AIController.generatePredictiveAlerts);

// Behavior analysis
router.post('/behavior-analysis', authorize('admin', 'super_admin'), AIController.analyzeBehavior);

export default router;