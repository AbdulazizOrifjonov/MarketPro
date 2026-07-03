import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }

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
