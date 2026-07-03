import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SHIPPING_FLAT_FEE = 25000;
const TAX_RATE = 0;

function generateOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MP-${stamp}-${rand}`;
}

export const createOrder = asyncHandler(async (req, res) => {
  const { region, district, street, phone, paymentMethod, couponCode } = req.body;
  if (!region || !district || !street || !phone) {
    throw new AppError('Delivery address is incomplete', 422, 'VALIDATION_ERROR');
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400, 'EMPTY_CART');

  for (const item of cart.items) {
    if (!item.product.isActive || item.product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${item.product.nameUz}`, 400, 'OUT_OF_STOCK');
    }
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const unitPrice = item.product.discountPrice ?? item.product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) throw new AppError('Invalid coupon', 400, 'INVALID_COUPON');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new AppError('Coupon expired', 400, 'COUPON_EXPIRED');
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 400, 'COUPON_LIMIT');
    }
    if (subtotal < coupon.minOrder) {
      throw new AppError(`Minimum order for this coupon is ${coupon.minOrder}`, 400, 'COUPON_MIN_ORDER');
    }
    discount = coupon.type === 'PERCENT' ? subtotal * (coupon.value / 100) : coupon.value;
    discount = Math.min(discount, subtotal);
  }

  const shipping = SHIPPING_FLAT_FEE;
  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + shipping + tax;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
        region,
        district,
        street,
        phone,
        paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
        couponCode: coupon?.code,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            name: item.product.nameUz,
            price: item.product.discountPrice ?? item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      });
    }
    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.notification.create({
      data: {
        userId: req.user.id,
        type: 'ORDER_CREATED',
        message: `Buyurtmangiz #${created.orderNumber} qabul qilindi`,
      },
    });

    return created;
  });

  res.status(201).json({ order });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ orders });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order || order.userId !== req.user.id) throw new AppError('Order not found', 404, 'NOT_FOUND');
  res.json({ order });
});

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo, page = '1', limit = '50' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const where = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);
  res.json({ orders, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

export const getAdminOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: { select: { sku: true } } } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  res.json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  if (!validStatuses.includes(status)) throw new AppError('Invalid status', 422, 'VALIDATION_ERROR');

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: true },
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: 'ORDER_STATUS',
      message: `Buyurtma #${order.orderNumber} holati: ${status}`,
    },
  });

  res.json({ order });
});
