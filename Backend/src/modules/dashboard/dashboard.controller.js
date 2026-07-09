import { dashboardService } from './dashboard.service.js';

// Global placeholder for local testing until auth middleware is built
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const dashboardController = {
  async getSummary(req, res, next) {
    try {
      const summary = await dashboardService.getSummary(MOCK_USER_ID);
      return res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  async getDevicesStatus(req, res, next) {
    try {
      const devices = await dashboardService.getDevicesStatus(MOCK_USER_ID);
      return res.status(200).json({ success: true, data: devices });
    } catch (error) {
      next(error);
    }
  },

  async getDeviceDetails(req, res, next) {
    try {
      const { id } = req.params;
      const details = await dashboardService.getDeviceDetails(id);
      
      if (!details) {
        return res.status(404).json({ success: false, message: 'Device not found' });
      }

      return res.status(200).json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  },
};