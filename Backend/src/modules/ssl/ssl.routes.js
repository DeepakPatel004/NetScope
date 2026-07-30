import { Router } from 'express';
import { sslController } from './ssl.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, sslController.getAllSSL);
router.get('/:deviceId', requireAuth, sslController.getDeviceSSL);
router.post('/check/:deviceId', requireAuth, sslController.triggerCheck);

export default router;