import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { translate } from '../controllers/translate.controller.js';

const router = Router();

router.post('/', authenticate, requireAdmin, translate);

export default router;
