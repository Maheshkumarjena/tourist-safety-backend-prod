import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import Location from './location.model';
import User from '../user/user.model';
import { logger } from '@/config/logger';
import { calculateSafetyScore, isInRiskyArea } from '@/utils/geo';
import { createNotification } from '../notifications/notifications.controller';

/**
 * @desc    Record location ping with real-time safety assessment
 * @route   POST /api/v1/location/ping
 * @access  Private
 */
export const recordLocation = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const locationData = {
    userId: req.user._id,
    ...req.body,
    timestamp: new Date(req.body.timestamp || Date.now()),
  };

  const location = await Location.create(locationData);

  // Real-time safety assessment
  const safetyAssessment = await assessLocationSafety(location);

  // Notify user if in high risk area
  if (safetyAssessment.riskLevel === 'high') {
    await createNotification(
      req.user._id.toString(),
      'safety',
      'High Risk Area Alert',
      `You have entered a high risk area. Please exercise caution.`,
      {
        location: location.coordinates,
        riskLevel: safetyAssessment.riskLevel,
        areaId: safetyAssessment.areaId,
      },
      'high',
      ['push', 'in_app']
    );
  }

  res.status(201).json({
    success: true,
    message: 'Location recorded successfully',
    data: {
      location,
      safety: safetyAssessment,
    },
  });
});

/**
 * @desc    Get location history with safety insights
 * @route   GET /api/v1/location/history
 * @access  Private
 */
export const getLocationHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { startDate, endDate, limit = 100, page = 1, includeSafety = 'true' } = req.query;

  const query: any = { userId: req.user._id };

  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string),
    };
  }

  const options = {
    sort: { timestamp: -1 },
    limit: parseInt(limit as string),
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
  };

  const locations = await Location.find(query, null, options);
  const total = await Location.countDocuments(query);

  // Add safety insights if requested
  let locationsWithSafety = locations;
  if (includeSafety === 'true') {
    locationsWithSafety = await Promise.all(
      locations.map(async (location) => {
        const safety = await assessLocationSafety(location);
        return {
          ...location.toObject(),
          safety,
        };
      })
    );
  }

  res.status(200).json({
    success: true,
    data: {
      locations: locationsWithSafety,
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
 * @desc    Get safety heatmap data
 * @route   GET /api/v1/location/heatmap
 * @access  Private
 */
export const getSafetyHeatmap = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { days = 7, precision = 0.01 } = req.query; // precision in degrees

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string));

  // Aggregate location data into grid cells
  const heatmapData = await Location.aggregate([
    {
      $match: {
        userId: req.user._id,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          lat: { $multiply: [{ $floor: { $divide: ['$coordinates.latitude', parseFloat(precision as string)] } }, parseFloat(precision as string)] },
          lng: { $multiply: [{ $floor: { $divide: ['$coordinates.longitude', parseFloat(precision as string)] } }, parseFloat(precision as string)] },
        },
        count: { $sum: 1 },
        avgRisk: { $avg: { $cond: [{ $eq: ['$locationType', 'sos'] }, 1, 0.5] } }, // Simplified risk calculation
      },
    },
    {
      $project: {
        coordinates: {
          latitude: '$_id.lat',
          longitude: '$_id.lng',
        },
        count: 1,
        riskLevel: {
          $switch: {
            branches: [
              { case: { $gte: ['$avgRisk', 0.8] }, then: 'high' },
              { case: { $gte: ['$avgRisk', 0.5] }, then: 'medium' },
              { case: { $gte: ['$avgRisk', 0.2] }, then: 'low' },
            ],
            default: 'very_low',
          },
        },
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      heatmap: heatmapData,
      timeRange: {
        start: startDate,
        end: new Date(),
        days: parseInt(days as string),
      },
      precision: parseFloat(precision as string),
    },
  });
});

// Helper functions
const assessLocationSafety = async (location: any): Promise<any> => {
  const { isRisky, riskLevel, areaId } = isInRiskyArea(location.coordinates);
  const hour = new Date(location.timestamp).getHours();
  const isNight = hour < 6 || hour > 20;

  let safetyScore = 100;
  let factors: string[] = [];

  // Adjust score based on risk factors
  if (isRisky) {
    if (riskLevel === 'high') {
      safetyScore -= 40;
      factors.push('high_risk_area');
    } else if (riskLevel === 'medium') {
      safetyScore -= 20;
      factors.push('medium_risk_area');
    }
  }

  if (isNight) {
    safetyScore -= 15;
    factors.push('night_time');
  }

  if (location.locationType === 'sos') {
    safetyScore -= 30;
    factors.push('sos_alert');
  }

  // Ensure score is within bounds
  safetyScore = Math.max(0, Math.min(safetyScore, 100));

  return {
    score: Math.round(safetyScore),
    riskLevel: getRiskLevelFromScore(safetyScore),
    factors,
    isRisky,
    areaId,
    timestamp: location.timestamp,
  };
};

const getRiskLevelFromScore = (score: number): string => {
  if (score >= 80) return 'very_low';
  if (score >= 60) return 'low';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'high';
  return 'very_high';
};

// Batch process locations for offline sync
export const processBatchLocations = async (userId: string, locations: any[]): Promise<any[]> => {
  const processedLocations = await Promise.all(
    locations.map(async (locationData) => {
      const location = await Location.create({
        userId,
        ...locationData,
        timestamp: new Date(locationData.timestamp || Date.now()),
      });

      const safety = await assessLocationSafety(location);
      return { location, safety };
    })
  );

  return processedLocations;
};