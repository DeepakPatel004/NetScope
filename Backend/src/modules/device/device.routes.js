import express from 'express'
import { deviceController } from './device.controller.js';

const router = express.Router();

// Create a device
// POST /api/v1/devices
router.post('/', deviceController.createDevice);

// Get all devices
// GET /api/v1/devices
router.get('/', deviceController.getDevices);

// Get a single device
// GET /api/v1/devices/:id
router.get('/:id', deviceController.getDeviceById);

// Update a device
// PUT /api/v1/devices/:id
router.put('/:id', deviceController.updateDevice);

// Delete a device
// DELETE /api/v1/devices/:id
router.delete('/:id', deviceController.deleteDevice);

export default router;