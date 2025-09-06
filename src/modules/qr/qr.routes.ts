import express from 'express';
import { QRController } from './qr.controller';

const router = express.Router();

// Issue mock digital ID
router.post('/issue-id', QRController.issueID);

// Get QR code by ID
router.get('/qr/:id', QRController.getQRCode);

// Verify QR code
router.post('/verify', QRController.verifyQR);

export default router;