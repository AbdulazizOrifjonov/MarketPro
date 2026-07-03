import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';

function publicAdmin(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/admin-users — Super Admin only — create assistant admin
export const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, username } = req.body;

  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Faqat Super Admin yarata oladi', 403, 'FORBIDDEN');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) throw new AppError('Email yoki telefon allaqachon mavjud', 409, 'CONFLICT');

  if (username) {
    const existingUsername = await prisma.user.findFirst({ where: { username } });
    if (existingUsername) throw new AppError('Bu login allaqachon band', 409, 'CONFLICT');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      username: username || null,
      passwordHash,
      credentialPassword: password,
      role: 'ADMIN',
      adminLevel: 'ASSISTANT_ADMIN',
      createdByAdmin: req.user.id,
    },
  });

  res.status(201).json({ user: publicAdmin(user) });
});

// GET /api/admin-users — Super Admin only — list all admins
export const listAdminUsers = asyncHandler(async (req, res) => {
  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Faqat Super Admin ko\'ra oladi', 403, 'FORBIDDEN');
  }

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true,
      credentialPassword: true,
      adminLevel: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ admins });
});

// GET /api/admin-users/:id — Super Admin only — get admin details
export const getAdminUser = asyncHandler(async (req, res) => {
  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Ruxsati yo\'q', 403, 'FORBIDDEN');
  }

  const admin = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      adminLevel: true,
      status: true,
      createdAt: true,
      createdByAdmin: true,
    },
  });

  if (!admin || admin.role !== 'ADMIN') {
    throw new AppError('Admin topilmadi', 404, 'NOT_FOUND');
  }

  res.json({ admin });
});

// PATCH /api/admin-users/:id — Super Admin only — update admin info
export const updateAdminUser = asyncHandler(async (req, res) => {
  const { name, email, phone, adminLevel } = req.body;

  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Ruxsati yo\'q', 403, 'FORBIDDEN');
  }

  const admin = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!admin || admin.role !== 'ADMIN') {
    throw new AppError('Admin topilmadi', 404, 'NOT_FOUND');
  }

  // Super Admin cannot be downgraded
  if (admin.adminLevel === 'SUPER_ADMIN') {
    throw new AppError('Super Admin darajasini o\'zgartira olmaysiz', 403, 'FORBIDDEN');
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, email, phone, adminLevel },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      adminLevel: true,
      status: true,
    },
  });

  res.json({ user: updated });
});

// PATCH /api/admin-users/:id/password — Super Admin only — reset admin password
export const resetAdminPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Ruxsati yo\'q', 403, 'FORBIDDEN');
  }

  if (!password || password.length < 6) {
    throw new AppError('Parol kamida 6 ta belgidan iborat bo\'lish kerak', 422, 'VALIDATION_ERROR');
  }

  const admin = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!admin || admin.role !== 'ADMIN') {
    throw new AppError('Admin topilmadi', 404, 'NOT_FOUND');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: req.params.id },
    data: { passwordHash },
  });

  res.json({ message: 'Parol o\'zgartirildi' });
});

// PATCH /api/admin-users/:id/status — Super Admin only — ban/unban admin
export const toggleAdminStatus = asyncHandler(async (req, res) => {
  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Ruxsati yo\'q', 403, 'FORBIDDEN');
  }

  const admin = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!admin || admin.role !== 'ADMIN') {
    throw new AppError('Admin topilmadi', 404, 'NOT_FOUND');
  }

  // Super Admin bloklana olmaydi
  if (admin.adminLevel === 'SUPER_ADMIN') {
    throw new AppError("Super Admin o'zini bloklana olmaydi", 403, 'FORBIDDEN');
  }

  const newStatus = admin.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
  await prisma.user.update({
    where: { id: req.params.id },
    data: { status: newStatus },
  });

  res.json({ message: `Admin ${newStatus === 'BANNED' ? 'bloklandi' : 'faollashtirildi'}` });
});

// DELETE /api/admin-users/:id — Super Admin only — delete admin
export const deleteAdminUser = asyncHandler(async (req, res) => {
  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Ruxsati yo\'q', 403, 'FORBIDDEN');
  }

  if (req.params.id === req.user.id) {
    throw new AppError('O\'zingizni o\'chira olmaysiz', 403, 'FORBIDDEN');
  }

  const admin = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!admin || admin.role !== 'ADMIN') {
    throw new AppError('Admin topilmadi', 404, 'NOT_FOUND');
  }

  if (admin.adminLevel === 'SUPER_ADMIN') {
    throw new AppError('Super Admini o\'chira olmaysiz', 403, 'FORBIDDEN');
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'Admin o\'chirildi' });
});

// POST /api/admin-users/promote/:id — Super Admin only — promote existing user to assistant admin
export const promoteToAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (req.user.adminLevel !== 'SUPER_ADMIN') {
    throw new AppError('Faqat Super Admin admin qila oladi', 403, 'FORBIDDEN');
  }

  if (!username || !password || password.length < 6) {
    throw new AppError('Login va parol (kamida 6 belgi) kerak', 422, 'VALIDATION_ERROR');
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError('Foydalanuvchi topilmadi', 404, 'NOT_FOUND');
  if (target.role === 'ADMIN') throw new AppError('Bu foydalanuvchi allaqachon admin', 409, 'CONFLICT');

  const existingUsername = await prisma.user.findFirst({ where: { username } });
  if (existingUsername) throw new AppError('Bu login allaqachon band', 409, 'CONFLICT');

  const passwordHash = await bcrypt.hash(password, 12);
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      role: 'ADMIN',
      adminLevel: 'ASSISTANT_ADMIN',
      username,
      passwordHash,
      credentialPassword: password,
      createdByAdmin: req.user.id,
    },
    select: {
      id: true, name: true, email: true, phone: true, username: true,
      adminLevel: true, status: true,
    },
  });

  res.json({ user: updated, credentials: { username, password } });
});

// PATCH /api/admin-users/me/password — Any admin — change own password
export const changeOwnPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new AppError('Parol va tasdiq kerak', 422, 'VALIDATION_ERROR');
  }

  const user = req.user;
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Joriy parol noto\'g\'ri', 401, 'INVALID_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  res.json({ message: 'Parol o\'zgartirildi' });
});
