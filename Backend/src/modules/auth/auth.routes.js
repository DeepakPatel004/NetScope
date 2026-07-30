import express from 'express';
import { authController } from './auth.controller.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/profile', authController.profile);
router.post('/change-password', authController.changePassword);

export default router;
