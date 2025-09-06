import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { LocationService } from './location.service';
import { Point } from './location.types';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

// Validation schemas
const locationPingSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().optional(),
  altitude: Joi.number().optional(),
  speed: Joi.number().optional()
});

const locationHistoryQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional().greater(Joi.ref('startDate'))
});

const zoneCheckQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required()
});

export class LocationController {
  // Record location ping
  static ping = [
    validate(locationPingSchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const coordinates: Point = {
          latitude: req.body.latitude,
          longitude: req.body.longitude
        };

        const additionalData = {
          accuracy: req.body.accuracy,
          altitude: req.body.altitude,
          speed: req.body.speed
        };

        const locationRecord = await LocationService.recordLocation(userId, coordinates, additionalData);

        res.status(201).json({
          status: 'success',
          data: locationRecord
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Get location history
  static getHistory = [
    validateQuery(locationHistoryQuerySchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        const history = await LocationService.getLocationHistory(
          userId,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );

        res.status(200).json({
          status: 'success',
          data: history
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Check zone for coordinates
  static checkZone = [
    validateQuery(zoneCheckQuerySchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const coordinates: Point = {
          latitude: parseFloat(req.query.lat as string),
          longitude: parseFloat(req.query.lng as string)
        };

        const result = await LocationService.checkZone(coordinates);

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