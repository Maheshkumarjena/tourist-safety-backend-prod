export interface ConsentRecord {
  userId: string;
  type: 'tracking' | 'notifications' | 'data_collection' | 'emergency_contacts';
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  purpose: string;
  version: string;
}