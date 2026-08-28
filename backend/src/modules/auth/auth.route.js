import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.me);
router.patch('/switch-store', authenticate, AuthController.switchStore);

export default router;