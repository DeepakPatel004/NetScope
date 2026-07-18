import { Router } from 'express';
import { sslController } from './ssl.controller.js';

const router = Router();

router.get('/', sslController.getAllSSL);
router.get('/:deviceId', sslController.getDeviceSSL);
router.post('/check/:deviceId', sslController.triggerCheck);

export default router;