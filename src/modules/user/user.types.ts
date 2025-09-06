import { Document } from 'mongoose';

export interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface TripItinerary {
  destination: string;
  startDate: Date;
  endDate: Date;
  accommodation: string;
  activities: string[];
}

export interface KYCDetails {
  documentType: 'aadhaar' | 'passport' | 'driver-license';
  documentNumber: string;
  documentImage?: string;
  verified: boolean;
}

export interface UserSettings {
  trackingEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  emergencyAlertContacts: boolean;
}

export interface IUserProfile extends Document {
  userId: string;
  kycDetails?: KYCDetails;
  tripItineraries: TripItinerary[];
  emergencyContacts: EmergencyContact[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Request types
export interface UpdateProfileRequest {
  kycDetails?: KYCDetails;
  tripItineraries?: TripItinerary[];
}

export interface UpdateEmergencyContactsRequest {
  contacts: EmergencyContact[];
}

export interface UpdateSettingsRequest {
  settings: Partial<UserSettings>;
}