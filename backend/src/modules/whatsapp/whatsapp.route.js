import { Router } from 'express';
import { WhatsAppController } from './whatsapp.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/order-link/:orderId', WhatsAppController.getOrderWhatsAppLink);
router.get('/udhar-link/:customerId', WhatsAppController.getUdharWhatsAppLink);

export default router;