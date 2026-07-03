import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, totalUsers, totalOrders, revenueAgg, wishlistCount, cartItemCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['DELIVERED', 'SHIPPING', 'CONFIRMED'] } },
      }),
      prisma.wishlistItem.count(),
      prisma.cartItem.count(),
    ]);

  res.json({
    totalProducts,
    totalUsers,
    totalOrders,
    revenue: revenueAgg._sum.total || 0,
    wishlistCount,
    cartItemCount,
  });
});

export const getSalesAnalytics = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
    select: { createdAt: true, total: true },
  });

  const dailyMap = new Map();
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + order.total);
  }
  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));

  const monthlyMap = new Map();
  const allOrders = await prisma.order.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: { createdAt: true, total: true },
  });
  for (const order of allOrders) {
    const month = order.createdAt.toISOString().slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + order.total);
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  const byStatus = await prisma.order.groupBy({ by: ['status'], _count: { status: true } });

  res.json({ daily, monthly, byStatus });
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const includeImages = { images: { take: 1, orderBy: { order: 'asc' } } };

  const [mostViewed, mostSold] = await Promise.all([
    prisma.product.findMany({ orderBy: { viewCount: 'desc' }, take: 10, include: includeImages }),
    prisma.product.findMany({ orderBy: { soldCount: 'desc' }, take: 10, include: includeImages }),
  ]);

  const mostWishlisted = await prisma.wishlistItem.groupBy({
    by: ['productId'],
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 10,
  });
  const mostCarted = await prisma.cartItem.groupBy({
    by: ['productId'],
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 10,
  });

  async function hydrate(grouped) {
    const ids = grouped.map((g) => g.productId);
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: includeImages });
    const map = new Map(products.map((p) => [p.id, p]));
    return grouped.map((g) => ({ product: map.get(g.productId), count: g._count.productId })).filter((x) => x.product);
  }

  res.json({
    mostViewed,
    mostSold,
    mostWishlisted: await hydrate(mostWishlisted),
    mostCarted: await hydrate(mostCarted),
  });
});

export const getTopCategoriesAndCustomers = asyncHandler(async (req, res) => {
  const orderItems = await prisma.orderItem.findMany({
    include: { product: { select: { categoryId: true } } },
  });
  const categoryTotals = new Map();
  for (const item of orderItems) {
    const catId = item.product?.categoryId;
    if (!catId) continue;
    categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + item.price * item.quantity);
  }
  const categories = await prisma.category.findMany({
    where: { id: { in: [...categoryTotals.keys()] } },
  });
  const topCategories = categories
    .map((c) => ({ category: c, total: categoryTotals.get(c.id) || 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const customerTotals = await prisma.order.groupBy({
    by: ['userId'],
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 10,
  });
  const userIds = customerTotals.map((c) => c.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const topCustomers = customerTotals.map((c) => ({
    user: userMap.get(c.userId),
    total: c._sum.total || 0,
  }));

  res.json({ topCategories, topCustomers });
});
