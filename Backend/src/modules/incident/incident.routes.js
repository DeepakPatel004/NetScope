import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { incidentService } from './incident.service.js';

const router = Router();
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await incidentService.list(req.user.id, req.query.deviceId || null);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
export default router;
