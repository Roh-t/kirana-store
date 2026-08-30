import { Router } from 'express';
import express from 'express';
import { RazorpayController } from './razorpay.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

// Webhook Route (Public + Raw Body for Signature Verification)
router.post('/webhook', express.raw({ type: 'application/json' }), RazorpayController.handleWebhook);

// Authenticated Subscription Payment Routes
router.post('/create-subscription-order', authenticate, tenantContext, RazorpayController.createOrder);
router.post('/verify-subscription-payment', authenticate, tenantContext, RazorpayController.verifyPayment);

export default router;