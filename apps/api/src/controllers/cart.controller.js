import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const CART_INCLUDE = {
  items: {
    include: { product: { include: { images: { orderBy: { order: 'asc' }, take: 1 } } } },
  },
};

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: CART_INCLUDE });
  }
  return cart;
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  res.json({ cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) throw new AppError('productId is required', 422, 'VALIDATION_ERROR');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const cart = await getOrCreateCart(req.user.id);
  const existing = cart.items.find((i) => i.productId === productId);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  }

  const updated = await getOrCreateCart(req.user.id);
  res.json({ cart: updated });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== req.user.id) throw new AppError('Item not found', 404, 'NOT_FOUND');

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  const cart = await getOrCreateCart(req.user.id);
  res.json({ cart });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== req.user.id) throw new AppError('Item not found', 404, 'NOT_FOUND');

  await prisma.cartItem.delete({ where: { id: itemId } });
  const cart = await getOrCreateCart(req.user.id);
  res.json({ cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  const updated = await getOrCreateCart(req.user.id);
  res.json({ cart: updated });
});
