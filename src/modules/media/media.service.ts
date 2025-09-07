import fs from 'fs';
import path from 'path';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';

export class MediaService {
  // Upload file to local storage
  static async uploadFile(file: Express.Multer.File, userId: string, alertId?: string): Promise<{
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    url: string;
  }> {
    try {
      // Ensure upload directory exists
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      const filename = `media-${userId}-${uniqueSuffix}${fileExtension}`;
      const filePath = path.join(uploadDir, filename);

      // Check if the source file exists before moving it
      if (!fs.existsSync(file.path)) {
        throw new AppError('Uploaded file not found', 400);
      }

      // Move file to upload directory using copy + delete instead of rename
      // This is more reliable across different filesystems
      const readStream = fs.createReadStream(file.path);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        readStream.pipe(writeStream);
        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
      });

      // Delete the temporary file created by multer
      fs.unlinkSync(file.path);

      // Construct URL for accessing the file
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/v1/media/${filename}`;

      return {
        originalName: file.originalname,
        filename,
        path: filePath,
        size: file.size,
        mimetype: file.mimetype,
        url
      };
    } catch (error) {
      logger.error('File upload error:', error);

      // Clean up temporary file if it exists
      if (file?.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          logger.warn('Could not clean up temporary file:', unlinkError);
        }
      }

      throw new AppError('Failed to upload file', 500);
    }
  }

  // Get file by filename
  static async getFile(filename: string): Promise<{
    path: string;
    mimetype: string;
    size: number;
  }> {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404);
    }

    const stats = fs.statSync(filePath);
    const mimetype = this.getMimeType(filename);

    return {
      path: filePath,
      mimetype,
      size: stats.size
    };
  }

  // Delete file by filename
  static async deleteFile(filename: string): Promise<void> {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Helper to determine MIME type from filename
  private static getMimeType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();

    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}