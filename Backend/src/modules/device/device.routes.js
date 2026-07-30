import express from 'express'
import { deviceController } from './device.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Create a device
// POST /api/v3/devices
router.post('/', requireAuth, deviceController.createDevice);

// Get all devices
// GET /api/v3/devices
router.get('/', requireAuth, deviceController.getDevices);

// Get a single device
// GET /api/v3/devices/:id
router.get('/:id', requireAuth, deviceController.getDeviceById);

// Update a device
// PUT /api/v3/devices/:id
router.put('/:id', requireAuth, deviceController.updateDevice);

// Delete a device
// DELETE /api/v3/devices/:id
router.delete('/:id', requireAuth, deviceController.deleteDevice);

export default router;