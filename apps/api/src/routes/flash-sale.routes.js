import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getActiveFlashSale,
  getFlashSaleAdmin,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  addItemToFlashSale,
  removeItemFromFlashSale,
} from '../controllers/flash-sale.controller.js';

const router = Router();

router.get('/active', getActiveFlashSale);

router.use(authenticate, requireAdmin);
router.get('/', getFlashSaleAdmin);
router.post('/', createFlashSale);
router.patch('/:id', updateFlashSale);
router.delete('/:id', deleteFlashSale);
router.post('/:id/items', addItemToFlashSale);
router.delete('/:id/items/:itemId', removeItemFromFlashSale);

export default router;
