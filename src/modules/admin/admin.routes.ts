import express from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/auth.middleware';

const router = express.Router();

// Admin registration (secured by admin code)
router.post('/register', AdminController.register);

// Admin login
router.post('/login', AdminController.login);

// All routes below require admin authentication
router.use(authenticate);
router.use(authorize('admin', 'super_admin', 'authority'));

// Dashboard routes
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/heatmap', AdminController.getHeatmapData);

// Tourist management
router.get('/tourists', AdminController.getTourists);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;