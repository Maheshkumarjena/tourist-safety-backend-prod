import { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service';
import { uploadSingle } from '../../utils/uploader';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../utils/appError';

export class MediaController {
  // Upload media file
  static upload = [
    uploadSingle('media'),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.file) {
          throw new AppError('No file uploaded', 400);
        }

        const userId = req.user.id;
        const alertId = req.body.alertId;

        const fileInfo = await MediaService.uploadFile(req.file, userId, alertId);

        res.status(201).json({
          status: 'success',
          data: fileInfo
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Get media file
  static getFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { filename } = req.params;

      const fileInfo = await MediaService.getFile(filename);

      res.setHeader('Content-Type', fileInfo.mimetype);
      res.setHeader('Content-Length', fileInfo.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      // Stream the file
      const fs = require('fs');
      const readStream = fs.createReadStream(fileInfo.path);
      readStream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  // Delete media file
  static deleteFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { filename } = req.params;
      const userId = req.user.id;

      // In a real implementation, you would check if the user owns this file
      await MediaService.deleteFile(filename);

      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}