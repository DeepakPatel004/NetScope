import { tr } from "zod/v4/locales";
import { deviceService} from "./device.service.js";
import { deviceValidator } from "./device.validator.js";


export const deviceController = {
    async createDevice(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const device = await deviceService.createDevice(userId, req.body);
      return res.status(201).json({ success: true, data: device });
    } catch (error) {
      console.error(error);
      const errorMessage = error?.details?.[0]?.message || error?.message || 'Server Error';
      return res.status(400).json({ success: false, message: errorMessage });
    }
  },

  async getDeviceById(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const device = await deviceService.getDeviceById(userId, req.params.id);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a device
   * PUT /api/v3/devices/:id
   */
  async updateDevice(req, res, next) {
    try {
      const validation = deviceValidator.update.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
      }

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const updatedDevice = await deviceService.updateDevice(
        userId,
        req.params.id,
        validation.data
      );

      if (!updatedDevice) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Device updated',
        data: updatedDevice,
      });
    } catch (error) {
      next(error);
    }
  },
  async getDevices(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const devices = await deviceService.getDevices(userId);

      return res.status(200).json({
        success: true,
        data: devices,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a device
   * DELETE /api/v3/devices/:id
   */
  async deleteDevice(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const deletedDevice = await deviceService.deleteDevice(userId, req.params.id);

      if (!deletedDevice) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Device deleted',
      });
    } catch (error) {
      next(error);
    }
  },
};