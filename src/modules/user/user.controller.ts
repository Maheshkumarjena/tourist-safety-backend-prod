import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { UserService } from './user.service';
import { UpdateProfileRequest, UpdateEmergencyContactsRequest, UpdateSettingsRequest } from './user.types';
import { validate } from '../../middleware/validate.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

// Validation schemas
const updateProfileSchema = Joi.object({
  kycDetails: Joi.object({
    documentType: Joi.string().valid('aadhaar', 'passport', 'driver-license').required(),
    documentNumber: Joi.string().required(),
    documentImage: Joi.string().optional()
  }).optional(),
  tripItineraries: Joi.array().items(
    Joi.object({
      destination: Joi.string().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required().greater(Joi.ref('startDate')),
      accommodation: Joi.string().required(),
      activities: Joi.array().items(Joi.string()).optional()
    })
  ).optional()
});

const emergencyContactsSchema = Joi.object({
  contacts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().required(),
      relationship: Joi.string().required()
    })
  ).required()
});

const settingsSchema = Joi.object({
  settings: Joi.object({
    trackingEnabled: Joi.boolean().optional(),
    notificationsEnabled: Joi.boolean().optional(),
    language: Joi.string().optional(),
    emergencyAlertContacts: Joi.boolean().optional()
  }).required()
});

export class UserController {
  // Get user profile
  static getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      console.log('Fetching profile for user ID:', userId);
      const profile = await UserService.getProfile(userId);

      res.status(200).json({
        status: 'success',
        data: profile
      });
    } catch (error) { 
      next(error);
    }
  };

  // Update user profile
  static updateProfile = [
    validate(updateProfileSchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const profileData: UpdateProfileRequest = req.body;
        const profile = await UserService.updateProfile(userId, profileData);

        res.status(200).json({
          status: 'success',
          data: profile
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Get current trip
  static getCurrentTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const currentTrip = await UserService.getCurrentTrip(userId);

      res.status(200).json({
        status: 'success',
        data: currentTrip
      });
    } catch (error) {
      next(error);
    }
  };

  // Update emergency contacts
  static updateEmergencyContacts = [
    validate(emergencyContactsSchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const contactsData: UpdateEmergencyContactsRequest = req.body;
        const contacts = await UserService.updateEmergencyContacts(userId, contactsData);

        res.status(200).json({
          status: 'success',
          data: contacts
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  // Get emergency contacts
  static getEmergencyContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;
      const contacts = await UserService.getEmergencyContacts(userId);

      res.status(200).json({
        status: 'success',
        data: contacts
      });
    } catch (error) {
      next(error);
    }
  };

  // Update user settings
  static updateSettings = [
    validate(settingsSchema),
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.user.id;
        const settingsData: UpdateSettingsRequest = req.body;
        const settings = await UserService.updateSettings(userId, settingsData);

        res.status(200).json({
          status: 'success',
          data: settings
        });
      } catch (error) {
        next(error);
      }
    }
  ];
}