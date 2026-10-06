import express from 'express';
import { authController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import prisma from '../../config/database.js';
import { z } from 'zod';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/profile', requireAuth, authController.profile);
router.put('/profile', requireAuth, async (req, res, next) => {
  const parsed = z.object({ fullName: z.string().trim().min(1).max(100), username: z.string().trim().min(1).max(100), email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: parsed.data, select: { id: true, fullName: true, username: true, email: true, role: true } });
    res.json({ success: true, data: user });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'That username or email is already in use.' });
    next(error);
  }
});
router.post('/change-password', requireAuth, authController.changePassword);

export default router;
