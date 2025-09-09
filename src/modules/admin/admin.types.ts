export interface AdminRegisterRequest {
    adminCode: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department: string;
    badgeNumber: string;
}

export interface AdminLoginRequest {
    email: string;
    password: string;
}

export interface AdminResponse {
    token: string;
    admin: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        department: string;
        role: string;
    };
}

export interface DashboardStats {
    totalTourists: number;
    activeTourists: number;
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    averageSafetyScore: number;
}

export interface HeatmapRequest {
    startDate?: Date;
    endDate?: Date;
    type: 'density' | 'risk' | 'alerts';
}

export interface AuditLog {
    adminId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent: string;
}