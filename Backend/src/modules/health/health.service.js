import prisma from '../../config/database.js';

export const healthService = {

  async saveHealthLog(deviceId, checkResult) {
    return prisma.healthLog.create({
      data: {
        deviceId,
        status: checkResult.status,
        latency: checkResult.latency,
        responseCode: checkResult.responseCode,
        message: checkResult.message,
      },
    });
  },

  async getDeviceHealthHistory(deviceId, limit = 50) {
    return prisma.healthLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' }, // Newest first
      take: limit,
    });
  },
};