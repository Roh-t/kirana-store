import { Router } from 'express';
import { StoreController } from './store.controller.js';
import { StaffController } from './staff.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

// Public route for customer storefront lookup
router.get('/public/:slug', StoreController.getPublicStoreBySlug);

// Authenticated store management routes
router.use(authenticate);
router.post('/', StoreController.createStore);
router.get('/mine', StoreController.getMyStores);
router.get('/:id', StoreController.getStoreById);
router.patch('/:id', StoreController.updateStore);

// Staff Sub-Routes
router.get('/:id/staff', tenantContext, StaffController.getStaff);
router.post('/:id/staff', tenantContext, StaffController.addStaff);
router.delete('/:id/staff/:staffUserId', tenantContext, StaffController.removeStaff);

export default router;