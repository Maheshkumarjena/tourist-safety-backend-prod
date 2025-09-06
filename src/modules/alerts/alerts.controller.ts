import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AlertService } from './alerts.service';
import { PanicAlertRequest } from './alerts.types';
import { validate } from '../../middleware/validate.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

// Validation schemas
const panicAlertSchema = Joi.object({
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  message: Joi.string().optional(),
  mediaUrls: Joi.array().items(Joi.string()).optional()
});

export class AlertController {
  // Create panic alert
  static panic = [
    validate(panicAlertSchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const alertData: PanicAlertRequest = req.body;

        const alert = await AlertService.createPanicAlert(userId, alertData);

        res.status(201).json({
          status: 'success',
          data: alert
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Get alert summary
  static getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const summary = await AlertService.getAlertSummary(userId);

      res.status(200).json({
        status: 'success',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  };

  // Get alert history
  static getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;

      const history = await AlertService.getAlertHistory(userId, limit, page);

      res.status(200).json({
        status: 'success',
        data: history
      });
    } catch (error) {
      next(error);
    }
  };

  // Get safety score (mock AI endpoint)
  static getSafetyScore = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const safetyScore = await AlertService.getSafetyScore(userId);

      res.status(200).json({
        status: 'success',
        data: safetyScore
      });
    } catch (error) {
      next(error);
    }
  };
}