import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const dashboardService = {
  /**
   * Calculates the overall summary metrics for the dashboard
   */
  async getSummary(userId) {
    const devices = await prisma.device.findMany({
      where: { userId },
      include: {
        healthLogs: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });

    const totalDevices = devices.length;
    let onlineCount = 0;
    let offlineCount = 0;
    let totalLatency = 0;
    let logsWithLatencyCount = 0;

    devices.forEach((device) => {
      const latestLog = device.healthLogs[0];
      
      // Determine online status based on latest health log or fallback to device default status
      const isOnline = latestLog ? latestLog.status === 'UP' : device.status === 'ONLINE';
      if (isOnline) {
        onlineCount++;
      } else {
        offlineCount++;
      }

      if (latestLog && latestLog.latency !== null && latestLog.latency > 0) {
        totalLatency += latestLog.latency;
        logsWithLatencyCount++;
      }
    });

    const averageLatency = logsWithLatencyCount > 0 ? Math.round(totalLatency / logsWithLatencyCount) : 0;

    return {
      totalDevices,
      online: onlineCount,
      offline: offlineCount,
      averageLatency,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Returns the current status of all devices with their single latest log mapped cleanly
   */
  async getDevicesStatus(userId) {
    const devices = await prisma.device.findMany({
      where: { userId },
      include: {
        healthLogs: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((device) => {
      const latestLog = device.healthLogs[0];
      return {
        id: device.id,
        name: device.name,
        host: device.host,
        type: device.type,
        status: latestLog ? latestLog.status : 'UNKNOWN',
        latency: latestLog ? latestLog.latency : null,
        lastChecked: latestLog ? latestLog.checkedAt : device.updatedAt,
      };
    });
  },

  /**
   * Returns details for a specific device, along with uptime % and its recent 50 logs for the timeline
   */
  async getDeviceDetails(deviceId) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) return null;

    // Fetch last 50 logs for the timeline visualization
    const recentLogs = await prisma.healthLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
      take: 50,
    });

    // Calculate Uptime Percentage based on the retrieved logs
    const totalLogs = recentLogs.length;
    const upLogs = recentLogs.filter(log => log.status === 'UP').length;
    const uptimePercentage = totalLogs > 0 ? Math.round((upLogs / totalLogs) * 100) : 100;

    // Calculate average latency for this specific device
    const logsWithLatency = recentLogs.filter(log => log.latency !== null && log.latency > 0);
    const avgLatency = logsWithLatency.length > 0 
      ? Math.round(logsWithLatency.reduce((acc, log) => acc + log.latency, 0) / logsWithLatency.length)
      : 0;

    // Locate the last time the server responded successfully (Last Seen)
    const lastSuccessfulLog = recentLogs.find(log => log.status === 'UP');

    return {
      deviceInfo: {
        id: device.id,
        name: device.name,
        host: device.host,
        type: device.type,
        interval: device.interval,
        createdAt: device.createdAt,
      },
      analytics: {
        uptimePercentage,
        averageLatency: avgLatency,
        lastSeen: lastSuccessfulLog ? lastSuccessfulLog.checkedAt : null,
      },
      timeline: recentLogs.map(log => ({
        id: log.id,
        status: log.status,
        latency: log.latency,
        checkedAt: log.checkedAt,
        errorMessage: log.errorMessage,
      })),
    };
  },
};