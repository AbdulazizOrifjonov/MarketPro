import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listBrands = asyncHandler(async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  res.json({ brands });
});

export const createBrand = asyncHandler(async (req, res) => {
  const { name, logoUrl } = req.body;
  if (!name) throw new AppError('Name is required', 422, 'VALIDATION_ERROR');
  const brand = await prisma.brand.create({ data: { name, logoUrl } });
  res.status(201).json({ brand });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, logoUrl } = req.body;
  const brand = await prisma.brand.update({ where: { id }, data: { name, logoUrl } });
  res.json({ brand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
