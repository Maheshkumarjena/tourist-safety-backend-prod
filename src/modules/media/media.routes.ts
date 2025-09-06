import express from 'express';
import { MediaController } from './media.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// Upload media (requires authentication)
router.post('/upload', authenticate, MediaController.upload);

// Get media file (public)
router.get('/:filename', MediaController.getFile);

// Delete media file (requires authentication)
router.delete('/:filename', authenticate, MediaController.deleteFile);

export default router;