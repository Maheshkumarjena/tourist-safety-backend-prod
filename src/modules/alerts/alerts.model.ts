import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAlert extends Document {
  userId: Types.ObjectId;
  type: 'sos' | 'geofence' | 'inactivity' | 'manual' | 'system';
  status: 'active' | 'resolved' | 'cancelled' | 'false_alarm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number;
  timestamp: Date;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  media: Array<{
    type: 'image' | 'video' | 'audio';
    url: string;
    thumbnail?: string;
    duration?: number;
  }>;
  message?: string;
  additionalData?: {
    batteryLevel?: number;
    networkType?: string;
    nearbyWifi?: string[];
    audioRecording?: string;
  };
  responders: Array<{
    userId: Types.ObjectId;
    role: 'police' | 'ambulance' | 'security' | 'admin' | 'volunteer';
    acknowledged: boolean;
    acknowledgedAt?: Date;
    responseTime?: number;
  }>;
  notes?: string;
}

const alertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['sos', 'geofence', 'inactivity', 'manual', 'system'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'cancelled', 'false_alarm'],
      default: 'active',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    accuracy: {
      type: Number,
      min: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    media: [
      {
        type: {
          type: String,
          enum: ['image', 'video', 'audio'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
        },
        duration: {
          type: Number,
          min: 0,
        },
      },
    ],
    message: {
      type: String,
      maxlength: 500,
    },
    additionalData: {
      batteryLevel: {
        type: Number,
        min: 0,
        max: 100,
      },
      networkType: {
        type: String,
        enum: ['wifi', 'cellular', 'none', 'unknown'],
      },
      nearbyWifi: [String],
      audioRecording: String,
    },
    responders: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['police', 'ambulance', 'security', 'admin', 'volunteer'],
          required: true,
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
        acknowledgedAt: {
          type: Date,
        },
        responseTime: {
          type: Number,
          min: 0,
        },
      },
    ],
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
alertSchema.index({ userId: 1, status: 1 });
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ coordinates: '2dsphere' });
alertSchema.index({ timestamp: -1 });

export default mongoose.model<IAlert>('Alert', alertSchema);