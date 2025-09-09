import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
    adminCode: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department: string;
    badgeNumber: string;
    role: 'admin' | 'super_admin' | 'authority';
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAuditLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}

const adminSchema = new Schema<IAdmin>({
    adminCode: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true
    },
    badgeNumber: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['admin', 'super_admin', 'authority'],
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date
}, {
    timestamps: true
});

const auditLogSchema = new Schema<IAuditLog>({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    resource: {
        type: String,
        required: true
    },
    resourceId: String,
    details: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ adminCode: 1 });
adminSchema.index({ badgeNumber: 1 });
adminSchema.index({ department: 1 });

auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: 1 });

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);