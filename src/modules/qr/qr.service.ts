import { DigitalID as DigitalIDModel, IDigitalID } from '../user/user.model';
import { DigitalID, IssueIDRequest, VerifyQRRequest } from './qr.types';
import QRCode from 'qrcode';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';

// Import blockchain interaction
const { mintUser } = require('../../blockchain/interaction_hash');

export class QRService {
  // Issue a true blockchain digital ID (mint NFT if not present)
  static async issueDigitalID(issueData: IssueIDRequest): Promise<DigitalID> {
    // Check if digital ID already exists for this user (with blockchainHash)
    let existingID = await DigitalIDModel.findOne({ userId: issueData.userId });
    if (existingID && existingID.blockchainHash) {
      return {
        userId: existingID.userId.toString(),
        idData: existingID.idData,
        expiryDate: existingID.expiryDate,
        qrCode: existingID.qrCode,
        blockchainHash: existingID.blockchainHash
      };
    }

    // Mint on blockchain (use idData as unique hash input)
    let blockchainHash;
    try {
      const mintResult = await mintUser(issueData.idData, 'active', '');
      // The hash is deterministic from idData, so store it
      const { ethers } = require('ethers');
      blockchainHash = ethers.keccak256(ethers.toUtf8Bytes(issueData.idData));
    } catch (err) {
      logger.error('Blockchain minting failed:', err);
      throw new AppError('Blockchain minting failed', 500);
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(issueData.idData);

    // Create or update digital ID
    if (existingID) {
      existingID.blockchainHash = blockchainHash;
      existingID.qrCode = qrCode;
      existingID.idData = issueData.idData;
      existingID.expiryDate = issueData.expiryDate;
      await existingID.save();
    } else {
      existingID = new DigitalIDModel({
        userId: issueData.userId,
        idData: issueData.idData,
        expiryDate: issueData.expiryDate,
        qrCode,
        blockchainHash
      });
      await existingID.save();
    }

    logger.info(`Blockchain digital ID issued for user ${issueData.userId}`);

    return {
      userId: existingID.userId.toString(),
      idData: existingID.idData,
      expiryDate: existingID.expiryDate,
      qrCode: existingID.qrCode,
      blockchainHash: existingID.blockchainHash
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