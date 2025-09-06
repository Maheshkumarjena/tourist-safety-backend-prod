import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { QRService } from './qr.service';
import { IssueIDRequest, VerifyQRRequest } from './qr.types';
import { validate, validateParams } from '../../middleware/validate.middleware';

// Validation schemas
const issueIDSchema = Joi.object({
  userId: Joi.string().required(),
  idData: Joi.string().required(),
  expiryDate: Joi.date().required().greater('now')
});

const verifyQRSchema = Joi.object({
  qrData: Joi.string().required()
});

const idParamsSchema = Joi.object({
  id: Joi.string().required()
});

export class QRController {
  // Issue mock digital ID
  static issueID = [
    validate(issueIDSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const issueData: IssueIDRequest = req.body;
        const digitalID = await QRService.issueDigitalID(issueData);

        res.status(201).json({
          status: 'success',
          data: digitalID
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Get QR code by ID
  static getQRCode = [
    validateParams(idParamsSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const qrCode = await QRService.getQRCode(id);

        // Return as base64 image
        const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');

        res.setHeader('Content-Type', 'image/png');
        res.send(imgBuffer);
      } catch (error) {
        next(error);
      }
    }
  ];

  // Verify QR code
  static verifyQR = [
    validate(verifyQRSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const verifyData: VerifyQRRequest = req.body;
        const result = await QRService.verifyQRCode(verifyData);

        res.status(200).json({
          status: 'success',
          data: result
        });
      } catch (error) {
        next(error);
      }
    }
  ];
}