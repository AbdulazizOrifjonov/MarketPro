import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SITE_URL = process.env.SITE_URL || process.env.CLIENT_URL || 'http://localhost:5173';

export const getSitemap = asyncHandler(async (req, res) => {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  const staticUrls = ['', '/catalog'];
  const urls = [
    ...staticUrls.map((path) => `<url><loc>${SITE_URL}${path}</loc></url>`),
    ...categories.map((c) => `<url><loc>${SITE_URL}/catalog?category=${c.slug}</loc></url>`),
    ...products.map(
      (p) =>
        `<url><loc>${SITE_URL}/product/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

export const getRobotsTxt = (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
};
