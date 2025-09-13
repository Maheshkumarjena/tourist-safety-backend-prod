// DigitalID type for service/controller return
export interface DigitalID {
  userId: string;
  idData: string;
  expiryDate: Date;
  qrCode: string;
  blockchainHash?: string;
}

// Request type for issuing a digital ID
export interface IssueIDRequest {
  userId: string;
  idData: string;
  expiryDate: Date;
}

// Request type for verifying a QR code
export interface VerifyQRRequest {
  qrData: string;
}
export interface ConsentRecord {
  userId: string;
  type: 'tracking' | 'notifications' | 'data_collection' | 'emergency_contacts';
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  purpose: string;
  version: string;
}