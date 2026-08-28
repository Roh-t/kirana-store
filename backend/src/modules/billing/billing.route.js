import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/generate', BillingController.generateInvoice);
router.get('/invoices', BillingController.getInvoices);
router.get('/invoices/:id', BillingController.getInvoiceById);

export default router;