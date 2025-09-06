import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'panic' | 'geo-fence' | 'safety' | 'advisory';
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'cancelled';
  mediaUrls: string[];
  respondedBy?: mongoose.Types.ObjectId;
  responseNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISafetyScore extends Document {
  userId: mongoose.Types.ObjectId;
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Alert Schema
const alertSchema = new Schema<IAlert>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['panic', 'geo-fence', 'safety', 'advisory'],
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active'
  },
  mediaUrls: [String],
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  responseNotes: String,
  resolvedAt: Date
}, {
  timestamps: true
});

// Create geospatial index for alerts
alertSchema.index({ coordinates: '2dsphere' });
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ status: 1, createdAt: -1 });

// Safety Score Schema
const safetyScoreSchema = new Schema<ISafetyScore>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  factors: [String],
  lastUpdated: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

safetyScoreSchema.index({ userId: 1 });

export const Alert = mongoose.model<IAlert>('Alert', alertSchema);
export const SafetyScore = mongoose.model<ISafetyScore>('SafetyScore', safetyScoreSchema);