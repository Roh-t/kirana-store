import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', CustomerController.createCustomer);
router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.patch('/:id/udhar', CustomerController.updateUdhar);

export default router;