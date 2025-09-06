import { DigitalID as DigitalIDModel, IDigitalID } from '../user/user.model';
import { DigitalID, IssueIDRequest, VerifyQRRequest } from './qr.types';
import QRCode from 'qrcode';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';

export class QRService {
  // Issue a mock digital ID
  static async issueDigitalID(issueData: IssueIDRequest): Promise<DigitalID> {
    // Check if digital ID already exists for this user
    const existingID = await DigitalIDModel.findOne({ userId: issueData.userId });
    if (existingID) {
      return {
        userId: existingID.userId.toString(),
        idData: existingID.idData,
        expiryDate: existingID.expiryDate,
        qrCode: existingID.qrCode
      };
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(issueData.idData);

    // Create digital ID
    const digitalID = new DigitalIDModel({
      userId: issueData.userId,
      idData: issueData.idData,
      expiryDate: issueData.expiryDate,
      qrCode
    });

    await digitalID.save();

    logger.info(`Mock digital ID issued for user ${issueData.userId}`);

    return {
      userId: digitalID.userId.toString(),
      idData: digitalID.idData,
      expiryDate: digitalID.expiryDate,
      qrCode: digitalID.qrCode
    };
  }

  // Get QR code by ID
  static async getQRCode(id: string): Promise<string> {
    const digitalID = await DigitalIDModel.findById(id);

    if (!digitalID) {
      throw new AppError('Digital ID not found', 404);
    }

    // Check if ID is expired
    if (digitalID.expiryDate < new Date()) {
      throw new AppError('Digital ID has expired', 410);
    }

    return digitalID.qrCode;
  }

  // Verify QR code
  static async verifyQRCode(verifyData: VerifyQRRequest): Promise<{
    valid: boolean;
    data?: any;
    expired?: boolean;
  }> {
    try {
      // Decode QR data (simple base64 decode for mock)
      const decodedData = Buffer.from(verifyData.qrData, 'base64').toString('utf8');
      const idData = JSON.parse(decodedData);

      // Find digital ID
      const digitalID = await DigitalIDModel.findOne({ userId: idData.userId });

      if (!digitalID) {
        return { valid: false };
      }

      // Check if expired
      if (digitalID.expiryDate < new Date()) {
        return { valid: true, expired: true, data: idData };
      }

      return { valid: true, expired: false, data: idData };
    } catch (error) {
      logger.error('QR verification error:', error);
      return { valid: false };
    }
  }
}