import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './appError';

// Configure storage
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        const uploadDir = process.env.UPLOAD_PATH || './uploads';

        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
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

// Middleware for single file upload with form data
export const uploadSingleWithFields = () => {
    return upload.single('media');
};

// Middleware for multiple file upload with form data  
export const uploadMultipleWithFields = (maxCount: number = 5) => {
    return upload.array('media', maxCount);
};