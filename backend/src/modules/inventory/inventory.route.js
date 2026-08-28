import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/', InventoryController.getInventory);
router.post('/adjust', InventoryController.adjustStock);

// Standard explicit routes for transactions (Node 25 compatible)
router.get('/transactions', InventoryController.getTransactions);
router.get('/transactions/:productId', InventoryController.getTransactions);

export default router;