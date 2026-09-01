import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

// Platform administration is restricted to Super Admins.
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/metrics', AdminController.getMetrics);
router.get('/stores', AdminController.getStores);
router.patch('/stores/:id/status', AdminController.toggleStatus);

export default router;