import { Notification, INotification } from './notifications.model';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';

export class NotificationService {
  // Create a new notification
  static async createNotification(notificationData: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string, limit: number = 20, page: number = 1): Promise<{
    notifications: INotification[];
    total: number;
    unread: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const [notifications, total, unread] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false })
    ]);

    return {
      notifications,
      total,
      unread,
      pages: Math.ceil(total / limit)
    };
  }

  // Mark notification as read
  static async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    const notification = await Notification.findOne({ _id: notificationId, userId });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.read = true;
    await notification.save();

    return notification;
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    return { modifiedCount: result.modifiedCount || 0 };
  }

  // Create system notification (e.g., safety advisory)
  static async createSystemNotification(
    title: string,
    message: string,
    data?: any,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    // In a real implementation, this would send to all users or specific users
    logger.info(`System notification: ${title} - ${message}`);

    // For demo purposes, we'll just log it
    // In production, this would use a message queue to send to all users
  }
}