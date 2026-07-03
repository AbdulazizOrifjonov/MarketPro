import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify } from '../utils/slugify.js';

function generateSku() {
  return `MP-${Date.now().toString(36).toUpperCase()}`;
}

async function ensureUniqueSku(sku) {
  let candidate = sku;
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.product.findUnique({ where: { sku: candidate } });
    if (!existing) return candidate;
    candidate = generateSku();
    attempts++;
  }
  return candidate;
}

const PRODUCT_INCLUDE = {
  images: { orderBy: { order: 'asc' } },
  brand: true,
  category: true,
};

async function attachRatings(products) {
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return products;
  const grouped = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: ids } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const map = new Map(grouped.map((g) => [g.productId, g]));
  return products.map((p) => ({
    ...p,
    rating: map.get(p.id)?._avg.rating || 0,
    reviewCount: map.get(p.id)?._count.rating || 0,
  }));
}

const SORT_MAP = {
  newest: { createdAt: 'desc' },
  best_selling: { soldCount: 'desc' },
  most_popular: { viewCount: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
};

export const listProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onSale,
    featured,
    sort = 'newest',
    page = '1',
    limit = '20',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const where = { isActive: true };

  if (q) {
    where.OR = [
      { nameUz: { contains: q } },
      { nameRu: { contains: q } },
      { nameEn: { contains: q } },
      { sku: { contains: q } },
    ];
  }
  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } });
    if (cat) {
      const children = await prisma.category.findMany({ where: { parentId: cat.id } });
      const ids = [cat.id, ...children.map((c) => c.id)];
      where.categoryId = { in: ids };
    } else {
      where.categoryId = '__none__';
    }
  }
  if (brand) where.brandId = brand;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }
  if (inStock === 'true') where.stock = { gt: 0 };
  if (onSale === 'true') where.discountPrice = { not: null };
  if (featured === 'true') where.isFeatured = true;

  const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);

  let withRatings = await attachRatings(products);

  if (minRating) {
    withRatings = withRatings.filter((p) => p.rating >= parseFloat(minRating));
  }
  if (sort === 'highest_rated') {
    withRatings.sort((a, b) => b.rating - a.rating);
  }

  res.json({
    products: withRatings,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: PRODUCT_INCLUDE,
  });
  if (!product || !product.isActive) throw new AppError('Product not found', 404, 'NOT_FOUND');

  await prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } });

  if (req.user) {
    await prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      update: { viewedAt: new Date() },
      create: { userId: req.user.id, productId: product.id },
    });
  }

  const [withRating] = await attachRatings([product]);
  res.json({ product: withRating });
});

export const getProductsByIds = asyncHandler(async (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (ids.length === 0) return res.json({ products: [] });

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: PRODUCT_INCLUDE,
  });
  res.json({ products: await attachRatings(products) });
});

export const getSimilarProducts = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const products = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    include: PRODUCT_INCLUDE,
    take: 8,
  });
  res.json({ products: await attachRatings(products) });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const products = await prisma.product.findMany({
    where: {
      brandId: product.brandId || undefined,
      id: { not: product.id },
      isActive: true,
    },
    include: PRODUCT_INCLUDE,
    take: 8,
  });
  res.json({ products: await attachRatings(products) });
});

export const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const coOrders = await prisma.orderItem.findMany({
    where: { productId: product.id },
    select: { orderId: true },
  });
  const orderIds = coOrders.map((o) => o.orderId);

  if (orderIds.length === 0) return res.json({ products: [] });

  const coItems = await prisma.orderItem.findMany({
    where: { orderId: { in: orderIds }, productId: { not: product.id } },
    select: { productId: true },
  });

  const counts = new Map();
  for (const item of coItems) counts.set(item.productId, (counts.get(item.productId) || 0) + 1);

  const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id);
  if (topIds.length === 0) return res.json({ products: [] });

  const products = await prisma.product.findMany({
    where: { id: { in: topIds }, isActive: true },
    include: PRODUCT_INCLUDE,
  });
  res.json({ products: await attachRatings(products) });
});

export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const views = await prisma.recentlyViewed.findMany({
    where: { userId: req.user.id },
    orderBy: { viewedAt: 'desc' },
    take: 12,
    include: { product: { include: PRODUCT_INCLUDE } },
  });
  const products = await attachRatings(views.map((v) => v.product).filter((p) => p && p.isActive));
  res.json({ products });
});

export const createProduct = asyncHandler(async (req, res) => {
  const {
    nameUz, nameRu, nameEn,
    descriptionUz, descriptionRu, descriptionEn,
    price, discountPrice, stock, sku,
    specs, videoUrl, brandId, categoryId,
    images, isFeatured,
  } = req.body;

  if (!images || images.length < 3) {
    throw new AppError('At least 3 product images are required', 422, 'MIN_IMAGES');
  }

  const finalSku = await ensureUniqueSku(sku?.trim() || generateSku());
  const slug = slugify(`${nameEn}-${finalSku}`);

  const product = await prisma.product.create({
    data: {
      nameUz, nameRu, nameEn,
      descriptionUz, descriptionRu, descriptionEn,
      slug,
      price, discountPrice, stock, sku: finalSku,
      specs: JSON.stringify(specs || {}),
      videoUrl, brandId: brandId || null, categoryId,
      isFeatured: Boolean(isFeatured),
      images: { create: images.map((url, i) => ({ url, order: i })) },
    },
    include: PRODUCT_INCLUDE,
  });

  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nameUz, nameRu, nameEn,
    descriptionUz, descriptionRu, descriptionEn,
    price, discountPrice, stock, sku,
    specs, videoUrl, brandId, categoryId,
    images, isFeatured, isActive,
  } = req.body;

  if (images && images.length < 3) {
    throw new AppError('At least 3 product images are required', 422, 'MIN_IMAGES');
  }

  const data = {
    nameUz, nameRu, nameEn,
    descriptionUz, descriptionRu, descriptionEn,
    price, discountPrice, stock, sku,
    videoUrl, categoryId, isFeatured, isActive,
  };
  if (specs !== undefined) data.specs = JSON.stringify(specs);
  if (brandId !== undefined) data.brandId = brandId || null;
  if (nameEn && sku) data.slug = slugify(`${nameEn}-${sku}`);
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  if (images) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    data.images = { create: images.map((url, i) => ({ url, order: i })) };
  }

  const product = await prisma.product.update({ where: { id }, data, include: PRODUCT_INCLUDE });
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export const getProductAdmin = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: PRODUCT_INCLUDE,
  });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
  res.json({ product });
});

export const listProductsAdmin = asyncHandler(async (req, res) => {
  const { search, page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const where = {};
  if (search) {
    where.OR = [
      { nameUz: { contains: search } },
      { nameRu: { contains: search } },
      { nameEn: { contains: search } },
      { sku: { contains: search } },
    ];
  }
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);
  res.json({ products, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});
