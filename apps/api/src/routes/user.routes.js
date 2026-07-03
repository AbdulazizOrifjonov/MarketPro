import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  updateProfile,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listUsersAdmin,
  banUser,
  unbanUser,
  deleteUserAdmin,
  updateUserRole,
} from '../controllers/user.controller.js';

const router = Router();
router.use(authenticate);

router.patch('/me', updateProfile);
router.get('/me/addresses', listAddresses);
router.post('/me/addresses', createAddress);
router.patch('/me/addresses/:id', updateAddress);
router.delete('/me/addresses/:id', deleteAddress);

router.get('/admin/all', requireAdmin, listUsersAdmin);
router.patch('/admin/:id/ban', requireAdmin, banUser);
router.patch('/admin/:id/unban', requireAdmin, unbanUser);
router.patch('/admin/:id/role', requireAdmin, updateUserRole);
router.delete('/admin/:id', requireAdmin, deleteUserAdmin);

export default router;
