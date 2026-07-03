import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export function publicUser(user) {
  const { passwordHash, resetToken, resetTokenExpiry, ...rest } = user;
  return rest;
}

async function provisionCartAndWishlist(userId) {
  await prisma.cart.create({ data: { userId } });
  await prisma.wishlist.create({ data: { userId } });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone, role: 'CUSTOMER' },
  });
  await provisionCartAndWishlist(user.id);

  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  if (user.status === 'BANNED') throw new AppError('Account banned', 403, 'BANNED');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: publicUser(user) });
});

export const googleAuth = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw new AppError('Google login is not configured on this server', 503, 'NOT_CONFIGURED');
  }
  const { idToken } = req.body;

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new AppError('Invalid Google token', 401, 'INVALID_TOKEN');

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
        role: 'CUSTOMER',
      },
    });
    await provisionCartAndWishlist(user.id);
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
  }

  if (user.status === 'BANNED') throw new AppError('Account banned', 403, 'BANNED');

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: publicUser(user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond 200 to avoid leaking which emails are registered.
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  // Email delivery wired via nodemailer/SMTP env vars; logged here until SMTP creds are supplied.
  console.log(`[password-reset] token for ${email}: ${resetToken}`);

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ message: 'Password reset successful' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
