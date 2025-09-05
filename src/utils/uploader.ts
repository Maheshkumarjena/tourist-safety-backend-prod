import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/env';
import { AppError } from '@/middleware/error.middleware';
import { logger } from '@/config/logger';

// Supported file types
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime'];
export const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
export const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Get all supported types
export const ALL_SUPPORTED_TYPES = [
    ...SUPPORTED_IMAGE_TYPES,
    ...SUPPORTED_VIDEO_TYPES,
    ...SUPPORTED_AUDIO_TYPES,
    ...SUPPORTED_DOCUMENT_TYPES,
];

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

/**
 * File filter function
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        // Check if file type is supported
        if (ALL_SUPPORTED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError(`File type ${file.mimetype} is not supported`, 400));
        }
    } catch (error) {
        cb(new AppError('File filter error', 500));
    }
};

/**
 * Create multer instance
 */
export const upload = multer({
    storage,
    limits: {
        fileSize: config.appSettings.maxFileSize,
        files: 5, // Maximum number of files
    },
    fileFilter,
});

/**
 * Get file type from mimetype
 */
export const getFileType = (mimetype: string): string => {
    if (SUPPORTED_IMAGE_TYPES.includes(mimetype)) return 'image';
    if (SUPPORTED_VIDEO_TYPES.includes(mimetype)) return 'video';
    if (SUPPORTED_AUDIO_TYPES.includes(mimetype)) return 'audio';
    if (SUPPORTED_DOCUMENT_TYPES.includes(mimetype)) return 'document';
    return 'other';
};

/**
 * Validate file size
 */
export const validateFileSize = (file: Express.Multer.File): boolean => {
    return file.size <= config.appSettings.maxFileSize;
};

/**
 * Generate file URL
 */
export const generateFileUrl = (filename: string): string => {
    return `${config.serverUrl}/uploads/${filename}`;
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
    return path.extname(filename).toLowerCase().substring(1);
};

/**
 * Check if file is an image
 */
export const isImage = (mimetype: string): boolean => {
    return SUPPORTED_IMAGE_TYPES.includes(mimetype);
};

/**
 * Check if file is a video
 */
export const isVideo = (mimetype: string): boolean => {
    return SUPPORTED_VIDEO_TYPES.includes(mimetype);
};

/**
 * Check if file is an audio
 */
export const isAudio = (mimetype: string): boolean => {
    return SUPPORTED_AUDIO_TYPES.includes(mimetype);
};

/**
 * Check if file is a document
 */
export const isDocument = (mimetype: string): boolean => {
    return SUPPORTED_DOCUMENT_TYPES.includes(mimetype);
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

/**
 * Get file information
 */
export const getFileInfo = (file: Express.Multer.File) => {
    return {
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        type: getFileType(file.mimetype),
        extension: getFileExtension(file.originalname),
        url: generateFileUrl(file.filename),
    };
};

/**
 * Handle file upload error
 */
export const handleUploadError = (error: any): never => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                throw new AppError('File too large', 400);
            case 'LIMIT_FILE_COUNT':
                throw new AppError('Too many files', 400);
            case 'LIMIT_UNEXPECTED_FILE':
                throw new AppError('Unexpected file field', 400);
            default:
                throw new AppError('File upload error', 500);
        }
    }
    throw error;
};

// AWS S3 configuration (for production)
export const configureS3 = () => {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
        logger.warn('AWS credentials not configured. Using local storage.');
        return null;
    }

    const AWS = require('aws-sdk');

    return new AWS.S3({
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
        region: config.awsRegion,
    });
};

/**
 * Upload file to S3
 */
export const uploadToS3 = async (file: Express.Multer.File, folder: string = 'uploads'): Promise<string> => {
    const s3 = configureS3();

    if (!s3) {
        // Fallback to local storage
        return generateFileUrl(file.filename);
    }

    const params = {
        Bucket: config.s3BucketName,
        Key: `${folder}/${file.filename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    try {
        const result = await s3.upload(params).promise();
        return result.Location;
    } catch (error) {
        logger.error('S3 upload failed:', error);
        // Fallback to local storage
        return generateFileUrl(file.filename);
    }
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (filename: string, folder: string = 'uploads'): Promise<void> => {
    const s3 = configureS3();

    if (!s3) {
        // Local storage - file will be deleted automatically
        return;
    }

    const params = {
        Bucket: config.s3BucketName,
        Key: `${folder}/${filename}`,
    };

    try {
        await s3.deleteObject(params).promise();
    } catch (error) {
        logger.error('S3 delete failed:', error);
    }
};