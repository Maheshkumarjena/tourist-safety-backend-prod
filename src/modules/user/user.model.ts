import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmergencyContact {
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
  email?: string;
}

export interface IKycDocument {
  type: 'passport' | 'aadhaar' | 'driving_license' | 'voter_id' | 'other';
  frontImage: string;
  backImage?: string;
  number?: string;
  expiryDate?: Date;
  verified: boolean;
  verifiedAt?: Date;
  rejectedReason?: string;
}

export interface IItineraryItem {
  destination: string;
  startDate: Date;
  endDate: Date;
  accommodation: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface IUserSettings {
  language: string;
  notifications: boolean;
  locationTracking: boolean;
  offlineMode: boolean;
  emergencyAlertSound: boolean;
  vibration: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface IUser extends Document {
  email: string;
  password: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  profileImage?: string;
  emergencyContacts: IEmergencyContact[];
  settings: IUserSettings;
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments: IKycDocument[];
  itinerary: IItineraryItem[];
  isBlocked: boolean;
  lastLogin: Date;
  fcmToken?: string;
  deviceInfo?: {
    os: string;
    model: string;
    appVersion: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IUser, value: Date) {
          return value < new Date();
        },
        message: 'Date of birth must be in the past',
      },
    },
    nationality: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    emergencyContacts: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        phoneNumber: {
          type: String,
          required: true,
          match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
        },
        relationship: {
          type: String,
          required: true,
          enum: ['family', 'friend', 'colleague', 'other'],
        },
        email: {
          type: String,
          lowercase: true,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    settings: {
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de', 'hi'],
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      locationTracking: {
        type: Boolean,
        default: true,
      },
      offlineMode: {
        type: Boolean,
        default: false,
      },
      emergencyAlertSound: {
        type: Boolean,
        default: true,
      },
      vibration: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    kycDocuments: [
      {
        type: {
          type: String,
          enum: ['passport', 'aadhaar', 'driving_license', 'voter_id', 'other'],
          required: true,
        },
        frontImage: {
          type: String,
          required: true,
        },
        backImage: {
          type: String,
        },
        number: {
          type: String,
        },
        expiryDate: {
          type: Date,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        verifiedAt: {
          type: Date,
        },
        rejectedReason: {
          type: String,
        },
      },
    ],
    itinerary: [
      {
        destination: {
          type: String,
          required: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        accommodation: {
          type: String,
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
        notes: {
          type: String,
          maxlength: 500,
        },
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    fcmToken: {
      type: String,
    },
    deviceInfo: {
      os: {
        type: String,
        enum: ['android', 'ios', 'web'],
      },
      model: {
        type: String,
      },
      appVersion: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ 'itinerary.coordinates': '2dsphere' });
userSchema.index({ kycStatus: 1 });
userSchema.index({ isBlocked: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);