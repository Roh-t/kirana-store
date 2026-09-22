import { Router } from 'express';
import { PublicController } from './public.controller.js';
import { OrderController } from '../orders/order.controller.js';

const router = Router();

// Public Unauthenticated Routes for Customers
router.get('/stores/:slug', PublicController.getPublicStore);
router.get('/stores/:slug/categories', PublicController.getPublicCategories);
router.get('/stores/:slug/catalog/suggestions', PublicController.getPublicCatalogSuggestions);
router.get('/stores/:slug/catalog', PublicController.getPublicCatalog);
router.get('/stores/:slug/customer-orders/:phone', PublicController.getCustomerOrders);

// Customer Order Placement & Status Tracking Routes
router.post('/stores/:slug/orders', OrderController.createPublicOrder);
router.get('/orders/:id', OrderController.getOrderById);

// Customer manual UPI payment proof routes
router.get('/stores/:slug/orders/:orderId/upi-qr', PublicController.getOrderUpiQr);
router.post('/stores/:slug/orders/:orderId/payment-proof', PublicController.submitPaymentProof);

export default router;