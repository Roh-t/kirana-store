import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { tenantContext } from '../../middlewares/tenantContext.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', ProductController.createProduct);
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.patch('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

export default router;