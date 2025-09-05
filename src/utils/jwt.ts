import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

export interface TokenPayload {
    id: string;
    iat?: number;
    exp?: number;
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpire,
    });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtRefreshExpire,
    });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
        logger.error('Token verification failed:', error);
        throw new Error('Invalid or expired token');
    }
};

/**
 * Decode JWT token without verification
 */
export const decodeToken = (token: string): TokenPayload | null => {
    try {
        return jwt.decode(token) as TokenPayload;
    } catch (error) {
        logger.error('Token decoding failed:', error);
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        return Date.now() >= decoded.exp * 1000;
    } catch (error) {
        return true;
    }
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
    try {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return null;

        return new Date(decoded.exp * 1000);
    } catch (error) {
        return null;
    }
};