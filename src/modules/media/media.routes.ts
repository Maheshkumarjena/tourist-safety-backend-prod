import { Router } from 'express';
import { uploadMedia, uploadMultipleMedia, upload } from './media.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// Routes
router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.post('/upload-multiple', authenticate, upload.array('files', 5), uploadMultipleMedia);

export default router;