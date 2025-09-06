import mongoose, { Schema, Document } from 'mongoose';

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
  userId: mongoose.Types.ObjectId;
  kycDetails?: KYCDetails;
  tripItineraries: TripItinerary[];
  emergencyContacts: EmergencyContact[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyContactSchema = new Schema<EmergencyContact>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  relationship: { type: String, required: true }
});

const tripItinerarySchema = new Schema<TripItinerary>({
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  accommodation: { type: String, required: true },
  activities: [{ type: String }]
});

const kycDetailsSchema = new Schema<KYCDetails>({
  documentType: {
    type: String,
    enum: ['aadhaar', 'passport', 'driver-license'],
    required: true
  },
  documentNumber: { type: String, required: true },
  documentImage: { type: String },
  verified: { type: Boolean, default: false }
});

const userSettingsSchema = new Schema<UserSettings>({
  trackingEnabled: { type: Boolean, default: true },
  notificationsEnabled: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  emergencyAlertContacts: { type: Boolean, default: true }
});

const userProfileSchema = new Schema<IUserProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  kycDetails: kycDetailsSchema,
  tripItineraries: [tripItinerarySchema],
  emergencyContacts: [emergencyContactSchema],
  settings: {
    type: userSettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Index for better query performance
userProfileSchema.index({ userId: 1 });

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema);

// Digital ID Model (for mock blockchain)
export interface IDigitalID extends Document {
  userId: mongoose.Types.ObjectId;
  idData: string;
  expiryDate: Date;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const digitalIDSchema = new Schema<IDigitalID>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  idData: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  qrCode: { type: String, required: true }
}, {
  timestamps: true
});

digitalIDSchema.index({ userId: 1 });
digitalIDSchema.index({ expiryDate: 1 });

export const DigitalID = mongoose.model<IDigitalID>('DigitalID', digitalIDSchema);