import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listNotifications, markRead, markAllRead } from '../controllers/notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;
