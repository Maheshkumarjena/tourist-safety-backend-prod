import { LocationRecord, Zone, ILocationRecord, IZone } from './location.model';
import { Point, ZoneCheckResult } from './location.types';
import { AppError } from '../../utils/appError';
import { isPointInPolygon } from '../../utils/geo';
import { logger } from '../../config/logger';

export class LocationService {
  // Record user location
  static async recordLocation(userId: string, coordinates: Point, additionalData: any = {}): Promise<ILocationRecord> {
    const locationRecord = new LocationRecord({
      userId,
      coordinates: {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude]
      },
      ...additionalData
    });

    await locationRecord.save();

    // Check if location is in any zone
    const zoneCheck = await this.checkZone(coordinates);
    if (zoneCheck.inZone && zoneCheck.zoneType !== 'safe') {
      logger.warn(`User ${userId} entered ${zoneCheck.zoneType} zone: ${zoneCheck.zoneName}`);
      // In a real implementation, this would trigger notifications
    }

    return locationRecord;
  }

  // Get location history for a user
  static async getLocationHistory(userId: string, startDate?: Date, endDate?: Date): Promise<ILocationRecord[]> {
    const query: any = { userId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return await LocationRecord.find(query)
      .sort({ timestamp: -1 })
      .limit(100); // Limit to 100 most recent records
  }

  // Check if coordinates are in any predefined zone
  static async checkZone(coordinates: Point): Promise<ZoneCheckResult> {
    const zones = await Zone.find();

    for (const zone of zones) {
      // Convert zone coordinates to points array
      const zonePoints = zone.coordinates.map(coord => ({
        latitude: coord.coordinates[1],
        longitude: coord.coordinates[0]
      }));

      if (isPointInPolygon(coordinates, zonePoints)) {
        return {
          inZone: true,
          zoneType: zone.type,
          riskLevel: zone.riskLevel,
          zoneName: zone.name,
          description: zone.description
        };
      }
    }

    return { inZone: false };
  }

  // Get all zones
  static async getAllZones(): Promise<IZone[]> {
    return await Zone.find();
  }

  // Create a new zone
  static async createZone(zoneData: Partial<IZone>): Promise<IZone> {
    const zone = new Zone(zoneData);
    return await zone.save();
  }
}