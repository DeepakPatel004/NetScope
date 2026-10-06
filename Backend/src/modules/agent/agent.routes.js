import { Router } from 'express';
const router = Router();
router.use((_req, res) => res.status(410).json({ success: false, message: 'Host agents and CPU/RAM tracking have been removed. Use endpoint monitoring.' }));
export default router;
