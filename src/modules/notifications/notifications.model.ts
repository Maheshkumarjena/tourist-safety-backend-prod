import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'alert' | 'safety' | 'system' | 'info' | 'warning';
  title: string;
  message: string;
  data?: {
    alertId?: Types.ObjectId;
    location?: {
      latitude: number;
      longitude: number;
    };
    actionUrl?: string;
    [key: string]: any;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  readAt?: Date;
  sentAt: Date;
  expiresAt?: Date;
  channels: Array<'push' | 'email' | 'sms' | 'in_app'>;
  metadata?: {
    fcmMessageId?: string;
    smsId?: string;
    emailId?: string;
    retryCount?: number;
  };
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['alert', 'safety', 'system', 'info', 'warning'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    channels: [{
      type: String,
      enum: ['push', 'email', 'sms', 'in_app'],
    }],
    metadata: {
      fcmMessageId: String,
      smsId: String,
      emailId: String,
      retryCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, sentAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model<INotification>('Notification', notificationSchema);