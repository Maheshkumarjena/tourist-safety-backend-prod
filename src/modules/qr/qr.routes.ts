import { Router } from 'express';
import Joi from 'joi';
import {
    generateQRCode,
    verifyQRCode,
    getVerificationStatus,
} from './qr.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';

const router = Router();

// Validation schemas
const verifySchema = Joi.object({
    qrData: Joi.string().required(),
});

// Routes
router.get('/generate', authenticate, generateQRCode);
router.post('/verify', validate(verifySchema), verifyQRCode);
router.get('/status', authenticate, getVerificationStatus);

export default router;