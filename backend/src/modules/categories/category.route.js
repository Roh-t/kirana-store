import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

// Protect all category routes with Auth and Tenant Context Middleware
router.use(authenticate);
router.use(tenantContext);

router.post('/', CategoryController.createCategory);
router.get('/', CategoryController.getCategories);
router.get('/:id', CategoryController.getCategoryById);
router.patch('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export default router;