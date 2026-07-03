import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { listBrands, createBrand, updateBrand, deleteBrand } from '../controllers/brand.controller.js';

const router = Router();

router.get('/', listBrands);
router.post('/', authenticate, requireAdmin, createBrand);
router.patch('/:id', authenticate, requireAdmin, updateBrand);
router.delete('/:id', authenticate, requireAdmin, deleteBrand);

export default router;
