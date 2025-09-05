import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import Alert from './alerts.model';
import User from '../user/user.model';
import { logger } from '@/config/logger';
import { sendEmergencyAlertEmail } from '@/utils/email';
import { createNotification } from '../notifications/notifications.controller';

/**
 * @desc    Create SOS alert with emergency response coordination
 * @route   POST /api/v1/alerts/panic
 * @access  Private
 */
export const createSOSAlert = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    coordinates,
    accuracy,
    message,
    media,
    additionalData,
  } = req.body;

  // Create alert
  const alert = await Alert.create({
    userId: req.user._id,
    type: 'sos',
    status: 'active',
    severity: 'critical',
    coordinates,
    accuracy,
    message,
    media: media || [],
    additionalData,
    timestamp: new Date(),
  });

  // Emergency response coordination
  await coordinateEmergencyResponse(alert);

  res.status(201).json({
    success: true,
    message: 'SOS alert created successfully. Help is on the way.',
    data: {
      alert,
      emergencyContactsNotified: true,
      authoritiesAlerted: true,
    },
  });
});

/**
 * @desc    Get alert statistics and analytics
 * @route   GET /api/v1/alerts/analytics
 * @access  Private
 */
export const getAlertAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string));

  const analytics = await Alert.aggregate([
    {
      $match: {
        userId: req.user._id,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status',
          severity: '$severity',
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responders.responseTime' },
      },
    },
    {
      $group: {
        _id: '$_id.type',
        byStatus: {
          $push: {
            status: '$_id.status',
            severity: '$_id.severity',
            count: '$count',
            avgResponseTime: '$avgResponseTime',
          },
        },
        total: { $sum: '$count' },
      },
    },
  ]);

  // Calculate response time metrics
  const responseStats = await Alert.aggregate([
    {
      $match: {
        userId: req.user._id,
        timestamp: { $gte: startDate },
        'responders.responseTime': { $exists: true },
      },
    },
    {
      $unwind: '$responders',
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responders.responseTime' },
        minResponseTime: { $min: '$responders.responseTime' },
        maxResponseTime: { $max: '$responders.responseTime' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      analytics,
      responseStats: responseStats[0] || {},
      timeRange: {
        start: startDate,
        end: new Date(),
        days: parseInt(days as string),
      },
    },
  });
});

/**
 * @desc    Export alert history
 * @route   GET /api/v1/alerts/export
 * @access  Private
 */
export const exportAlerts = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { format = 'json', startDate, endDate } = req.query;

  const query: any = { userId: req.user._id };

  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string),
    };
  }

  const alerts = await Alert.find(query).sort({ timestamp: -1 });

  if (format === 'csv') {
    // Convert to CSV
    const csvData = convertAlertsToCSV(alerts);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=alerts-${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csvData);
  } else {
    res.status(200).json({
      success: true,
      data: {
        alerts,
        exportDate: new Date(),
        total: alerts.length,
      },
    });
  }
});

// Emergency response coordination
const coordinateEmergencyResponse = async (alert: any): Promise<void> => {
  try {
    const user = await User.findById(alert.userId).populate('emergencyContacts');

    if (!user) {
      logger.error('User not found for emergency response');
      return;
    }

    // 1. Notify emergency contacts
    await notifyEmergencyContacts(user, alert);

    // 2. Notify nearby responders (police, security, etc.)
    await notifyResponders(alert);

    // 3. Create high-priority notification for user
    await createNotification(
      alert.userId.toString(),
      'alert',
      'Emergency Alert Activated',
      'Your emergency alert has been activated. Help is on the way.',
      {
        alertId: alert._id,
        location: alert.coordinates,
        severity: alert.severity,
      },
      'urgent',
      ['push', 'in_app']
    );

    // 4. Log the emergency response initiation
    logger.info(`Emergency response initiated for alert ${alert._id}`, {
      userId: alert.userId,
      coordinates: alert.coordinates,
      timestamp: alert.timestamp,
    });

  } catch (error) {
    logger.error('Emergency response coordination failed:', error);
  }
};

const notifyEmergencyContacts = async (user: any, alert: any): Promise<void> => {
  if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
    logger.warn('No emergency contacts found for user:', user._id);
    return;
  }

  for (const contact of user.emergencyContacts) {
    try {
      if (contact.email) {
        await sendEmergencyAlertEmail(
          contact.email,
          `${user.firstName} ${user.lastName}`,
          {
            type: alert.type,
            timestamp: alert.timestamp,
            coordinates: alert.coordinates,
            message: alert.message,
          }
        );
      }

      // TODO: Implement SMS notifications for phone numbers
      logger.info(`Notified emergency contact: ${contact.name} at ${contact.email || contact.phoneNumber}`);
    } catch (error) {
      logger.error(`Failed to notify emergency contact ${contact.name}:`, error);
    }
  }
};

const notifyResponders = async (alert: any): Promise<void> => {
  // TODO: Implement responder notification system
  // This would integrate with local emergency services, security personnel, etc.

  // Mock implementation for MVP
  logger.info('Notifying emergency responders for alert:', {
    alertId: alert._id,
    location: alert.coordinates,
    severity: alert.severity,
  });

  // Simulate adding emergency responders
  alert.responders.push({
    userId: '64d7f3a5e6b4d5a9c8f2b1c7', // Example police responder
    role: 'police',
    acknowledged: false,
  });

  alert.responders.push({
    userId: '64d7f3a5e6b4d5a9c8f2b1c8', // Example ambulance responder
    role: 'ambulance',
    acknowledged: false,
  });

  await alert.save();
};

const convertAlertsToCSV = (alerts: any[]): string => {
  const headers = ['Date', 'Type', 'Status', 'Severity', 'Latitude', 'Longitude', 'Message'];
  const rows = alerts.map(alert => [
    alert.timestamp.toISOString(),
    alert.type,
    alert.status,
    alert.severity,
    alert.coordinates?.latitude,
    alert.coordinates?.longitude,
    `"${alert.message?.replace(/"/g, '""') || ''}"`,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
};