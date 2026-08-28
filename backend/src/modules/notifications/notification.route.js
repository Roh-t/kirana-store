import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/', NotificationController.getNotifications);
router.post('/', NotificationController.createNotification);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;