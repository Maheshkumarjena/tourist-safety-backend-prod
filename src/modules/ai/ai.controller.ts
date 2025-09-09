import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AIService } from './ai.service';
import { SafetyScoreRequest, AnomalyDetectionRequest, PredictiveAlertRequest, BehaviorAnalysisRequest } from './ai.types';
import { validate } from '../../middleware/validate.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

// Validation schemas
const safetyScoreSchema = Joi.object({
    userId: Joi.string().required(),
    locationData: Joi.array().items(
        Joi.object({
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            timestamp: Joi.date().required(),
            accuracy: Joi.number().optional()
        })
    ).min(1).required(),
    historicalAlerts: Joi.array().optional(),
    timeOfDay: Joi.string().required(),
    dayOfWeek: Joi.string().required()
});

const anomalyDetectionSchema = Joi.object({
    userId: Joi.string().required(),
    currentLocation: Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        timestamp: Joi.date().required()
    }).required(),
    recentLocations: Joi.array().items(
        Joi.object({
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            timestamp: Joi.date().required()
        })
    ).min(5).required(),
    movementPattern: Joi.object({
        averageSpeed: Joi.number().required(),
        direction: Joi.number().required(),
        stability: Joi.number().required()
    }).required()
});

const predictiveAlertSchema = Joi.object({
    location: Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required()
    }).required(),
    timeOfDay: Joi.string().required(),
    dayOfWeek: Joi.string().required(),
    historicalData: Joi.array().items(
        Joi.object({
            alertCount: Joi.number().required(),
            riskLevel: Joi.string().required(),
            timestamp: Joi.date().required()
        })
    ).optional()
});

const behaviorAnalysisSchema = Joi.object({
    userId: Joi.string().required(),
    locations: Joi.array().required(),
    alerts: Joi.array().required(),
    interactions: Joi.array().required(),
    timeFrame: Joi.object({
        start: Joi.date().required(),
        end: Joi.date().required()
    }).required()
});

export class AIController {
    // Calculate safety score
    static calculateSafetyScore = [
        validate(safetyScoreSchema),
        async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
            try {
                const safetyRequest: SafetyScoreRequest = req.body;
                const result = await AIService.calculateSafetyScore(safetyRequest);

                res.status(200).json({
                    status: 'success',
                    data: result
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    // Detect anomalies
    static detectAnomalies = [
        validate(anomalyDetectionSchema),
        async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
            try {
                const anomalyRequest: AnomalyDetectionRequest = req.body;
                const result = await AIService.detectAnomalies(anomalyRequest);

                res.status(200).json({
                    status: 'success',
                    data: result
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    // Generate predictive alerts
    static generatePredictiveAlerts = [
        validate(predictiveAlertSchema),
        async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
            try {
                const predictiveRequest: PredictiveAlertRequest = req.body;
                const result = await AIService.generatePredictiveAlerts(predictiveRequest);

                res.status(200).json({
                    status: 'success',
                    data: result
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    // Analyze behavior
    static analyzeBehavior = [
        validate(behaviorAnalysisSchema),
        async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
            try {
                const behaviorRequest: BehaviorAnalysisRequest = req.body;
                const result = await AIService.analyzeBehavior(behaviorRequest);

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