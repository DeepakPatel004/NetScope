import { Router } from 'express';
import { portController } from './port.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, portController.getAllPorts);
router.get('/:deviceId', requireAuth, portController.getDevicePorts);
router.post('/check/:deviceId', requireAuth, portController.triggerScan);

export default router;