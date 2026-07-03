import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/order.routes.js';
import reviewRoutes from './routes/review.routes.js';
import questionRoutes from './routes/question.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import sliderRoutes from './routes/slider.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import translateRoutes from './routes/translate.routes.js';
import telegramRoutes from './routes/telegram.routes.js';
import adminUserRoutes from './routes/admin-user.routes.js';
import flashSaleRoutes from './routes/flash-sale.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { getSitemap, getRobotsTxt } from './controllers/seo.controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  '/api',
  rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
);

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobotsTxt);

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/auth', telegramRoutes);
app.use('/api/admin-users', adminUserRoutes);
app.use('/api/flash-sale', flashSaleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
