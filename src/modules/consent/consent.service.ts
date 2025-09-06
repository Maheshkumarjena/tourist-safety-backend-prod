import { Consent, IConsent } from './consent.model';
import { ConsentRecord } from './consent.types';
import { AppError } from '../../utils/appError';

export class ConsentService {
  // Record user consent
  static async recordConsent(consentData: Partial<IConsent>): Promise<IConsent> {
    const consent = new Consent(consentData);
    return await consent.save();
  }

  // Get consent history for a user
  static async getConsentHistory(userId: string): Promise<IConsent[]> {
    return await Consent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to 50 most recent records
  }

  // Get current consent status for a user
  static async getCurrentConsent(userId: string, type: string): Promise<IConsent | null> {
    return await Consent.findOne({ userId, type })
      .sort({ timestamp: -1 });
  }

  // Check if user has given consent
  static async hasConsent(userId: string, type: string): Promise<boolean> {
    const consent = await this.getCurrentConsent(userId, type);
    return consent ? consent.granted : false;
  }

  // Revoke consent (record negative consent)
  static async revokeConsent(userId: string, type: string, purpose: string, version: string): Promise<IConsent> {
    const consent = new Consent({
      userId,
      type: type as any,
      granted: false,
      purpose,
      version,
      timestamp: new Date()
    });

    return await consent.save();
  }
}