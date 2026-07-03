import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  createOrder,
  listMyOrders,
  getMyOrder,
  listAllOrders,
  getAdminOrder,
  updateOrderStatus,
} from '../controllers/order.controller.js';

const router = Router();
router.use(authenticate);

router.get('/admin/all', requireAdmin, listAllOrders);
router.get('/admin/:id', requireAdmin, getAdminOrder);
router.patch('/admin/:id/status', requireAdmin, updateOrderStatus);
router.post('/', createOrder);
router.get('/', listMyOrders);
router.get('/:id', getMyOrder);

export default router;
