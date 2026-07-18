import { PrismaClient } from '@prisma/client';
import { portService } from './port.service.js';

const prisma = new PrismaClient();
// Global placeholder for local testing
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const portController = {
  /**
   * Get the latest port scan results for all devices belonging to the user
   */
  async getAllPorts(req, res, next) {
    try {
      const devices = await prisma.device.findMany({
        where: { userId: MOCK_USER_ID },
        include: {
          portScanLogs: {
            orderBy: { checkedAt: 'desc' },
            take: 1, // Only get the most recent scan
          },
        },
      });

      const portData = devices.map(device => {
        const latestLog = device.portScanLogs[0];
        return {
          deviceId: device.id,
          name: device.name,
          host: device.host,
          openPorts: latestLog ? latestLog.openPorts : [],
          lastChecked: latestLog ? latestLog.checkedAt : null
        };
      });

      return res.status(200).json({ success: true, data: portData });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get the history of port scans for a specific device
   */
  async getDevicePorts(req, res, next) {
    try {
      const { deviceId } = req.params;
      
      const logs = await prisma.portScanLog.findMany({
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
        take: 30, // Get the last 30 scans for timeline view
      });

      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manually trigger an immediate port scan
   */
  async triggerScan(req, res, next) {
    try {
      const { deviceId } = req.params;

      const device = await prisma.device.findUnique({
        where: { id: deviceId }
      });

      if (!device) {
        return res.status(404).json({ success: false, message: 'Device not found' });
      }

      // Run the scan synchronously
      const openPorts = await portService.scanHost(device.host);
      const savedLog = await portService.saveScanResult(device.id, openPorts);

      return res.status(200).json({ success: true, data: savedLog });
    } catch (error) {
      next(error);
    }
  }
};