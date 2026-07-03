import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  listActiveSliders,
  listAllSliders,
  createSlider,
  updateSlider,
  deleteSlider,
} from '../controllers/slider.controller.js';

const router = Router();

router.get('/', listActiveSliders);
router.get('/admin/all', authenticate, requireAdmin, listAllSliders);
router.post('/', authenticate, requireAdmin, createSlider);
router.patch('/:id', authenticate, requireAdmin, updateSlider);
router.delete('/:id', authenticate, requireAdmin, deleteSlider);

export default router;
