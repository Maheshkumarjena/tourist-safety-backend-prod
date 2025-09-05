import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import Consent from './consent.model';
import { logger } from '@/config/logger';

/**
 * @desc    Record user consent
 * @route   POST /api/v1/consent
 * @access  Private
 */
export const recordConsent = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, version, accepted, language, metadata } = req.body;

  // Record consent
  const consent = await Consent.create({
    userId: req.user._id,
    type,
    version,
    accepted,
    language: language || 'en',
    ipAddress: req.ip || req.connection.remoteAddress || '',
    userAgent: req.get('User-Agent') || '',
    metadata,
    acceptedAt: new Date(),
  });

  // Update user settings based on consent type
  await updateUserSettings(req.user._id, type, accepted);

  res.status(201).json({
    success: true,
    message: 'Consent recorded successfully',
    data: {
      consent,
    },
  });
});

/**
 * @desc    Get consent history
 * @route   GET /api/v1/consent/history
 * @access  Private
 */
export const getConsentHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, limit = 20, page = 1 } = req.query;

  const query: any = { userId: req.user._id };

  if (type) {
    query.type = type;
  }

  const options = {
    sort: { acceptedAt: -1 },
    limit: parseInt(limit as string),
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
  };

  const consents = await Consent.find(query, null, options);
  const total = await Consent.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      consents,
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
 * @desc    Get current consent status
 * @route   GET /api/v1/consent/status
 * @access  Private
 */
export const getConsentStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const consentTypes = ['privacy_policy', 'terms_of_service', 'location_tracking', 'data_processing'];

  const latestConsents = await Promise.all(
    consentTypes.map(async (type) => {
      const consent = await Consent.findOne(
        { userId: req.user._id, type },
        {},
        { sort: { acceptedAt: -1 } }
      );
      return consent;
    })
  );

  const status = consentTypes.reduce((acc, type, index) => {
    acc[type] = {
      accepted: latestConsents[index]?.accepted || false,
      version: latestConsents[index]?.version || '1.0.0',
      acceptedAt: latestConsents[index]?.acceptedAt,
    };
    return acc;
  }, {} as any);

  res.status(200).json({
    success: true,
    data: {
      status,
    },
  });
});

/**
 * @desc    Get consent requirements (latest versions)
 * @route   GET /api/v1/consent/requirements
 * @access  Public
 */
export const getConsentRequirements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // In a real application, this would come from a database or configuration
  const requirements = {
    privacy_policy: {
      version: '2.1.0',
      required: true,
      title: {
        en: 'Privacy Policy',
        es: 'Política de Privacidad',
        fr: 'Politique de Confidentialité',
        de: 'Datenschutzrichtlinie',
        hi: 'गोपनीयता नीति',
      },
      url: {
        en: '/privacy-policy',
        es: '/es/privacy-policy',
        fr: '/fr/privacy-policy',
        de: '/de/privacy-policy',
        hi: '/hi/privacy-policy',
      },
    },
    terms_of_service: {
      version: '1.5.0',
      required: true,
      title: {
        en: 'Terms of Service',
        es: 'Términos de Servicio',
        fr: 'Conditions d\'Utilisation',
        de: 'Nutzungsbedingungen',
        hi: 'सेवा की शर्तें',
      },
      url: {
        en: '/terms-of-service',
        es: '/es/terms-of-service',
        fr: '/fr/terms-of-service',
        de: '/de/terms-of-service',
        hi: '/hi/terms-of-service',
      },
    },
    location_tracking: {
      version: '1.2.0',
      required: false,
      title: {
        en: 'Location Tracking',
        es: 'Seguimiento de Ubicación',
        fr: 'Suivi de Localisation',
        de: 'Standortverfolgung',
        hi: 'लोकेशन ट्रैकिंग',
      },
      description: {
        en: 'Allow us to track your location for safety purposes',
        es: 'Permítanos rastrear su ubicación con fines de seguridad',
        fr: 'Autorisez-nous à suivre votre position à des fins de sécurité',
        de: 'Erlauben Sie uns, Ihren Standort zu Sicherheitszwecken zu verfolgen',
        hi: 'सुरक्षा उद्देश्यों के लिए हमें आपके स्थान को ट्रैक करने की अनुमति दें',
      },
    },
    data_processing: {
      version: '1.3.0',
      required: true,
      title: {
        en: 'Data Processing',
        es: 'Procesamiento de Datos',
        fr: 'Traitement des Données',
        de: 'Datenverarbeitung',
        hi: 'डेटा प्रोसेसिंग',
      },
      description: {
        en: 'Allow us to process your personal data for service provision',
        es: 'Permítanos procesar sus datos personales para la prestación de servicios',
        fr: 'Autorisez-nous à traiter vos données personnelles pour la fourniture de services',
        de: 'Erlauben Sie uns, Ihre persönlichen Daten für die Dienstleistungserbringung zu verarbeiten',
        hi: 'सेवा प्रावधान के लिए हमें आपके व्यक्तिगत डेटा को संसाधित करने की अनुमति दें',
      },
    },
  };

  res.status(200).json({
    success: true,
    data: {
      requirements,
    },
  });
});

// Helper function to update user settings based on consent
const updateUserSettings = async (userId: string, type: string, accepted: boolean): Promise<void> => {
  try {
    const User = require('../user/user.model').default;

    let update: any = {};

    switch (type) {
      case 'location_tracking':
        update = { 'settings.locationTracking': accepted };
        break;
      case 'data_processing':
        // This might affect multiple settings
        update = {
          'settings.dataProcessing': accepted,
          'settings.analytics': accepted
        };
        break;
      default:
        // No specific settings to update for other consent types
        return;
    }

    await User.findByIdAndUpdate(userId, update);
    logger.info(`Updated user settings for ${type} consent: ${accepted}`);
  } catch (error) {
    logger.error('Error updating user settings based on consent:', error);
  }
};