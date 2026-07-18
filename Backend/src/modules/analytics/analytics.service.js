import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsService = {
  /**
   * Calculates the core metrics for a single device over a given time window (default 24h)
   */
  async getDeviceMetrics(deviceId, hoursAgo = 24) {
    const timeWindow = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // 1. Crunch the Latency Numbers
    const latencyStats = await prisma.healthLog.aggregate({
      where: {
        deviceId,
        checkedAt: { gte: timeWindow },
        status: 'UP', // Only calculate latency for successful pings
      },
      _avg: { latency: true },
      _max: { latency: true },
      _count: { id: true }, // Total successful checks
    });

    // 2. Count the Total Checks (including DOWN) to calculate Uptime %
    const totalChecks = await prisma.healthLog.count({
      where: {
        deviceId,
        checkedAt: { gte: timeWindow },
      },
    });

    const successfulChecks = latencyStats._count.id;
    
    // Calculate Uptime Percentage
    let uptimePercentage = 0;
    if (totalChecks > 0) {
      uptimePercentage = ((successfulChecks / totalChecks) * 100).toFixed(2);
    }

    return {
      avgLatency: latencyStats._avg.latency ? Math.round(latencyStats._avg.latency) : 0,
      maxLatency: latencyStats._max.latency || 0,
      uptimePercentage: parseFloat(uptimePercentage),
      totalChecks,
      successfulChecks
    };
  }
};
