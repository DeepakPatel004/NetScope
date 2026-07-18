import { PrismaClient } from '@prisma/client';
import { sslService } from './ssl.service.js';

const prisma = new PrismaClient();
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const sslController = {
  async getAllSSL(req, res, next) {
    try {
      const devices = await prisma.device.findMany({
        where: { 
          userId: MOCK_USER_ID,
          type: { not: 'IP' }
        },
        include: {
          sslLogs: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
          },
        },
      });

      const sslData = devices.map(device => {
        const latestLog = device.sslLogs[0];
        return {
          deviceId: device.id,
          name: device.name,
          host: device.host,
          ssl: latestLog || null
        };
      });

      return res.status(200).json({ success: true, data: sslData });
    } catch (error) {
      next(error);
    }
  },

  async getDeviceSSL(req, res, next) {
    try {
      const { deviceId } = req.params;
      
      const logs = await prisma.sSLStatus.findMany({
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
        take: 30,
      });

      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },

  async triggerCheck(req, res, next) {
    try {
      const { deviceId } = req.params;

      const device = await prisma.device.findUnique({
        where: { id: deviceId }
      });

      if (!device) {
        return res.status(404).json({ success: false, message: 'Device not found' });
      }

      const sslData = await sslService.fetchCertificate(device.host);
      const savedLog = await sslService.saveSSLStatus(device.id, sslData);

      return res.status(200).json({ success: true, data: savedLog });
    } catch (error) {
      next(error);
    }
  }
};