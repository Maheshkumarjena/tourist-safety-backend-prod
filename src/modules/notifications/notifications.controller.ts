import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notifications.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class NotificationController {
  // Get user notifications
  static getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    console.log('Fetching notifications for user:', req.user.id);
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;

      const result = await NotificationService.getUserNotifications(userId, limit, page);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  // Mark notification as read
  static markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await NotificationService.markAsRead(userId, id);

      res.status(200).json({
        status: 'success',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  };

  // Mark all notifications as read
  static markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;

      const result = await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}