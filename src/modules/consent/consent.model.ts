import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConsent extends Document {
  userId: Types.ObjectId;
  type: 'privacy_policy' | 'terms_of_service' | 'location_tracking' | 'data_processing';
  version: string;
  accepted: boolean;
  acceptedAt: Date;
  ipAddress: string;
  userAgent: string;
  language: string;
  metadata?: {
    deviceId?: string;
    appVersion?: string;
    location?: string;
  };
}

const consentSchema = new Schema<IConsent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['privacy_policy', 'terms_of_service', 'location_tracking', 'data_processing'],
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
    accepted: {
      type: Boolean,
      required: true,
    },
    acceptedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      default: 'en',
    },
    metadata: {
      deviceId: String,
      appVersion: String,
      location: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
consentSchema.index({ userId: 1, type: 1 });
consentSchema.index({ userId: 1, acceptedAt: -1 });
consentSchema.index({ type: 1, version: 1 });

export default mongoose.model<IConsent>('Consent', consentSchema);