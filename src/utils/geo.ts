import { Point } from '../modules/location/location.types';

// Haversine formula to calculate distance between two points
export const calculateDistance = (point1: Point, point2: Point): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = deg2rad(point2.latitude - point1.latitude);
    const dLon = deg2rad(point2.longitude - point1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(point1.latitude)) * Math.cos(deg2rad(point2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

// Check if a point is inside a polygon
export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

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

// Generate random point within a radius of a center point
export const generateRandomPoint = (center: Point, radiusInKm: number): Point => {
    const radiusInDegrees = radiusInKm / 111.32; // Approx 111.32 km per degree

    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;

    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    // Adjust the x-coordinate for the shrinking of the east-west distances
    const new_x = x / Math.cos(center.latitude * Math.PI / 180);

    return {
        latitude: center.latitude + y,
        longitude: center.longitude + new_x
    };
};