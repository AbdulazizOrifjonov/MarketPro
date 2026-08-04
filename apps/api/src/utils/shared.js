import { prisma } from '../lib/prisma.js';

const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  username: true,
  phone: true,
  phoneVerified: true,
  avatarUrl: true,
  role: true,
  adminLevel: true,
  status: true,
  googleId: true,
  telegramId: true,
  createdAt: true,
  updatedAt: true,
};

export function publicUser(user) {
  const result = {};
  for (const key of Object.keys(PUBLIC_USER_FIELDS)) {
    if (key in user) result[key] = user[key];
  }
  return result;
}

export async function provisionCartAndWishlist(userId) {
  const [cart, wishlist] = await Promise.all([
    prisma.cart.findUnique({ where: { userId } }),
    prisma.wishlist.findUnique({ where: { userId } }),
  ]);
  const ops = [];
  if (!cart) ops.push(prisma.cart.create({ data: { userId } }));
  if (!wishlist) ops.push(prisma.wishlist.create({ data: { userId } }));
  if (ops.length) await Promise.all(ops);
}
