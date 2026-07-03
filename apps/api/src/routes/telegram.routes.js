import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { requestVerification, getSessionStatus, verifyOtpHandler } from '../controllers/telegram.controller.js';

const router = Router();

const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.phone || req.ip,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const requestSchema = z.object({
  phone: z.string().min(9).max(20),
  email: z.string().email("Email noto'g'ri").optional(),
});

const verifySchema = z.object({
  sessionId: z.string().uuid('Noto\'g\'ri session format'),
  otp: z
    .string()
    .length(6, '6 ta raqam kiriting')
    .regex(/^\d+$/, 'Faqat raqamlar'),
});

router.post('/request-verification', verificationLimiter, validateBody(requestSchema), requestVerification);
router.get('/session-status/:sessionId', getSessionStatus);
router.post('/verify-otp', otpLimiter, validateBody(verifySchema), verifyOtpHandler);

export default router;
