import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { MasterCatalogController } from './masterCatalog.controller.js';

const router = Router();

router.use(authenticate);
router.get('/products', MasterCatalogController.searchProducts);

export default router;
