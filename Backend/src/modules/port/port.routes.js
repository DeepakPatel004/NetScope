import { Router } from 'express';
import { portController } from './port.controller.js';

const router = Router();

router.get('/', portController.getAllPorts);
router.get('/:deviceId', portController.getDevicePorts);
router.post('/check/:deviceId', portController.triggerScan);

export default router;