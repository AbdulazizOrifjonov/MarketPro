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

  const userId = payload.id || payload.sub;
  if (!userId) throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN');

  const user = await prisma.user.findUnique({ where: { id: userId } });
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
      const userId = payload.id || payload.sub;
      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && user.status !== 'BANNED') req.user = user;
      }
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
});

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
  }
  next();
};
