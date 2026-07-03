import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getWishlist, addToWishlist, removeFromWishlist, moveToCart } from '../controllers/wishlist.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', getWishlist);
router.post('/items', addToWishlist);
router.delete('/items/:productId', removeFromWishlist);
router.post('/items/:productId/move-to-cart', moveToCart);

export default router;
