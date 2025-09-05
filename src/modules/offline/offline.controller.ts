import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import Location from '../location/location.model';
import Alert from '../alerts/alerts.model';
import { logger } from '@/config/logger';

/**
 * @desc    Sync offline data
 * @route   POST /api/v1/offline/sync
 * @access  Private
 */
export const syncOfflineData = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { locations, alerts } = req.body;

  let syncedLocations = [];
  let syncedAlerts = [];

  // Sync locations
  if (locations && Array.isArray(locations)) {
    const locationPromises = locations.map((locationData: any) => {
      return Location.create({
        userId: req.user._id,
        ...locationData,
        timestamp: new Date(locationData.timestamp || Date.now()),
      });
    });

    syncedLocations = await Promise.all(locationPromises);
  }

  // Sync alerts
  if (alerts && Array.isArray(alerts)) {
    const alertPromises = alerts.map((alertData: any) => {
      return Alert.create({
        userId: req.user._id,
        ...alertData,
        timestamp: new Date(alertData.timestamp || Date.now()),
      });
    });

    syncedAlerts = await Promise.all(alertPromises);
  }

  res.status(200).json({
    success: true,
    message: 'Offline data synced successfully',
    data: {
      locations: {
        count: syncedLocations.length,
        items: syncedLocations,
      },
      alerts: {
        count: syncedAlerts.length,
        items: syncedAlerts,
      },
    },
  });
});

/**
 * @desc    Get offline sync status
 * @route   GET /api/v1/offline/status
 * @access  Private
 */
export const getSyncStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  // Get the latest sync timestamp
  const latestLocation = await Location.findOne(
    { userId: req.user._id },
    {},
    { sort: { timestamp: -1 } }
  );

  const latestAlert = await Alert.findOne(
    { userId: req.user._id },
    {},
    { sort: { timestamp: -1 } }
  );

  res.status(200).json({
    success: true,
    data: {
      lastSync: {
        locations: latestLocation?.timestamp || null,
        alerts: latestAlert?.timestamp || null,
      },
      pendingItems: {
        // This would normally come from local storage tracking
        locations: 0,
        alerts: 0,
      },
    },
  });
});

/**
 * @desc    Get offline configuration
 * @route   GET /api/v1/offline/config
 * @access  Private
 */
export const getOfflineConfig = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const config = {
    syncInterval: 300000, // 5 minutes in milliseconds
    maxOfflineDuration: 86400000, // 24 hours in milliseconds
    maxLocationsToStore: 1000,
    maxAlertsToStore: 100,
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    compression: true,
    encryption: true,
  };

  res.status(200).json({
    success: true,
    data: {
      config,
    },
  });
});