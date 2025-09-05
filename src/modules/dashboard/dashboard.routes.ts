import { Router } from 'express';
import { giveConsent } from './dashboard.controller';

const router = Router();

router.post('/', giveConsent);

export default router;
