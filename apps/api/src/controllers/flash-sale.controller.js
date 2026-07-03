import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const ITEM_INCLUDE = {
  product: {
    include: { images: { take: 1, orderBy: { order: 'asc' } }, category: true, brand: true },
  },
};

export const getActiveFlashSale = asyncHandler(async (req, res) => {
  const sale = await prisma.flashSale.findFirst({
    where: { isActive: true, endsAt: { gt: new Date() } },
    include: { items: { include: ITEM_INCLUDE, orderBy: { order: 'asc' } } },
  });
  res.json({ flashSale: sale });
});

export const getFlashSaleAdmin = asyncHandler(async (req, res) => {
  const sales = await prisma.flashSale.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: ITEM_INCLUDE, orderBy: { order: 'asc' } } },
  });
  res.json({ flashSales: sales });
});

export const createFlashSale = asyncHandler(async (req, res) => {
  const { hours = 12, productIds = [] } = req.body;

  await prisma.flashSale.updateMany({ where: { isActive: true }, data: { isActive: false } });

  const endsAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const sale = await prisma.flashSale.create({
    data: {
      isActive: true,
      endsAt,
      items: {
        create: productIds.map((productId, i) => ({ productId, order: i })),
      },
    },
    include: { items: { include: ITEM_INCLUDE, orderBy: { order: 'asc' } } },
  });

  res.status(201).json({ flashSale: sale });
});

export const updateFlashSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, hours, productIds } = req.body;

  const existing = await prisma.flashSale.findUnique({ where: { id } });
  if (!existing) throw new AppError('Flash sale topilmadi', 404);

  const data = {};
  if (typeof isActive === 'boolean') {
    if (isActive) {
      await prisma.flashSale.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } });
    }
    data.isActive = isActive;
  }
  if (hours) {
    data.endsAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  if (productIds) {
    await prisma.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
    await prisma.flashSaleItem.createMany({
      data: productIds.map((productId, i) => ({ flashSaleId: id, productId, order: i })),
    });
  }

  const sale = await prisma.flashSale.update({
    where: { id },
    data,
    include: { items: { include: ITEM_INCLUDE, orderBy: { order: 'asc' } } },
  });

  res.json({ flashSale: sale });
});

export const deleteFlashSale = asyncHandler(async (req, res) => {
  await prisma.flashSale.delete({ where: { id: req.params.id } });
  res.json({ message: "O'chirildi" });
});

export const addItemToFlashSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { productId } = req.body;

  const count = await prisma.flashSaleItem.count({ where: { flashSaleId: id } });
  await prisma.flashSaleItem.create({
    data: { flashSaleId: id, productId, order: count },
  });

  const sale = await prisma.flashSale.findUnique({
    where: { id },
    include: { items: { include: ITEM_INCLUDE, orderBy: { order: 'asc' } } },
  });
  res.json({ flashSale: sale });
});

export const removeItemFromFlashSale = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  await prisma.flashSaleItem.delete({ where: { id: itemId } });

  const sale = await prisma.flashSale.findUnique({
    where: { id },
    include: { items: { include: ITEM_INCLUDE, orderBy: { order: 'asc' } } },
  });
  res.json({ flashSale: sale });
});
