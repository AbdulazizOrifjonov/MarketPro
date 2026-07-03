import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const WISHLIST_INCLUDE = {
  items: {
    include: { product: { include: { images: { orderBy: { order: 'asc' }, take: 1 } } } },
  },
};

async function getOrCreateWishlist(userId) {
  let wishlist = await prisma.wishlist.findUnique({ where: { userId }, include: WISHLIST_INCLUDE });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId }, include: WISHLIST_INCLUDE });
  }
  return wishlist;
}

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user.id);
  res.json({ wishlist });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new AppError('productId is required', 422, 'VALIDATION_ERROR');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const wishlist = await getOrCreateWishlist(req.user.id);
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    update: {},
    create: { wishlistId: wishlist.id, productId },
  });

  const updated = await getOrCreateWishlist(req.user.id);
  res.json({ wishlist: updated });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await getOrCreateWishlist(req.user.id);
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  const updated = await getOrCreateWishlist(req.user.id);
  res.json({ wishlist: updated });
});

export const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await getOrCreateWishlist(req.user.id);

  const item = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  if (!item) throw new AppError('Item not found in wishlist', 404, 'NOT_FOUND');

  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (!cart) cart = await prisma.cart.create({ data: { userId: req.user.id } });

  const existingCartItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (existingCartItem) {
    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: existingCartItem.quantity + 1 },
    });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: 1 } });
  }

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  res.json({ message: 'Moved to cart' });
});
