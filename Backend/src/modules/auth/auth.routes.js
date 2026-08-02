import express from 'express';
import { authController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/profile', requireAuth, authController.profile);
router.post('/change-password', requireAuth, authController.changePassword);

export default router;
