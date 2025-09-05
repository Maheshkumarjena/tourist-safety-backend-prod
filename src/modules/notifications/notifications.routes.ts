import { Router } from 'express';
import Joi from 'joi';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
} from './notifications.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '@/middleware/validate.middleware';

const router = Router();

// Validation schemas
const notificationParamsSchema = Joi.object({
    id: Joi.string().hex().length(24).required(),
});

const notificationsQuerySchema = Joi.object({
    read: Joi.boolean().optional(),
    type: Joi.string().valid('alert', 'safety', 'system', 'info', 'warning').optional(),
    limit: Joi.number().min(1).max(100).default(20),
    page: Joi.number().min(1).default(1),
});

const preferencesSchema = Joi.object({
    notifications: Joi.boolean().optional(),
    emergencyAlertSound: Joi.boolean().optional(),
    vibration: Joi.boolean().optional(),
});

// Routes
router.get('/', authenticate, validateQuery(notificationsQuerySchema), getNotifications);
router.post('/:id/read', authenticate, validateParams(notificationParamsSchema), markAsRead);
router.post('/read-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, validateParams(notificationParamsSchema), deleteNotification);
router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, validate(preferencesSchema), updatePreferences);

export default router;