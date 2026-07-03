import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/coupon.controller.js';

const router = Router();

router.post('/validate', authenticate, validateCoupon);
router.get('/', authenticate, requireAdmin, listCoupons);
router.post('/', authenticate, requireAdmin, createCoupon);
router.patch('/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/:id', authenticate, requireAdmin, deleteCoupon);

export default router;
