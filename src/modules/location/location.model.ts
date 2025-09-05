import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILocation extends Document {
  userId: Types.ObjectId;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  batteryLevel?: number;
  isMoving?: boolean;
  activityType?: string;
  geofenceId?: string;
  locationType: 'ping' | 'sos' | 'checkpoint';
  metadata?: {
    wifiSSID?: string;
    cellTowerId?: string;
    ipAddress?: string;
    countryCode?: string;
  };
}

const locationSchema = new Schema<ILocation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    altitude: {
      type: Number,
    },
    speed: {
      type: Number,
      min: 0,
    },
    heading: {
      type: Number,
      min: 0,
      max: 360,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    isMoving: {
      type: Boolean,
      default: false,
    },
    activityType: {
      type: String,
      enum: ['stationary', 'walking', 'running', 'cycling', 'driving', 'unknown'],
      default: 'unknown',
    },
    geofenceId: {
      type: String,
    },
    locationType: {
      type: String,
      enum: ['ping', 'sos', 'checkpoint'],
      default: 'ping',
    },
    metadata: {
      wifiSSID: String,
      cellTowerId: String,
      ipAddress: String,
      countryCode: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location queries
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ userId: 1, timestamp: -1 });
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

export default mongoose.model<ILocation>('Location', locationSchema);