import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getCategoryTree,
  listCategories,
  getCategory,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';

const router = Router();

router.get('/tree', getCategoryTree);
router.get('/:slug', getCategory);
router.get('/id/:id', authenticate, requireAdmin, getCategoryById);
router.get('/', authenticate, requireAdmin, listCategories);
router.post('/', authenticate, requireAdmin, createCategory);
router.patch('/:id', authenticate, requireAdmin, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
