import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { listProductQuestions, createQuestion, answerQuestion } from '../controllers/question.controller.js';

const router = Router();

router.get('/:slug', listProductQuestions);
router.post('/:slug', authenticate, createQuestion);
router.patch('/:id/answer', authenticate, requireAdmin, answerQuestion);

export default router;
