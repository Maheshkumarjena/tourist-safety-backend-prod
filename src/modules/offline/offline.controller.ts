import { Request, Response, NextFunction } from 'express';
import { OfflineService } from './offline.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class OfflineController {
  // Get offline sync status
  static getStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const status = await OfflineService.getSyncStatus(userId);

      res.status(200).json({
        status: 'success',
        data: status
      });
    } catch (error) {
      next(error);
    }
  };

  // Process offline requests (admin endpoint)
  static processRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await OfflineService.processOfflineRequests();

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}