import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/dashboard', AnalyticsController.getDashboardMetrics);

export default router;