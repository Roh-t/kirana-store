import { Router } from 'express';
import { MasterCatalogController } from './masterCatalog.controller.js';

const router = Router();

// Master catalog suggestions contain only public product metadata and are
// needed while the authenticated product form is being filled.
router.get('/products', MasterCatalogController.searchProducts);

export default router;
