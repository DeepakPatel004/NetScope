import { tr } from "zod/v4/locales";
import { deviceService} from "./device.service.js";
import { deviceValidator } from "./device.validator.js";

const MOCK_USER_ID = '11111111-11';

export const deviceController = {
    async createDevice(req,res,next){

        try{
        const validation = deviceValidator.create.safeParse(req.body);
        if(!validation.success){
            return res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        }
        const device = await deviceService.createDevice(MOCK_USER_ID,validation.data);
        return res.status(201).json({
        success: true,
        message: 'Device created',
        data: device,
      });
    } catch (error) {
      next(error); 
    }
  },

  async getDeviceById(req, res, next) {
    try {
      const device = await deviceService.getDeviceById(MOCK_USER_ID, req.params.id);

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
   * PUT /api/v1/devices/:id
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

      const updatedDevice = await deviceService.updateDevice(
        MOCK_USER_ID,
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
      const devices = await deviceService.getDevices(MOCK_USER_ID);

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
   * DELETE /api/v1/devices/:id
   */
  async deleteDevice(req, res, next) {
    try {
      const deletedDevice = await deviceService.deleteDevice(MOCK_USER_ID, req.params.id);

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