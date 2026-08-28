import { Router } from 'express';
import { SubscriptionController } from './subscription.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/', SubscriptionController.getSubscription);
router.patch('/upgrade', SubscriptionController.upgradePlan);

export default router;