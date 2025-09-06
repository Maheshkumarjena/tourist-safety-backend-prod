import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ConsentService } from './consent.service';
import { validate } from '../../middleware/validate.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

// Validation schemas
const recordConsentSchema = Joi.object({
  type: Joi.string().valid('tracking', 'notifications', 'data_collection', 'emergency_contacts').required(),
  granted: Joi.boolean().required(),
  purpose: Joi.string().required(),
  version: Joi.string().required(),
  expiresAt: Joi.date().optional().greater('now')
});

const revokeConsentSchema = Joi.object({
  type: Joi.string().valid('tracking', 'notifications', 'data_collection', 'emergency_contacts').required(),
  purpose: Joi.string().required(),
  version: Joi.string().required()
});

export class ConsentController {
  // Record consent
  static recordConsent = [
    validate(recordConsentSchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const consentData = req.body;

        const consent = await ConsentService.recordConsent({
          userId,
          ...consentData
        });

        res.status(201).json({
          status: 'success',
          data: consent
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Get consent history
  static getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const history = await ConsentService.getConsentHistory(userId);

      res.status(200).json({
        status: 'success',
        data: history
      });
    } catch (error) {
      next(error);
    }
  };

  // Revoke consent
  static revokeConsent = [
    validate(revokeConsentSchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const { type, purpose, version } = req.body;

        const consent = await ConsentService.revokeConsent(userId, type, purpose, version);

        res.status(200).json({
          status: 'success',
          data: consent
        });
      } catch (error) {
        next(error);
      }
    }
  ];
}