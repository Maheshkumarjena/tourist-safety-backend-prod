import { SafetyScoreRequest, AnomalyDetectionRequest, PredictiveAlertRequest, BehaviorAnalysisRequest } from './ai.types';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';
import { Zone } from '../location/location.model';
import { Alert } from '../alerts/alerts.model';

export class AIService {
    // Calculate safety score (mock implementation - would integrate with real AI in production)
    static async calculateSafetyScore(request: SafetyScoreRequest): Promise<{
        score: number;
        riskLevel: 'low' | 'medium' | 'high';
        factors: string[];
        recommendations: string[];
    }> {
        try {
            // Mock AI calculation - in production, this would call a Python ML model
            let baseScore = 85; // Base score
            const factors: string[] = [];
            const recommendations: string[] = [];

            // Check if in restricted zone
            const inRestrictedZone = await this.checkRestrictedZone(request.locationData[0]);
            if (inRestrictedZone) {
                baseScore -= 25;
                factors.push('in_restricted_zone');
                recommendations.push('Move to a safer area immediately');
            }

            // Check time of day (night time is riskier)
            if (request.timeOfDay === 'night') {
                baseScore -= 15;
                factors.push('night_time');
                recommendations.push('Avoid traveling alone at night');
            }

            // Check historical alerts
            if (request.historicalAlerts.length > 0) {
                baseScore -= (request.historicalAlerts.length * 5);
                factors.push('previous_alerts');
                recommendations.push('Be extra cautious in this area');
            }

            // Ensure score is within bounds
            const finalScore = Math.max(0, Math.min(100, baseScore));

            // Determine risk level
            let riskLevel: 'low' | 'medium' | 'high' = 'low';
            if (finalScore < 60) riskLevel = 'high';
            else if (finalScore < 80) riskLevel = 'medium';

            return {
                score: finalScore,
                riskLevel,
                factors,
                recommendations
            };
        } catch (error) {
            logger.error('AI safety score calculation error:', error);
            // Fallback to simple calculation
            return {
                score: 75,
                riskLevel: 'medium',
                factors: ['fallback_calculation'],
                recommendations: ['Stay alert and aware of your surroundings']
            };
        }
    }

    // Detect anomalies in user behavior
    static async detectAnomalies(request: AnomalyDetectionRequest): Promise<{
        hasAnomaly: boolean;
        anomalyType?: 'sudden_stop' | 'rapid_movement' | 'unusual_location' | 'pattern_deviation';
        confidence: number;
        message?: string;
    }> {
        // Mock anomaly detection
        const { currentLocation, recentLocations, movementPattern } = request;

        // Check for sudden stop
        if (movementPattern.averageSpeed > 5 && movementPattern.averageSpeed < 1) {
            return {
                hasAnomaly: true,
                anomalyType: 'sudden_stop',
                confidence: 0.75,
                message: 'Sudden stop detected - check if user needs assistance'
            };
        }

        // Check for rapid movement
        if (movementPattern.averageSpeed > 20) { // 20 m/s ~ 72 km/h
            return {
                hasAnomaly: true,
                anomalyType: 'rapid_movement',
                confidence: 0.85,
                message: 'Rapid movement detected - possible vehicle incident'
            };
        }

        // Check for unusual location (would integrate with historical patterns in production)
        const inUnusualLocation = await this.checkUnusualLocation(currentLocation, recentLocations);
        if (inUnusualLocation) {
            return {
                hasAnomaly: true,
                anomalyType: 'unusual_location',
                confidence: 0.65,
                message: 'User in unusual location based on historical patterns'
            };
        }

        return {
            hasAnomaly: false,
            confidence: 0.95
        };
    }

    // Generate predictive alerts
    static async generatePredictiveAlerts(request: PredictiveAlertRequest): Promise<{
        alertLevel: 'low' | 'medium' | 'high';
        message: string;
        predictedRisk: number;
        suggestedActions: string[];
    }> {
        // Mock predictive analytics
        const { location, timeOfDay, dayOfWeek, historicalData } = request;

        // Check if in high-risk zone
        const zoneRisk = await this.getZoneRiskLevel(location);
        let baseRisk = zoneRisk === 'high' ? 70 : zoneRisk === 'medium' ? 50 : 30;

        // Adjust for time factors
        if (timeOfDay === 'night') baseRisk += 20;
        if (dayOfWeek === 'weekend') baseRisk += 10;

        // Adjust based on historical data
        const recentAlerts = historicalData.filter(d =>
            new Date().getTime() - new Date(d.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
        );

        if (recentAlerts.length > 0) {
            baseRisk += (recentAlerts.length * 5);
        }

        // Determine alert level
        let alertLevel: 'low' | 'medium' | 'high' = 'low';
        let message = 'Area appears safe';
        let suggestedActions: string[] = ['Stay alert'];

        if (baseRisk >= 70) {
            alertLevel = 'high';
            message = 'High risk area - exercise extreme caution';
            suggestedActions = ['Avoid area if possible', 'Travel in groups', 'Share live location with trusted contacts'];
        } else if (baseRisk >= 50) {
            alertLevel = 'medium';
            message = 'Moderate risk area - be cautious';
            suggestedActions = ['Stay in well-lit areas', 'Keep emergency contacts handy'];
        }

        return {
            alertLevel,
            message,
            predictedRisk: baseRisk,
            suggestedActions
        };
    }

    // Analyze user behavior patterns
    static async analyzeBehavior(request: BehaviorAnalysisRequest): Promise<{
        behaviorPattern: 'normal' | 'suspicious' | 'concerning';
        patternDetails: any;
        confidence: number;
        recommendations: string[];
    }> {
        // Mock behavior analysis
        const { locations, alerts, timeFrame } = request;

        // Simple analysis based on alerts and location patterns
        const alertCount = alerts.length;
        const locationChanges = locations.length;

        // Calculate movement patterns
        const uniqueLocations = new Set(locations.map(l => `${l.latitude.toFixed(4)},${l.longitude.toFixed(4)}`)).size;

        if (alertCount > 3 || uniqueLocations > 50) {
            return {
                behaviorPattern: 'concerning',
                patternDetails: {
                    alertCount,
                    uniqueLocations,
                    movementIntensity: 'high'
                },
                confidence: 0.7,
                recommendations: [
                    'Consider checking on user welfare',
                    'Monitor for further unusual activity',
                    'Review recent location history for patterns'
                ]
            };
        } else if (alertCount > 1 || uniqueLocations > 20) {
            return {
                behaviorPattern: 'suspicious',
                patternDetails: {
                    alertCount,
                    uniqueLocations,
                    movementIntensity: 'moderate'
                },
                confidence: 0.6,
                recommendations: [
                    'Continue monitoring user activity',
                    'Note any pattern changes'
                ]
            };
        }

        return {
            behaviorPattern: 'normal',
            patternDetails: {
                alertCount,
                uniqueLocations,
                movementIntensity: 'low'
            },
            confidence: 0.9,
            recommendations: ['No concerning patterns detected']
        };
    }

    // Helper methods
    private static async checkRestrictedZone(location: { latitude: number; longitude: number }): Promise<boolean> {
        const zones = await Zone.find({ type: 'restricted' });
        return zones.some(zone => {
            // Simple distance check - in production, use proper geospatial query
            const zoneCenter = {
                latitude: zone.coordinates[0].coordinates[1],
                longitude: zone.coordinates[0].coordinates[0]
            };
            const distance = this.calculateDistance(location, zoneCenter);
            return distance < 5000; // Within 5km of restricted zone
        });
    }

    private static async checkUnusualLocation(
        currentLocation: { latitude: number; longitude: number },
        recentLocations: { latitude: number; longitude: number; timestamp: Date }[]
    ): Promise<boolean> {
        if (recentLocations.length < 10) return false;

        // Calculate average location from recent history
        const avgLat = recentLocations.reduce((sum, loc) => sum + loc.latitude, 0) / recentLocations.length;
        const avgLng = recentLocations.reduce((sum, loc) => sum + loc.longitude, 0) / recentLocations.length;

        const distance = this.calculateDistance(currentLocation, { latitude: avgLat, longitude: avgLng });
        return distance > 10000; // More than 10km from usual area
    }

    private static async getZoneRiskLevel(location: { latitude: number; longitude: number }): Promise<'low' | 'medium' | 'high'> {
        const zones = await Zone.find();
        for (const zone of zones) {
            const zoneCenter = {
                latitude: zone.coordinates[0].coordinates[1],
                longitude: zone.coordinates[0].coordinates[0]
            };
            const distance = this.calculateDistance(location, zoneCenter);
            if (distance < 2000) { // Within 2km of zone
                return zone.riskLevel;
            }
        }
        return 'low';
    }

    private static calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(point2.latitude - point1.latitude);
        const dLng = this.deg2rad(point2.longitude - point1.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(point1.latitude)) * Math.cos(this.deg2rad(point2.latitude)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Distance in meters
    }

    private static deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}