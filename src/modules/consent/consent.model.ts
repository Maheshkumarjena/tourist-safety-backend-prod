import mongoose, { Schema, Document } from 'mongoose';

export interface IConsent extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'tracking' | 'notifications' | 'data_collection' | 'emergency_contacts';
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  purpose: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

const consentSchema = new Schema<IConsent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['tracking', 'notifications', 'data_collection', 'emergency_contacts'],
    required: true
  },
  granted: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: Date,
  purpose: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
consentSchema.index({ userId: 1, type: 1, timestamp: -1 });
consentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

export const Consent = mongoose.model<IConsent>('Consent', consentSchema);