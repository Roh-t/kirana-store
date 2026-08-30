import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/queue', OrderController.getOrderQueue);
router.get('/:id', OrderController.getOrderById);
router.patch('/:id/status', OrderController.updateOrderStatus);

// Add route in backend/src/modules/orders/order.route.js

router.patch('/:id/items', OrderController.modifyOrderItems);

export default router;