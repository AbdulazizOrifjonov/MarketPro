import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  createAdminUser,
  listAdminUsers,
  getAdminUser,
  updateAdminUser,
  resetAdminPassword,
  toggleAdminStatus,
  deleteAdminUser,
  changeOwnPassword,
  promoteToAdmin,
} from '../controllers/admin-user.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

const createAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+998\d{9}$/),
  username: z.string().min(2).max(50).optional(),
  password: z.string().min(6).max(100),
});

const updateAdminSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+998\d{9}$/).optional(),
  adminLevel: z.enum(['SUPER_ADMIN', 'ASSISTANT_ADMIN']).optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6).max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

router.post('/', validateBody(createAdminSchema), createAdminUser);
router.get('/', listAdminUsers);
router.post('/promote/:id', promoteToAdmin);
router.patch('/me/password', validateBody(changePasswordSchema), changeOwnPassword);
router.get('/:id', getAdminUser);
router.patch('/:id', validateBody(updateAdminSchema), updateAdminUser);
router.patch('/:id/password', validateBody(passwordSchema), resetAdminPassword);
router.patch('/:id/status', toggleAdminStatus);
router.delete('/:id', deleteAdminUser);

export default router;
