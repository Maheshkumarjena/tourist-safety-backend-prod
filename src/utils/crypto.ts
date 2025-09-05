import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(12);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        logger.error('Password hashing failed:', error);
        throw new Error('Password hashing failed');
    }
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        logger.error('Password comparison failed:', error);
        return false;
    }
};

/**
 * Generate random token
 */
export const generateRandomToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate secure random OTP
 */
export const generateOTP = (length: number = 6): string => {
    const digits = '0123456789';
    let OTP = '';

    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    return OTP;
};

/**
 * Hash data using SHA256
 */
export const hashData = (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Encrypt data using AES
 */
export const encryptData = (data: string, key: string = config.jwtSecret): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(hashData(key).substring(0, 32)), iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt data using AES
 */
export const decryptData = (encryptedData: string, key: string = config.jwtSecret): string => {
    try {
        const parts = encryptedData.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(hashData(key).substring(0, 32)), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error('Data decryption failed:', error);
        throw new Error('Decryption failed');
    }
};