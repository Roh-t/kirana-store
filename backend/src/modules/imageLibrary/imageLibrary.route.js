import { Router } from 'express';
import { ImageLibraryController } from './imageLibrary.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/', ImageLibraryController.list);
router.post('/', authorize('SUPER_ADMIN'), ImageLibraryController.create);
router.delete('/:id', authorize('SUPER_ADMIN'), ImageLibraryController.remove);

export default router;
