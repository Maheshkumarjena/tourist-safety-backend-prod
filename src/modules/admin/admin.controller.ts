import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AdminService } from './admin.service';
import { AdminRegisterRequest, AdminLoginRequest, HeatmapRequest } from './admin.types';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

// Validation schemas
const adminRegisterSchema = Joi.object({
    adminCode: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    department: Joi.string().required(),
    badgeNumber: Joi.string().required()
});

const adminLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const heatmapQuerySchema = Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional().greater(Joi.ref('startDate')),
    type: Joi.string().valid('density', 'risk', 'alerts').required()
});

const paginationQuerySchema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    search: Joi.string().optional()
});

export class AdminController {
    // Register admin
    static register = [
        validate(adminRegisterSchema),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const adminData: AdminRegisterRequest = req.body;
                const result = await AdminService.registerAdmin(adminData, req);

                res.status(201).json({
                    status: 'success',
                    data: result
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    // Login admin
    static login = [
        validate(adminLoginSchema),
        async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const loginData: AdminLoginRequest = req.body;
                const result = await AdminService.loginAdmin(loginData, req);

                res.status(200).json({
                    status: 'success',
                    data: result
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    // Get dashboard stats
    static getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const stats = await AdminService.getDashboardStats();

            res.status(200).json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    };

    // Get heatmap data
    static getHeatmapData = [
        validateQuery(heatmapQuerySchema),
        async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
            try {
                const heatmapRequest: HeatmapRequest = req.query as any;
                const data = await AdminService.getHeatmapData(heatmapRequest);

                res.status(200).json({
                    status: 'success',
                    data
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    // Get tourists list
    static getTourists = [
        validateQuery(paginationQuerySchema),
        async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
            try {
                const { page, limit, search } = req.query;
                const result = await AdminService.getTourists(
                    parseInt(page as string),
                    parseInt(limit as string),
                    search as string
                );

                res.status(200).json({
                    status: 'success',
                    data: result
                });
            } catch (error) {
                next(error);
            }
        }
    ];

    // Get audit logs
    static getAuditLogs = [
        validateQuery(paginationQuerySchema),
        async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
            try {
                const { page, limit, adminId, action } = req.query;
                const result = await AdminService.getAuditLogs(
                    parseInt(page as string),
                    parseInt(limit as string),
                    adminId as string,
                    action as string
                );

                res.status(200).json({
                    status: 'success',
                    data: result
                });
            } catch (error) {
                next(error);
            }
        }
    ];
}