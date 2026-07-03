import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listActiveSliders = asyncHandler(async (req, res) => {
  const sliders = await prisma.sliderBanner.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  res.json({ sliders });
});

export const listAllSliders = asyncHandler(async (req, res) => {
  const sliders = await prisma.sliderBanner.findMany({ orderBy: { order: 'asc' } });
  res.json({ sliders });
});

export const createSlider = asyncHandler(async (req, res) => {
  const { title, subtitle, imageUrl, link, order } = req.body;
  const slider = await prisma.sliderBanner.create({
    data: { title, subtitle, imageUrl, link, order: order || 0 },
  });
  res.status(201).json({ slider });
});

export const updateSlider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, imageUrl, link, order, isActive } = req.body;
  const data = { title, subtitle, imageUrl, link, order, isActive };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const slider = await prisma.sliderBanner.update({ where: { id }, data });
  res.json({ slider });
});

export const deleteSlider = asyncHandler(async (req, res) => {
  await prisma.sliderBanner.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
