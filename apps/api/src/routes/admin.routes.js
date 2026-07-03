import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getDashboardStats,
  getSalesAnalytics,
  getTopProducts,
  getTopCategoriesAndCustomers,
} from '../controllers/admin.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/top-products', getTopProducts);
router.get('/analytics/top-categories-customers', getTopCategoriesAndCustomers);

export default router;
