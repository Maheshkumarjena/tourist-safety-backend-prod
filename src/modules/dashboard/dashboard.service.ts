import Location from '../location/location.model';
import Alert from '../alerts/alerts.model';
import User from '../user/user.model';
import { AppError } from '@/middleware/error.middleware';
import { logger } from '@/config/logger';
import { calculateDistance } from '@/utils/geo';

export const getSafetyScoreService = async (userId: string): Promise<number> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch recent alerts
    const recentAlerts = await Alert.countDocuments({
      userId,
      timestamp: { $gte: sevenDaysAgo },
      type: 'sos',
      status: 'active',
    });

    // Fetch recent locations
    const recentLocations = await Location.find({
      userId,
      timestamp: { $gte: sevenDaysAgo },
    }).select('coordinates riskLevel');

    // Base score
    let safetyScore = 100;

    // Deduct points for active SOS alerts (10 points each)
    safetyScore -= recentAlerts * 10;

    // Deduct points based on high-risk locations
    const highRiskLocations = recentLocations.filter(loc => loc.riskLevel === 'high').length;
    safetyScore -= highRiskLocations * 5;

    // Ensure score stays within 0-100
    return Math.max(0, Math.min(100, safetyScore));
  } catch (error) {
    logger.error(`Error calculating safety score for user ${userId}: ${error.message}`);
    throw new AppError('Failed to calculate safety score', 500);
  }
};

export const getAlertsSummaryService = async (userId: string): Promise<{
  total: number;
  active: number;
  resolved: number;
  recent: Array<any>;
}> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate alert counts
    const [total, active, resolved, recent] = await Promise.all([
      Alert.countDocuments({ userId }),
      Alert.countDocuments({ userId, status: 'active' }),
      Alert.countDocuments({ userId, status: 'resolved' }),
      Alert.find({ userId, timestamp: { $gte: thirtyDaysAgo } })
        .select('type status coordinates timestamp message')
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      total,
      active,
      resolved,
      recent,
    };
  } catch (error) {
    logger.error(`Error fetching alerts summary for user ${userId}: ${error.message}`);
    throw new AppError('Failed to fetch alerts summary', 500);
  }
};

export const getDashboardOverviewService = async (userId: string): Promise<{
  safetyScore: number;
  alerts: { total: number; active: number; resolved: number; recent: Array<any> };
  recentLocations: Array<any>;
  userInfo: { firstName: string; lastName: string; kycStatus: string };
}> => {
  try {
    const [safetyScore, alertsSummary, recentLocations, user] = await Promise.all([
      getSafetyScoreService(userId),
      getAlertsSummaryService(userId),
      Location.find({ userId })
        .select('coordinates timestamp riskLevel')
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
      User.findById(userId)
        .select('firstName lastName kycStatus')
        .lean(),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      safetyScore,
      alerts: alertsSummary,
      recentLocations,
      userInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        kycStatus: user.kycStatus,
      },
    };
  } catch (error) {
    logger.error(`Error fetching dashboard overview for user ${userId}: ${error.message}`);
    throw error instanceof AppError ? error : new AppError('Failed to fetch dashboard overview', 500);
  }
};

export const getTravelHistoryService = async (userId: string, days: number): Promise<Array<any>> => {
  try {
    if (days <= 0 || days > 365) {
      throw new AppError('Days must be between 1 and 365', 400);
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch locations and itinerary
    const [locations, user] = await Promise.all([
      Location.find({
        userId,
        timestamp: { $gte: startDate },
      })
        .select('coordinates timestamp activityType')
        .sort({ timestamp: -1 })
        .lean(),
      User.findById(userId)
        .select('itinerary')
        .lean(),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Combine locations with itinerary data
    const travelHistory = locations.map(location => {
      const matchingItinerary = user.itinerary?.find(item => {
        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);
        const locTime = new Date(location.timestamp);
        return locTime >= itemStart && locTime <= itemEnd;
      });

      return {
        ...location,
        destination: matchingItinerary?.destination || 'Unknown',
        accommodation: matchingItinerary?.accommodation || null,
      };
    });

    return travelHistory;
  } catch (error:any) {
    logger.error(`Error fetching travel history for user ${userId}: ${error.message}`);
    throw error instanceof AppError ? error : new AppError('Failed to fetch travel history', 500);
  }
};