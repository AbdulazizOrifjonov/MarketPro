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

  const parsedReviews = reviews.map((r) => ({
    ...r,
    images: typeof r.images === 'string' ? JSON.parse(r.images || '[]') : r.images || [],
  }));

  res.json({ reviews: parsedReviews });
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

  const parsedReviews = reviews.map((r) => ({
    ...r,
    images: typeof r.images === 'string' ? JSON.parse(r.images || '[]') : r.images || [],
  }));

  res.json({ reviews: parsedReviews });
});

export const listAllReviews = asyncHandler(async (req, res) => {
  const { page = '1', limit = '30', search = '' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

  const where = search
    ? {
        OR: [
          { comment: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { product: { nameUz: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        product: {
          select: { id: true, slug: true, nameUz: true, images: { take: 1, orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);

  const parsedReviews = reviews.map((r) => ({
    ...r,
    images: typeof r.images === 'string' ? JSON.parse(r.images || '[]') : r.images || [],
  }));

  res.json({ reviews: parsedReviews, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

export const getPendingFeedback = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find delivered orders ONLY (Admin status must be DELIVERED)
  const orders = await prisma.order.findMany({
    where: { userId, status: 'DELIVERED' },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, slug: true, nameUz: true, images: { take: 1, orderBy: { order: 'asc' } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get user's existing reviews
  const existingReviews = await prisma.review.findMany({
    where: { userId },
    select: { productId: true },
  });
  const reviewedProductIds = new Set(existingReviews.map((r) => r.productId));

  const pendingItems = [];
  const seenProductIds = new Set();

  for (const order of orders) {
    for (const item of order.items) {
      if (!reviewedProductIds.has(item.productId) && !seenProductIds.has(item.productId) && item.product) {
        seenProductIds.add(item.productId);
        pendingItems.push({
          productId: item.productId,
          productSlug: item.product.slug,
          productName: item.product.nameUz,
          productImage: item.product.images?.[0]?.url || '/placeholder.png',
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
      }
    }
  }

  res.json({ pendingItems });
});

export const getProductRatings = asyncHandler(async (req, res) => {
  const { sort = 'desc' } = req.query; // 'desc' (highest first) or 'asc' (lowest first)

  const products = await prisma.product.findMany({
    include: {
      category: { select: { nameUz: true } },
      images: { take: 1, orderBy: { order: 'asc' } },
      reviews: {
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
    },
  });

  const productRatings = products.map((p) => {
    const totalReviews = p.reviews.length;
    const sumRatings = p.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = totalReviews > 0 ? parseFloat((sumRatings / totalReviews).toFixed(1)) : 0;
    
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    p.reviews.forEach((r) => {
      if (starCounts[r.rating] !== undefined) starCounts[r.rating]++;
    });

    return {
      id: p.id,
      nameUz: p.nameUz,
      slug: p.slug,
      price: p.price,
      imageUrl: p.images?.[0]?.url || null,
      categoryName: p.category?.nameUz || '',
      avgRating,
      totalReviews,
      starCounts,
    };
  });

  productRatings.sort((a, b) => {
    if (sort === 'asc') {
      return a.avgRating - b.avgRating || a.totalReviews - b.totalReviews;
    }
    return b.avgRating - a.avgRating || b.totalReviews - a.totalReviews;
  });

  res.json({ productRatings });
});

export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, images } = req.body;
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  if (req.user.role !== 'ADMIN') {
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: req.user.id,
        status: 'DELIVERED',
        items: { some: { productId: product.id } },
      },
    });

    if (!deliveredOrder) {
      throw new AppError(
        "Mahsulot hali yetkazilmadi. Admin tomonidan 'Yetkazildi' holatiga o'tkazilgach baholashingiz mumkin.",
        403,
        'NOT_DELIVERED_YET'
      );
    }
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 422, 'VALIDATION_ERROR');
  }

  // Format images array (up to 3 items max)
  let imgArray = [];
  if (Array.isArray(images)) {
    imgArray = images.slice(0, 3).filter((img) => typeof img === 'string' && img.trim().length > 0);
  }

  const review = await prisma.review.create({
    data: {
      productId: product.id,
      userId: req.user.id,
      rating: parseInt(rating, 10),
      comment: comment || '',
      images: JSON.stringify(imgArray),
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  res.status(201).json({
    review: {
      ...review,
      images: imgArray,
    },
  });
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
