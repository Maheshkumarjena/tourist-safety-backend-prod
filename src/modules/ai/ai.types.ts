export interface SafetyScoreRequest {
    userId: string;
    locationData: {
        latitude: number;
        longitude: number;
        timestamp: Date;
        accuracy?: number;
    }[];
    historicalAlerts: any[];
    timeOfDay: string;
    dayOfWeek: string;
}

export interface AnomalyDetectionRequest {
    userId: string;
    currentLocation: {
        latitude: number;
        longitude: number;
        timestamp: Date;
    };
    recentLocations: {
        latitude: number;
        longitude: number;
        timestamp: Date;
    }[];
    movementPattern: {
        averageSpeed: number;
        direction: number;
        stability: number;
    };
}

export interface PredictiveAlertRequest {
    location: {
        latitude: number;
        longitude: number;
    };
    timeOfDay: string;
    dayOfWeek: string;
    historicalData: {
        alertCount: number;
        riskLevel: string;
        timestamp: Date;
    }[];
}

export interface BehaviorAnalysisRequest {
    userId: string;
    locations: any[];
    alerts: any[];
    interactions: any[];
    timeFrame: {
        start: Date;
        end: Date;
    };
}