import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import Location from '../location/location.model';
import Alert from '../alerts/alerts.model';
import User from '../user/user.model';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * @desc    Get safety score
 * @route   GET /api/v1/dashboard/safety-score
 * @access  Private
 */
export const getSafetyScore = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const safetyScore = await calculateSafetyScore(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      safetyScore,
      maxScore: config.safetyScore.maxSafetyScore,
      lastUpdated: new Date(),
    },
  });
});

/**
 * @desc    Get alerts summary
 * @route   GET /api/v1/dashboard/alerts-summary
 * @access  Private
 */
export const getAlertsSummary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const alertsSummary = await Alert.aggregate([
    {
      $match: {
        userId: req.user._id,
        timestamp: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastAlert: { $max: '$timestamp' },
      },
    },
  ]);

  const totalAlerts = alertsSummary.reduce((sum, item) => sum + item.count, 0);
  const activeAlerts = await Alert.countDocuments({
    userId: req.user._id,
    status: 'active',
  });

  res.status(200).json({
    success: true,
    data: {
      summary: alertsSummary,
      totals: {
        all: totalAlerts,
        active: activeAlerts,
        last30Days: totalAlerts,
      },
      timeRange: {
        start: thirtyDaysAgo,
        end: new Date(),
      },
    },
  });
});

/**
 * @desc    Get dashboard overview
 * @route   GET /api/v1/dashboard/overview
 * @access  Private
 */
export const getDashboardOverview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const [safetyScore, alertsSummary, recentLocations, userStats] = await Promise.all([
    calculateSafetyScore(req.user._id),
    getAlertsSummaryData(req.user._id),
    getRecentLocations(req.user._id),
    getUserStats(req.user._id),
  ]);

  res.status(200).json({
    success: true,
    data: {
      safetyScore,
      alertsSummary,
      recentLocations,
      userStats,
      lastUpdated: new Date(),
    },
  });
});

/**
 * @desc    Get travel history
 * @route   GET /api/v1/dashboard/travel-history
 * @access  Private
 */
export const getTravelHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { days = 7 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string));

  const travelHistory = await Location.aggregate([
    {
      $match: {
        userId: req.user._id,
        timestamp: { $gte: startDate },
        locationType: 'ping',
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        },
        locations: { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' },
        maxSpeed: { $max: '$speed' },
        firstLocation: { $first: '$coordinates' },
        lastLocation: { $last: '$coordinates' },
      },
    },
    {
      $sort: { '_id.date': -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      travelHistory,
      timeRange: {
        start: startDate,
        end: new Date(),
        days: parseInt(days as string),
      },
    },
  });
});

// Helper functions
const calculateSafetyScore = async (userId: string): Promise<number> => {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const [recentAlerts, recentLocations] = await Promise.all([
      Alert.countDocuments({
        userId,
        timestamp: { $gte: twentyFourHoursAgo },
        severity: { $in: ['high', 'critical'] },
      }),
      Location.find({
        userId,
        timestamp: { $gte: twentyFourHoursAgo },
      }).sort({ timestamp: -1 }).limit(100),
    ]);

    let score = config.safetyScore.maxSafetyScore;

    // Deduct points for recent alerts
    score -= recentAlerts * 15;

    // Deduct points for night travel in risky areas
    const nightTravelPenalty = await calculateNightTravelPenalty(recentLocations);
    score -= nightTravelPenalty;

    // Deduct points for inactivity
    const inactivityPenalty = await calculateInactivityPenalty(recentLocations);
    score -= inactivityPenalty;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(score, config.safetyScore.maxSafetyScore));

    return Math.round(score);
  } catch (error) {
    logger.error('Error calculating safety score:', error);
    return config.safetyScore.maxSafetyScore; // Return max score on error
  }
};

const calculateNightTravelPenalty = async (locations: any[]): Promise<number> => {
  let penalty = 0;

  for (const location of locations) {
    const hour = new Date(location.timestamp).getHours();
    const isNight = hour < 6 || hour > 20;

    if (isNight) {
      const riskLevel = await assessLocationRisk(
        location.coordinates.latitude,
        location.coordinates.longitude
      );

      if (riskLevel === 'high') {
        penalty += 8;
      } else if (riskLevel === 'medium') {
        penalty += 5;
      }
    }
  }

  return penalty;
};

const calculateInactivityPenalty = async (locations: any[]): Promise<number> => {
  if (locations.length < 2) return 0;

  // Sort locations by timestamp
  locations.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let penalty = 0;
  let lastActiveTime = new Date(locations[0].timestamp).getTime();

  for (let i = 1; i < locations.length; i++) {
    const currentTime = new Date(locations[i].timestamp).getTime();
    const inactivityDuration = (currentTime - lastActiveTime) / (1000 * 60); // in minutes

    if (inactivityDuration > config.safetyScore.inactivityThresholdMinutes) {
      const riskLevel = await assessLocationRisk(
        locations[i].coordinates.latitude,
        locations[i].coordinates.longitude
      );

      if (riskLevel === 'high') {
        penalty += 10;
      } else if (riskLevel === 'medium') {
        penalty += 6;
      } else {
        penalty += 3;
      }
    }

    lastActiveTime = currentTime;
  }

  return penalty;
};

const assessLocationRisk = async (latitude: number, longitude: number): Promise<string> => {
  // Simplified risk assessment (same as in location controller)
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 20;

  const riskyAreas = [
    { lat: 28.6139, lng: 77.2090, radius: 5000 },
    { lat: 19.0760, lng: 72.8777, radius: 3000 },
  ];

  let inRiskyArea = false;
  for (const area of riskyAreas) {
    const distance = calculateDistance(latitude, longitude, area.lat, area.lng);
    if (distance <= area.radius) {
      inRiskyArea = true;
      break;
    }
  }

  if (isNight && inRiskyArea) {
    return 'high';
  } else if (isNight || inRiskyArea) {
    return 'medium';
  } else {
    return 'low';
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // Haversine formula implementation
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getAlertsSummaryData = async (userId: string): Promise<any> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return Alert.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastAlert: { $max: '$timestamp' },
      },
    },
  ]);
};

const getRecentLocations = async (userId: string): Promise<any[]> => {
  return Location.find(
    { userId },
    { coordinates: 1, timestamp: 1, locationType: 1 }
  )
    .sort({ timestamp: -1 })
    .limit(10);
};

const getUserStats = async (userId: string): Promise<any> => {
  const user = await User.findById(userId).select('itinerary emergencyContacts kycStatus');

  return {
    itineraryItems: user?.itinerary?.length || 0,
    emergencyContacts: user?.emergencyContacts?.length || 0,
    kycStatus: user?.kycStatus || 'pending',
    profileComplete: !!(user?.itinerary?.length && user?.emergencyContacts?.length),
  };
};