import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './appError';

// Configure storage
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, process.env.UPLOAD_PATH || './uploads');
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow images, audio, and video files
    if (file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new AppError('Unsupported file type. Only images, audio, and video files are allowed.', 400) as any, false);
    }
};

// Configure multer
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
    }
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => {
    return upload.single(fieldName);
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
    return upload.array(fieldName, maxCount);
};