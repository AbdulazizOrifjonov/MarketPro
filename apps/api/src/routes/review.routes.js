import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  listProductReviews,
  listFeaturedReviews,
  listAllReviews,
  getPendingFeedback,
  getProductRatings,
  createReview,
  deleteReview,
} from '../controllers/review.controller.js';

const router = Router();

router.get('/featured', listFeaturedReviews);
router.get('/pending-feedback', authenticate, getPendingFeedback);
router.get('/product-ratings', authenticate, requireAdmin, getProductRatings);
router.get('/all', authenticate, requireAdmin, listAllReviews);
router.get('/:slug', listProductReviews);
router.post('/:slug', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
