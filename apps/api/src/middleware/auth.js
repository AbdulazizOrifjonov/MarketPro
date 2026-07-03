import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  const token = header.split(' ')[1];
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new AppError('User not found', 401, 'UNAUTHENTICATED');
  if (user.status === 'BANNED') throw new AppError('Account banned', 403, 'BANNED');

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.split(' ')[1]);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (user && user.status !== 'BANNED') req.user = user;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
});

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403, 'FORBIDDEN');
  }
  next();
}
