export interface Point {
  latitude: number;
  longitude: number;
}

export interface LocationRecord {
  userId: string;
  coordinates: Point;
  timestamp: Date;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

export interface Zone {
  name: string;
  type: 'safe' | 'risky' | 'restricted';
  coordinates: Point[];
  riskLevel: 'low' | 'medium' | 'high';
  description?: string;
}

export interface ZoneCheckResult {
  inZone: boolean;
  zoneType?: 'safe' | 'risky' | 'restricted';
  riskLevel?: 'low' | 'medium' | 'high';
  zoneName?: string;
  description?: string;
}