import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import Notification from './notifications.model';
import User from '../user/user.model';
import { logger } from '@/config/logger';

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { read, type, limit = 20, page = 1 } = req.query;

  const query: any = { userId: req.user._id };

  if (read !== undefined) {
    query.read = read === 'true';
  }
  if (type) {
    query.type = type;
  }

  const options = {
    sort: { sentAt: -1 },
    limit: parseInt(limit as string),
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
  };

  const notifications = await Notification.find(query, null, options);
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    read: false
  });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

/**
 * @desc    Mark notification as read
 * @route   POST /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: {
      notification,
    },
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   POST /api/v1/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`,
    data: {
      modifiedCount: result.modifiedCount,
    },
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

/**
 * @desc    Get notification preferences
 * @route   GET /api/v1/notifications/preferences
 * @access  Private
 */
export const getPreferences = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user._id).select('settings');

  res.status(200).json({
    success: true,
    data: {
      preferences: user?.settings || {},
    },
  });
});

/**
 * @desc    Update notification preferences
 * @route   PUT /api/v1/notifications/preferences
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { notifications, emergencyAlertSound, vibration } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'settings.notifications': notifications,
        'settings.emergencyAlertSound': emergencyAlertSound,
        'settings.vibration': vibration,
      },
    },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      preferences: user.settings,
    },
  });
});

// Helper function to create notification
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any,
  priority: string = 'medium',
  channels: string[] = ['in_app']
): Promise<void> => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      priority,
      channels,
      sentAt: new Date(),
    });

    // TODO: Send push notifications, emails, or SMS based on channels
    if (channels.includes('push')) {
      await sendPushNotification(userId, title, message, data);
    }
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

const sendPushNotification = async (userId: string, title: string, message: string, data?: any): Promise<void> => {
  try {
    const user = await User.findById(userId).select('fcmToken');

    if (!user || !user.fcmToken) {
      return;
    }

    // TODO: Implement FCM push notification
    // This would use firebase-admin to send notifications
    logger.info(`Sending push notification to user ${userId}: ${title} - ${message}`);
  } catch (error) {
    logger.error('Error sending push notification:', error);
  }
};