import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) throw new AppError('Invalid coupon', 400, 'INVALID_COUPON');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError('Coupon expired', 400, 'COUPON_EXPIRED');
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached', 400, 'COUPON_LIMIT');
  }
  if (subtotal !== undefined && subtotal < coupon.minOrder) {
    throw new AppError(`Minimum order for this coupon is ${coupon.minOrder}`, 400, 'COUPON_MIN_ORDER');
  }
  res.json({ coupon });
});

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { id: 'desc' } });
  res.json({ coupons });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minOrder, expiresAt, usageLimit } = req.body;
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type,
      value,
      minOrder: minOrder || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: usageLimit || null,
    },
  });
  res.status(201).json({ coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code, type, value, minOrder, expiresAt, usageLimit, isActive } = req.body;
  const data = { type, value, minOrder, usageLimit, isActive };
  if (code) data.code = code.toUpperCase();
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const coupon = await prisma.coupon.update({ where: { id }, data });
  res.json({ coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
