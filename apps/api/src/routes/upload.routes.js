import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadMedia } from '../controllers/upload.controller.js';
import { AppError } from '../utils/AppError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/(jpeg|png|webp|gif)|video\/mp4)$/;
    if (!allowed.test(file.mimetype)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  },
});

const router = Router();

function requireAdminUnlessAvatar(req, res, next) {
  if (req.params.folder === 'avatars') return next();
  if (req.user.role !== 'ADMIN') throw new AppError('Admin access required', 403, 'FORBIDDEN');
  next();
}

router.post('/:folder', authenticate, requireAdminUnlessAvatar, upload.array('files', 10), uploadMedia);

export default router;
