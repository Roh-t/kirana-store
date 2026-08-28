import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', PaymentController.recordPayment);
router.get('/upi-qr/:orderId', PaymentController.getUpiQrPayload);
router.get('/order/:orderId', PaymentController.getPaymentsByOrder);

export default router;