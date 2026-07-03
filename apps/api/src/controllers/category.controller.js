import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify } from '../utils/slugify.js';

function buildTree(categories, parentId = null) {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, children: buildTree(categories, c.id) }));
}

export const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ where: { isActive: true } });
  res.json({ categories: buildTree(categories) });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
  res.json({ category });
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  res.json({ categories });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
  res.json({ category });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { nameUz, nameRu, nameEn, parentId, imageUrl, order } = req.body;
  const slug = slugify(nameEn || nameUz);
  const category = await prisma.category.create({
    data: { nameUz, nameRu, nameEn, slug, parentId: parentId || null, imageUrl, order: order || 0 },
  });
  res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameUz, nameRu, nameEn, parentId, imageUrl, order, isActive } = req.body;
  const data = { nameUz, nameRu, nameEn, imageUrl, order, isActive };
  if (parentId !== undefined) data.parentId = parentId || null;
  if (nameEn) data.slug = slugify(nameEn);
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const category = await prisma.category.update({ where: { id }, data });
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    throw new AppError('Cannot delete a category that has subcategories', 400, 'HAS_CHILDREN');
  }
  await prisma.category.delete({ where: { id } });
  res.status(204).send();
});
