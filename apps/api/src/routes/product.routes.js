import { Router } from 'express';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';
import {
  listProducts,
  getProductsByIds,
  getProductBySlug,
  getSimilarProducts,
  getRelatedProducts,
  getFrequentlyBoughtTogether,
  getRecentlyViewed,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductAdmin,
  listProductsAdmin,
} from '../controllers/product.controller.js';

const router = Router();

router.get('/recently-viewed', authenticate, getRecentlyViewed);
router.get('/by-ids', getProductsByIds);
router.get('/admin/all', authenticate, requireAdmin, listProductsAdmin);
router.get('/admin/:id', authenticate, requireAdmin, getProductAdmin);
router.get('/:slug/similar', getSimilarProducts);
router.get('/:slug/related', getRelatedProducts);
router.get('/:slug/frequently-bought-together', getFrequentlyBoughtTogether);
router.get('/:slug', optionalAuth, getProductBySlug);
router.get('/', listProducts);
router.post('/', authenticate, requireAdmin, createProduct);
router.patch('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
