import { AppError } from '../utils/AppError.js';

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

export function notFoundHandler(req, res) {
  setCorsHeaders(req, res);
  res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } });
}

export function errorHandler(err, req, res, next) {
  setCorsHeaders(req, res);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }

  // Zod validation errors
  if (err.name === 'ZodError' || err.issues) {
    const message = (err.issues || []).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return res.status(422).json({ error: { message: message || 'Validation error', code: 'VALIDATION_ERROR' } });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { message: 'File too large (max 15MB)', code: 'FILE_TOO_LARGE' } });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: { message: 'Too many files (max 10)', code: 'TOO_MANY_FILES' } });
  }
  if (err.message === 'Unsupported file type') {
    return res.status(400).json({ error: { message: 'Unsupported file type', code: 'INVALID_FILE_TYPE' } });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: { message: `Duplicate value for: ${err.meta?.target}`, code: 'CONFLICT' },
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Record not found', code: 'NOT_FOUND' } });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
}
