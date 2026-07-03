import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reviews });
});

export const listFeaturedReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: '' } },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      product: { select: { id: true, slug: true, nameUz: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  res.json({ reviews });
});

export const listAllReviews = asyncHandler(async (req, res) => {
  const { page = '1', limit = '30' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
  const [total, reviews] = await Promise.all([
    prisma.review.count(),
    prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        product: { select: { id: true, slug: true, nameUz: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);
  res.json({ reviews, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 422, 'VALIDATION_ERROR');
  }

  const purchased = await prisma.orderItem.findFirst({
    where: { productId: product.id, order: { userId: req.user.id, status: 'DELIVERED' } },
  });
  if (!purchased) {
    throw new AppError('You can only review products you have purchased', 403, 'NOT_PURCHASED');
  }

  const review = await prisma.review.create({
    data: { productId: product.id, userId: req.user.id, rating, comment: comment || '' },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  res.status(201).json({ review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');
  if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }
  await prisma.review.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
