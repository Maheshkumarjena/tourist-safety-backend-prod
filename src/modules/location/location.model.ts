import mongoose, { Schema, Document } from 'mongoose';

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ILocationRecord extends Document {
  userId: mongoose.Types.ObjectId;
  coordinates: Point;
  timestamp: Date;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  createdAt: Date;
}

export interface IZone extends Document {
  name: string;
  type: 'safe' | 'risky' | 'restricted';
  coordinates: Point[];
  riskLevel: 'low' | 'medium' | 'high';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Location Record Schema
const locationRecordSchema = new Schema<ILocationRecord>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  accuracy: Number,
  altitude: Number,
  speed: Number
}, {
  timestamps: true
});

// Create geospatial index for efficient location queries
locationRecordSchema.index({ coordinates: '2dsphere' });
locationRecordSchema.index({ userId: 1, timestamp: -1 });

// Zone Schema
const zoneSchema = new Schema<IZone>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['safe', 'risky', 'restricted'],
    required: true
  },
  coordinates: [{
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  description: String
}, {
  timestamps: true
});

// Create geospatial index for zones
zoneSchema.index({ coordinates: '2dsphere' });

export const LocationRecord = mongoose.model<ILocationRecord>('LocationRecord', locationRecordSchema);
export const Zone = mongoose.model<IZone>('Zone', zoneSchema);