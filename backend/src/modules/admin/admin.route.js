import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

// Protected by SuperAdmin Authorization Guard
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'STORE_OWNER')); // Owners & Admins can access overview metrics

router.get('/metrics', AdminController.getMetrics);
router.get('/stores', AdminController.getStores);
router.patch('/stores/:id/status', AdminController.toggleStatus);

export default router;