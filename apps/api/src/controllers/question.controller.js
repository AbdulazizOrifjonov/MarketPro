import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProductQuestions = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const questions = await prisma.question.findMany({
    where: { productId: product.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ questions });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question) throw new AppError('Question is required', 422, 'VALIDATION_ERROR');

  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

  const created = await prisma.question.create({
    data: { productId: product.id, userId: req.user.id, question },
    include: { user: { select: { id: true, name: true } } },
  });
  res.status(201).json({ question: created });
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const { answer } = req.body;
  if (!answer) throw new AppError('Answer is required', 422, 'VALIDATION_ERROR');

  const question = await prisma.question.update({
    where: { id: req.params.id },
    data: { answer },
    include: { user: { select: { id: true, name: true } } },
  });
  res.json({ question });
});
