import { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '@/middleware/error.middleware';
import { AuthRequest } from '@/middleware/auth.middleware';
import { AppError } from '@/middleware/error.middleware';
import { config } from '@/config/env';
import { logger } from '@/config/logger';

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.appSettings.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed`, 400));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: config.appSettings.maxFileSize,
  },
  fileFilter,
});

/**
 * @desc    Upload media file
 * @route   POST /api/v1/media/upload
 * @access  Private
 */
export const uploadMedia = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const file = req.file;
  const fileType = getFileType(file.mimetype);
  const fileName = `${uuidv4()}-${Date.now()}.${getFileExtension(file.originalname)}`;

  // For MVP, we'll store files locally
  // In production, this would upload to AWS S3 or similar service
  const fileUrl = await saveFileLocally(file, fileName);

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      file: {
        type: fileType,
        url: fileUrl,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      },
    },
  });
});

/**
 * @desc    Upload multiple media files
 * @route   POST /api/v1/media/upload-multiple
 * @access  Private
 */
export const uploadMultipleMedia = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const uploadResults = await Promise.all(
    (req.files as Express.Multer.File[]).map(async (file) => {
      const fileType = getFileType(file.mimetype);
      const fileName = `${uuidv4()}-${Date.now()}.${getFileExtension(file.originalname)}`;
      const fileUrl = await saveFileLocally(file, fileName);

      return {
        type: fileType,
        url: fileUrl,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Files uploaded successfully',
    data: {
      files: uploadResults,
    },
  });
});

// Helper functions
const getFileType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
};

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || 'bin';
};

const saveFileLocally = async (file: Express.Multer.File, filename: string): Promise<string> => {
  // For MVP, save files to local storage
  // In production, integrate with AWS S3, Google Cloud Storage, etc.

  const fs = require('fs').promises;
  const path = require('path');

  const uploadDir = path.join(process.cwd(), 'uploads');

  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, file.buffer);

  return `/uploads/${filename}`;
};

// For production S3 integration (commented out for MVP)
/*
const uploadToS3 = async (file: Express.Multer.File, filename: string): Promise<string> => {
  const AWS = require('aws-sdk');
  
  const s3 = new AWS.S3({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    region: config.awsRegion,
  });
  
  const params = {
    Bucket: config.s3BucketName,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
};
*/