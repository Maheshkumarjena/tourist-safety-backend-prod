import { config } from '@/config/env';
import { logger } from '@/config/logger';

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

export interface Geofence {
    id: string;
    name: string;
    coordinates: Coordinate[];
    radius?: number;
    type: 'polygon' | 'circle';
    riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Check if coordinate is within bounding box
 */
export const isInBoundingBox = (coord: Coordinate, bbox: BoundingBox): boolean => {
    return (
        coord.latitude >= bbox.minLat &&
        coord.latitude <= bbox.maxLat &&
        coord.longitude >= bbox.minLng &&
        coord.longitude <= bbox.maxLng
    );
};

/**
 * Check if coordinate is within polygon using ray casting algorithm
 */
export const isInPolygon = (coord: Coordinate, polygon: Coordinate[]): boolean => {
    let inside = false;
    const x = coord.longitude;
    const y = coord.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude;
        const yi = polygon[i].latitude;
        const xj = polygon[j].longitude;
        const yj = polygon[j].latitude;

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
};

/**
 * Check if coordinate is within circle
 */
export const isInCircle = (coord: Coordinate, center: Coordinate, radius: number): boolean => {
    return calculateDistance(coord, center) <= radius;
};

/**
 * Get bounding box for coordinates
 */
export const getBoundingBox = (coordinates: Coordinate[]): BoundingBox => {
    if (coordinates.length === 0) {
        throw new Error('Coordinates array cannot be empty');
    }

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    for (const coord of coordinates) {
        minLat = Math.min(minLat, coord.latitude);
        maxLat = Math.max(maxLat, coord.latitude);
        minLng = Math.min(minLng, coord.longitude);
        maxLng = Math.max(maxLng, coord.longitude);
    }

    return { minLat, maxLat, minLng, maxLng };
};

/**
 * Calculate center point of coordinates
 */
export const getCenterPoint = (coordinates: Coordinate[]): Coordinate => {
    if (coordinates.length === 0) {
        throw new Error('Coordinates array cannot be empty');
    }

    let sumLat = 0;
    let sumLng = 0;

    for (const coord of coordinates) {
        sumLat += coord.latitude;
        sumLng += coord.longitude;
    }

    return {
        latitude: sumLat / coordinates.length,
        longitude: sumLng / coordinates.length,
    };
};

/**
 * Check if coordinate is in risky area
 */
export const isInRiskyArea = (coord: Coordinate): { isRisky: boolean; riskLevel: string; areaId?: string } => {
    // Mock risky areas - in production, this would come from a database
    const riskyAreas: Geofence[] = [
        {
            id: 'area-1',
            name: 'High Risk Zone - Downtown',
            coordinates: [
                { latitude: 28.6139, longitude: 77.2090 },
                { latitude: 28.6239, longitude: 77.2190 },
                { latitude: 28.6039, longitude: 77.2290 },
            ],
            type: 'polygon',
            riskLevel: 'high',
        },
        {
            id: 'area-2',
            name: 'Medium Risk Zone - Market Area',
            coordinates: [{ latitude: 19.0760, longitude: 72.8777 }],
            radius: 3000,
            type: 'circle',
            riskLevel: 'medium',
        },
    ];

    for (const area of riskyAreas) {
        if (area.type === 'circle' && area.radius) {
            if (isInCircle(coord, area.coordinates[0], area.radius)) {
                return { isRisky: true, riskLevel: area.riskLevel, areaId: area.id };
            }
        } else if (area.type === 'polygon') {
            if (isInPolygon(coord, area.coordinates)) {
                return { isRisky: true, riskLevel: area.riskLevel, areaId: area.id };
            }
        }
    }

    return { isRisky: false, riskLevel: 'low' };
};

/**
 * Calculate safety score based on location and time
 */
export const calculateSafetyScore = (
    coord: Coordinate,
    timestamp: Date = new Date()
): { score: number; factors: string[] } => {
    const hour = timestamp.getHours();
    const isNight = hour < 6 || hour > 20;
    const { isRisky, riskLevel } = isInRiskyArea(coord);

    let score = config.safetyScore.maxSafetyScore;
    const factors: string[] = [];

    // Night time penalty
    if (isNight) {
        score -= 15;
        factors.push('night_time');
    }

    // Risky area penalty
    if (isRisky) {
        if (riskLevel === 'high') {
            score -= 25;
            factors.push('high_risk_area');
        } else if (riskLevel === 'medium') {
            score -= 15;
            factors.push('medium_risk_area');
        }
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(score, config.safetyScore.maxSafetyScore));

    return { score, factors };
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (coord: Coordinate, precision: number = 6): string => {
    return `${coord.latitude.toFixed(precision)}, ${coord.longitude.toFixed(precision)}`;
};

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees: number): number => {
    return degrees * Math.PI / 180;
};

/**
 * Convert radians to degrees
 */
export const toDegrees = (radians: number): number => {
    return radians * 180 / Math.PI;
};