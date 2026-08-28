import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/', AuditController.getAuditLogs);

export default router;