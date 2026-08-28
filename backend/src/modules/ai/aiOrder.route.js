import { Router } from 'express';
import { AiOrderController } from './aiOrder.controller.js';

const router = Router();

// Public route for customer/shopkeeper voice order parsing
router.post('/parse-order', AiOrderController.parseOrder);

export default router;