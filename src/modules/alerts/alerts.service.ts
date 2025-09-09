import { Alert, SafetyScore, IAlert, ISafetyScore } from './alerts.model';
import { PanicAlertRequest, SafetyScore as SafetyScoreType } from './alerts.types';
import { UserProfile } from '../user/user.model';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';
import { AIService } from '../ai/ai.service';


export class AlertService {
  // Create a panic alert
  static async createPanicAlert(userId: string, alertData: PanicAlertRequest): Promise<IAlert> {
    const alert = new Alert({
      userId,
      type: 'panic',
      coordinates: {
        type: 'Point',
        coordinates: [alertData.coordinates.longitude, alertData.coordinates.latitude]
      },
      message: alertData.message || 'Emergency panic alert triggered',
      severity: 'critical',
      status: 'active',
      mediaUrls: alertData.mediaUrls || []
    });

    await alert.save();

    // Get user's emergency contacts
    const userProfile = await UserProfile.findOne({ userId });
    if (userProfile && userProfile.emergencyContacts.length > 0) {
      // Mock notification to emergency contacts
      logger.info(`Notifying emergency contacts for user ${userId} about panic alert`);
      userProfile.emergencyContacts.forEach(contact => {
        logger.info(`Notified ${contact.name} at ${contact.phone} about emergency`);
      });
    }

    // Mock notification to authorities
    logger.info(`Notifying authorities about panic alert from user ${userId}`);

    try {
      const aiAnalysis = await AIService.generatePredictiveAlerts({
        location: alertData.coordinates,
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: this.getDayOfWeek(),
        historicalData: [] // Would fetch real historical data in production
      });

      // Store AI insights with the alert
      alert.set('aiInsights', aiAnalysis);
      await alert.save();

      logger.info(`AI analysis for alert ${alert._id}: ${aiAnalysis.message}`);
    } catch (error) {
      logger.error('AI analysis failed:', error);
    }


    return alert;
  }

  // Get alert summary for a user
  static async getAlertSummary(userId: string): Promise<{
    total: number;
    active: number;
    resolved: number;
    recent: IAlert[];
  }> {
    const [total, active, resolved, recent] = await Promise.all([
      Alert.countDocuments({ userId }),
      Alert.countDocuments({ userId, status: 'active' }),
      Alert.countDocuments({ userId, status: 'resolved' }),
      Alert.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('respondedBy', 'firstName lastName')
    ]);

    return {
      total,
      active,
      resolved,
      recent
    };
  }

  // Get alert history for a user
  static async getAlertHistory(userId: string, limit: number = 20, page: number = 1): Promise<{
    alerts: IAlert[];
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('respondedBy', 'firstName lastName'),
      Alert.countDocuments({ userId })
    ]);

    return {
      alerts,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  // Get or generate safety score (mock implementation)
  static async getSafetyScore(userId: string): Promise<SafetyScoreType> {
    // Try to get existing safety score
    let safetyScore = await SafetyScore.findOne({ userId });

    if (!safetyScore) {
      // Generate mock safety score (random between 60-100)
      const score = Math.floor(Math.random() * 41) + 60;
      const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

      const factors = [
        'location_history',
        'time_of_day',
        'previous_alerts',
        'local_crime_data'
      ];

      safetyScore = new SafetyScore({
        userId,
        score,
        riskLevel,
        factors,
        lastUpdated: new Date()
      });

      await safetyScore.save();
    }

    // Update score occasionally (mock)
    if (Math.random() < 0.3) { // 30% chance to update
      const scoreChange = Math.floor(Math.random() * 21) - 10; // -10 to +10
      safetyScore.score = Math.max(0, Math.min(100, safetyScore.score + scoreChange));

      if (safetyScore.score >= 80) {
        safetyScore.riskLevel = 'low';
      } else if (safetyScore.score >= 60) {
        safetyScore.riskLevel = 'medium';
      } else {
        safetyScore.riskLevel = 'high';
      }

      safetyScore.lastUpdated = new Date();
      await safetyScore.save();
    }

    return {
      score: safetyScore.score,
      riskLevel: safetyScore.riskLevel,
      factors: safetyScore.factors,
      lastUpdated: safetyScore.lastUpdated
    };
  }



  private static getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private static getDayOfWeek(): string {
    const day = new Date().getDay();
    return day >= 1 && day <= 5 ? 'weekday' : 'weekend';
  }
}