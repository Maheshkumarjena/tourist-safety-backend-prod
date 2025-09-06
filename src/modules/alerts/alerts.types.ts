export interface Alert {
  userId: string;
  type: 'panic' | 'geo-fence' | 'safety' | 'advisory';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'cancelled';
  mediaUrls?: string[];
  respondedBy?: string;
  responseNotes?: string;
  resolvedAt?: Date;
}

export interface SafetyScore {
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  lastUpdated: Date;
}

export interface PanicAlertRequest {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  message?: string;
  mediaUrls?: string[];
}