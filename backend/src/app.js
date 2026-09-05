import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { publicCacheControl } from './middlewares/cacheControl.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { ApiError } from './utils/apiError.js';
import healthRouter from './routes/health.route.js';
import authRouter from './modules/auth/auth.route.js';
import storeRouter from './modules/stores/store.route.js';
import categoryRouter from './modules/categories/category.route.js';
import productRouter from './modules/products/product.route.js';
import inventoryRouter from './modules/inventory/inventory.route.js';
import customerRouter from './modules/customers/customer.route.js';
import orderRouter from './modules/orders/order.route.js';
import billingRouter from './modules/billing/billing.route.js';
import paymentRouter from './modules/payments/payment.route.js';
import notificationRouter from './modules/notifications/notification.route.js';
import analyticsRouter from './modules/analytics/analytics.route.js';
import adminRouter from './modules/admin/admin.route.js';
import subscriptionRouter from './modules/subscriptions/subscription.route.js';
import auditRouter from './modules/auditLogs/audit.route.js';
import whatsappRouter from './modules/whatsapp/whatsapp.route.js';
import aiRouter from './modules/ai/aiOrder.route.js';
import razorpayRouter from './modules/payments/razorpay.route.js';
import publicRouter from './modules/public/public.route.js';
import imageLibraryRouter from './modules/imageLibrary/imageLibrary.route.js';
import masterCatalogRouter from './modules/masterCatalog/masterCatalog.route.js';

const app = express();

app.use(requestLogger);
app.use(compression());
app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Id']
  })
);

// Express JSON Body Parsers (MUST BE BEFORE ROUTES)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/', globalRateLimiter);

// Public Customer Storefront Routes
app.use('/api/v1/public', publicCacheControl(30), publicRouter);
app.use('/api/v1/ai', aiRouter);

// Authenticated Storekeeper & Staff Routes
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/stores', storeRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/image-library', imageLibraryRouter);
app.use('/api/v1/master-catalog', masterCatalogRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/audit-logs', auditRouter);
app.use('/api/v1/whatsapp', whatsappRouter);
app.use('/api/v1/payments/razorpay', razorpayRouter);

app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint does not exist: ${req.originalUrl}`));
});

app.use(errorHandler);

export default app;