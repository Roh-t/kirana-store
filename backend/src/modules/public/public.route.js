import { Router } from 'express';
import { PublicController } from './public.controller.js';
import { OrderController } from '../orders/order.controller.js';

const router = Router();

// Public Unauthenticated Routes for Customers
router.get('/stores/:slug', PublicController.getPublicStore);
router.get('/stores/:slug/categories', PublicController.getPublicCategories);
router.get('/stores/:slug/catalog', PublicController.getPublicCatalog);
router.get('/stores/:slug/customer-orders/:phone', PublicController.getCustomerOrders);

// Customer Order Placement & Status Tracking Routes
router.post('/stores/:slug/orders', OrderController.createPublicOrder);
router.get('/orders/:id', OrderController.getOrderById);

export default router;