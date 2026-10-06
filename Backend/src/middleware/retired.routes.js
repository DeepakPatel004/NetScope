import { Router } from 'express';

const router = Router();
router.use((_req, res) => res.status(410).json({
  success: false,
  message: 'This legacy feature has been retired. Use distributed probe checks and recorded incident evidence.',
}));
export default router;
