import 'dotenv/config';
import app from './app.js';
import { prisma } from './lib/prisma.js';
import { startBot, stopBot } from './services/telegram.service.js';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=80',
];

async function fixPicsumImages() {
  try {
    const nonCdnImages = await prisma.productImage.findMany({
      where: {
        AND: [
          { NOT: { url: { startsWith: 'https://images.unsplash.com' } } },
          { NOT: { url: { startsWith: 'https://res.cloudinary.com' } } },
        ],
      },
    });
    if (nonCdnImages.length > 0) {
      console.log(`Replacing ${nonCdnImages.length} non-CDN image URLs with Unsplash CDN images...`);
      for (let i = 0; i < nonCdnImages.length; i++) {
        const newUrl = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length];
        await prisma.productImage.update({
          where: { id: nonCdnImages[i].id },
          data: { url: newUrl },
        });
      }
      console.log('All product images updated successfully!');
    }

    const nonCdnSliders = await prisma.sliderBanner.findMany({
      where: {
        AND: [
          { NOT: { imageUrl: { startsWith: 'https://images.unsplash.com' } } },
          { NOT: { imageUrl: { startsWith: 'https://res.cloudinary.com' } } },
        ],
      },
    });
    if (nonCdnSliders.length > 0) {
      const sliderImages = [
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1600&auto=format&fit=crop&q=80',
      ];
      for (let i = 0; i < nonCdnSliders.length; i++) {
        await prisma.sliderBanner.update({
          where: { id: nonCdnSliders[i].id },
          data: { imageUrl: sliderImages[i % sliderImages.length] },
        });
      }
    }
  } catch (err) {
    console.error('Auto fix images error:', err);
  }
}

const server = app.listen(PORT, () => {
  console.log(`MarketPro API running on http://localhost:${PORT}`);
  startBot();
  fixPicsumImages();
});

function gracefulShutdown(signal) {
  console.log(`\n${signal} received — shutting down...`);
  server.close(async () => {
    stopBot();
    await prisma.$disconnect();
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
