import { Admin, AuditLog, IAdmin } from './admin.model';
import { AdminRegisterRequest, AdminLoginRequest, DashboardStats, HeatmapRequest, AuditLog as AuditLogType } from './admin.types';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../utils/appError';
import { User } from '../auth/auth.model';
import { UserProfile } from '../user/user.model';
import { Alert } from '../alerts/alerts.model';
import { LocationRecord } from '../location/location.model';
import { logger } from '../../config/logger';
import { Request } from 'express';

export class AdminService {
    // Register a new admin (secured by admin code)
    static async registerAdmin(adminData: AdminRegisterRequest, req: Request): Promise<{ message: string }> {
        // Check if admin code is valid (in production, this would be a pre-shared secure code)
        const validAdminCodes = process.env.ADMIN_CODES?.split(',') || ['ADMIN123', 'AUTHORITY456'];

        if (!validAdminCodes.includes(adminData.adminCode)) {
            throw new AppError('Invalid admin registration code', 401);
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [
                { email: adminData.email },
                { badgeNumber: adminData.badgeNumber }
            ]
        });

        if (existingAdmin) {
            throw new AppError('Admin with this email or badge number already exists', 400);
        }

        // Create new admin
        const admin = new Admin(adminData);
        await admin.save();

        // Log the admin registration
        await this.createAuditLog(admin._id.toString(), 'register', 'admin', admin._id.toString(), {
            action: 'admin_registration'
        }, req);

        return { message: 'Admin registered successfully' };
    }

    // Login admin
    static async loginAdmin(loginData: AdminLoginRequest, req: Request): Promise<{ token: string; admin: any }> {
        const { email, password } = loginData;

        // Find admin by email
        const admin = await Admin.findOne({ email, isActive: true });
        if (!admin) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate token
        const token = generateToken({ id: admin._id, role: 'admin' });

        // Log the login
        await this.createAuditLog(admin._id.toString(), 'login', 'admin', admin._id.toString(), {
            action: 'admin_login'
        }, req);

        return {
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                department: admin.department,
                role: admin.role
            }
        };
    }

    // Get dashboard statistics
    static async getDashboardStats(): Promise<DashboardStats> {
        const [
            totalTourists,
            activeTourists,
            totalAlerts,
            activeAlerts,
            resolvedAlerts,
            safetyScores
        ] = await Promise.all([
            User.countDocuments({ role: 'tourist' }),
            UserProfile.countDocuments({ 'settings.trackingEnabled': true }),
            Alert.countDocuments(),
            Alert.countDocuments({ status: 'active' }),
            Alert.countDocuments({ status: 'resolved' }),
            User.aggregate([
                { $match: { role: 'tourist' } },
                { $group: { _id: null, avgSafety: { $avg: '$safetyScore' } } }
            ])
        ]);

        const averageSafetyScore = safetyScores[0]?.avgSafety || 0;

        return {
            totalTourists,
            activeTourists,
            totalAlerts,
            activeAlerts,
            resolvedAlerts,
            averageSafetyScore
        };
    }

    // Get heatmap data
    static async getHeatmapData(heatmapRequest: HeatmapRequest): Promise<any[]> {
        const { startDate, endDate, type } = heatmapRequest;

        let aggregationPipeline: any[] = [];

        // Add date filter if provided
        if (startDate || endDate) {
            aggregationPipeline.push({
                $match: {
                    timestamp: {
                        ...(startDate && { $gte: new Date(startDate) }),
                        ...(endDate && { $lte: new Date(endDate) })
                    }
                }
            });
        }

        // Different aggregation based on heatmap type
        switch (type) {
            case 'density':
                aggregationPipeline.push(
                    {
                        $group: {
                            _id: {
                                latitude: { $round: ['$coordinates.coordinates[1]', 2] },
                                longitude: { $round: ['$coordinates.coordinates[0]', 2] }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            latitude: '$_id.latitude',
                            longitude: '$_id.longitude',
                            count: 1,
                            _id: 0
                        }
                    }
                );
                break;

            case 'risk':
                // This would integrate with AI service in production
                aggregationPipeline.push(
                    {
                        $group: {
                            _id: {
                                latitude: { $round: ['$coordinates.coordinates[1]', 2] },
                                longitude: { $round: ['$coordinates.coordinates[0]', 2] }
                            },
                            riskScore: { $avg: '$riskLevel' } // Mock risk calculation
                        }
                    },
                    {
                        $project: {
                            latitude: '$_id.latitude',
                            longitude: '$_id.longitude',
                            riskScore: 1,
                            _id: 0
                        }
                    }
                );
                break;

            case 'alerts':
                aggregationPipeline = [
                    {
                        $lookup: {
                            from: 'alerts',
                            localField: 'userId',
                            foreignField: 'userId',
                            as: 'alerts'
                        }
                    },
                    {
                        $unwind: '$alerts'
                    },
                    {
                        $group: {
                            _id: {
                                latitude: { $round: ['$coordinates.coordinates[1]', 2] },
                                longitude: { $round: ['$coordinates.coordinates[0]', 2] }
                            },
                            alertCount: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            latitude: '$_id.latitude',
                            longitude: '$_id.longitude',
                            alertCount: 1,
                            _id: 0
                        }
                    }
                ];
                break;
        }

        return await LocationRecord.aggregate(aggregationPipeline);
    }

    // Get tourist management list
    static async getTourists(page: number = 1, limit: number = 20, search?: string): Promise<{
        tourists: any[];
        total: number;
        pages: number;
    }> {
        const skip = (page - 1) * limit;

        let query: any = { role: 'tourist' };

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const [tourists, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .populate('profile')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);

        return {
            tourists,
            total,
            pages: Math.ceil(total / limit)
        };
    }

    // Create audit log
    static async createAuditLog(
        adminId: string,
        action: string,
        resource: string,
        resourceId: string,
        details: any,
        req: Request
    ): Promise<void> {
        try {
            const auditLog = new AuditLog({
                adminId,
                action,
                resource,
                resourceId,
                details,
                ipAddress: req.ip || req.connection.remoteAddress || '',
                userAgent: req.get('User-Agent') || ''
            });

            await auditLog.save();
        } catch (error) {
            logger.error('Failed to create audit log:', error);
        }
    }

    // Get audit logs
    static async getAuditLogs(
        page: number = 1,
        limit: number = 50,
        adminId?: string,
        action?: string
    ): Promise<{
        logs: any[];
        total: number;
        pages: number;
    }> {
        const skip = (page - 1) * limit;

        let query: any = {};

        if (adminId) {
            query.adminId = adminId;
        }

        if (action) {
            query.action = action;
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('adminId', 'firstName lastName email')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            AuditLog.countDocuments(query)
        ]);

        return {
            logs,
            total,
            pages: Math.ceil(total / limit)
        };
    }
}