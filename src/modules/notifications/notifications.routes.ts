import express from 'express';
import { NotificationController } from './notifications.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', NotificationController.getNotifications);

// Mark notification as read
router.post('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.post('/read-all', NotificationController.markAllAsRead);

export default router;