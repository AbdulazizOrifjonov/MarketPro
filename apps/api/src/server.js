import 'dotenv/config';
import app from './app.js';
import { prisma } from './lib/prisma.js';
import { startBot, stopBot } from './services/telegram.service.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`MarketPro API running on http://localhost:${PORT}`);
  startBot();
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
