import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SAFE_SELECT = {
  id: true, name: true, email: true, phone: true, avatarUrl: true,
  role: true, status: true, createdAt: true, username: true, googleId: true,
  telegramId: true,
};

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatarUrl } = req.body;
  const data = { name, phone, avatarUrl };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const user = await prisma.user.update({ where: { id: req.user.id }, data, select: SAFE_SELECT });
  res.json({ user });
});

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
  res.json({ addresses });
});

export const createAddress = asyncHandler(async (req, res) => {
  const { region, district, neighborhood, street, houseNumber, lat, lng, isDefault } = req.body;
  if (!region || !district || !street) {
    throw new AppError('Region, district and street are required', 422, 'VALIDATION_ERROR');
  }
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      region,
      district,
      neighborhood: neighborhood || null,
      street,
      houseNumber: houseNumber || null,
      lat: lat ?? null,
      lng: lng ?? null,
      isDefault: Boolean(isDefault),
    },
  });
  res.status(201).json({ address });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user.id) throw new AppError('Address not found', 404, 'NOT_FOUND');

  const { region, district, neighborhood, street, houseNumber, lat, lng, isDefault } = req.body;
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }
  const data = { region, district, neighborhood, street, houseNumber, lat, lng, isDefault };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const address = await prisma.address.update({ where: { id }, data });
  res.json({ address });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user.id) throw new AppError('Address not found', 404, 'NOT_FOUND');
  await prisma.address.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export const listUsersAdmin = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({ select: SAFE_SELECT, orderBy: { createdAt: 'desc' } });
  res.json({ users });
});

export const banUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'BANNED' },
    select: SAFE_SELECT,
  });
  res.json({ user });
});

export const unbanUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVE' },
    select: SAFE_SELECT,
  });
  res.json({ user });
});

export const deleteUserAdmin = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('O\'zingizni o\'chira olmaysiz', 403, 'FORBIDDEN');
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['CUSTOMER', 'ADMIN'].includes(role)) throw new AppError('Invalid role', 422, 'VALIDATION_ERROR');
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: SAFE_SELECT,
  });
  res.json({ user });
});
