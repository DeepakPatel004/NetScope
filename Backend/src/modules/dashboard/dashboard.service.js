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
        agentMetrics: {
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
    let connectedAgents = 0;
    let totalAgents = 0;

    devices.forEach((device) => {
      const latestLog = device.healthLogs[0];
      const isOnline = latestLog ? latestLog.status === 'UP' : (device.status === 'UP' || device.agentStatus === 'ONLINE');
      
      if (isOnline) {
        onlineCount++;
      } else {
        offlineCount++;
      }

      if (latestLog && latestLog.latency !== null && latestLog.latency > 0) {
        totalLatency += latestLog.latency;
        logsWithLatencyCount++;
      }

      if (device.type === 'SERVER' || device.agentKey) {
        totalAgents++;
        if (device.agentStatus === 'ONLINE') {
          connectedAgents++;
        }
      }
    });

    const averageLatency = logsWithLatencyCount > 0 ? Math.round(totalLatency / logsWithLatencyCount) : 0;

    return {
      totalDevices,
      online: onlineCount,
      offline: offlineCount,
      averageLatency,
      connectedAgents,
      totalAgents,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Returns current status of all devices mapped with agentStatus, latest log, and cpuPercent
   */
  async getDevicesStatus(userId) {
    const devices = await prisma.device.findMany({
      where: { userId },
      include: {
        healthLogs: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
        agentMetrics: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((device) => {
      const latestLog = device.healthLogs[0];
      const latestAgentMetric = device.agentMetrics[0];

      return {
        id: device.id,
        name: device.name,
        host: device.host,
        type: device.type,
        agentKey: device.agentKey,
        agentStatus: device.agentStatus || 'NOT_CONNECTED',
        lastSeen: device.lastSeen,
        cpuPercent: latestAgentMetric?.cpuPercent ?? null,
        ramPercent: latestAgentMetric?.ramPercent ?? null,
        diskPercent: latestAgentMetric?.diskPercent ?? null,
        status: latestLog ? latestLog.status : (device.agentStatus === 'ONLINE' ? 'UP' : 'UNKNOWN'),
        latency: latestLog ? latestLog.latency : null,
        lastChecked: latestLog ? latestLog.checkedAt : device.updatedAt,
        interval: device.interval,
        enabled: device.enabled,
      };
    });
  },

  /**
   * Returns details for a specific device with recent logs
   */
  async getDeviceDetails(deviceId) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        recoveryPolicy: true,
      },
    });

    if (!device) return null;

    const recentLogs = await prisma.healthLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
      take: 50,
    });

    const totalLogs = recentLogs.length;
    const upLogs = recentLogs.filter(log => log.status === 'UP').length;
    const uptimePercentage = totalLogs > 0 ? Math.round((upLogs / totalLogs) * 100) : 100;

    const logsWithLatency = recentLogs.filter(log => log.latency !== null && log.latency > 0);
    const avgLatency = logsWithLatency.length > 0 
      ? Math.round(logsWithLatency.reduce((acc, log) => acc + log.latency, 0) / logsWithLatency.length)
      : 0;

    const lastSuccessfulLog = recentLogs.find(log => log.status === 'UP');

    return {
      deviceInfo: {
        id: device.id,
        name: device.name,
        host: device.host,
        type: device.type,
        agentKey: device.agentKey,
        agentStatus: device.agentStatus,
        interval: device.interval,
        createdAt: device.createdAt,
      },
      analytics: {
        uptimePercentage,
        averageLatency: avgLatency,
        lastSeen: lastSuccessfulLog ? lastSuccessfulLog.checkedAt : device.lastSeen,
      },
      timeline: recentLogs.map(log => ({
        id: log.id,
        status: log.status,
        latency: log.latency,
        dnsTime: log.dnsTime || 0,
        tcpTime: log.tcpTime || 0,
        tlsTime: log.tlsTime || 0,
        ttfbTime: log.ttfbTime || 0,
        checkedAt: log.checkedAt,
        errorMessage: log.message,
      })),
    };
  },
};