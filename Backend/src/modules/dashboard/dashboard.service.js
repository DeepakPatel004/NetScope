import prisma from '../../config/database.js';

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
      const isOnline = latestLog?.status === 'UP';
      
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
        interval: device.interval,
        enabled: device.enabled,
      };
    });
  },

  /**
   * Returns details for a specific device with recent logs
   */
  async getDeviceDetails(userId, deviceId) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) return null;

    const recentLogs = await prisma.healthLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
      take: 50,
    });

    const recentProbeResults = await prisma.checkResult.findMany({
      where: { monitorId: deviceId },
      orderBy: { observedAt: 'desc' },
      take: 50,
      include: {
        probe: {
          select: { id: true, name: true, region: true },
        },
      },
    });

    const totalLogs = recentLogs.length;
    const upLogs = recentLogs.filter(log => log.status === 'UP').length;
    const uptimePercentage = totalLogs > 0 ? Math.round((upLogs / totalLogs) * 100) : 100;

    const logsWithLatency = recentLogs.filter(log => log.latency !== null && log.latency > 0);
    const avgLatency = logsWithLatency.length > 0 
      ? Math.round(logsWithLatency.reduce((acc, log) => acc + log.latency, 0) / logsWithLatency.length)
      : 0;

    const lastSuccessfulLog = recentLogs.find(log => log.status === 'UP');

    // Group latest check by probe location
    const latestByProbe = {};
    for (const r of recentProbeResults) {
      if (!latestByProbe[r.probeId]) {
        latestByProbe[r.probeId] = {
          probeId: r.probeId,
          probeName: r.probe?.name,
          region: r.probe?.region,
          status: r.status,
          latency: r.latency,
          dnsTime: r.dnsTime,
          tcpTime: r.tcpTime,
          tlsTime: r.tlsTime,
          ttfbTime: r.ttfbTime,
          failureStage: r.failureStage,
          message: r.message,
          tlsCert: r.tlsCert,
          resolvedIp: r.resolvedIp,
          observedAt: r.observedAt,
        };
      }
    }

    return {
      deviceInfo: {
        id: device.id,
        name: device.name,
        host: device.host,
        type: device.type,
        interval: device.interval,
        selectedProbes: device.selectedProbes,
        timeoutMs: device.timeoutMs,
        baselineLatency: device.baselineLatency,
        createdAt: device.createdAt,
      },
      analytics: {
        uptimePercentage,
        averageLatency: avgLatency,
        lastSeen: lastSuccessfulLog ? lastSuccessfulLog.checkedAt : null,
      },
      probeMatrix: Object.values(latestByProbe),
      locationResults: recentProbeResults.map(r => ({
        id: r.id,
        probeId: r.probeId,
        probeName: r.probe?.name,
        region: r.probe?.region,
        status: r.status,
        latency: r.latency,
        dnsTime: r.dnsTime || 0,
        tcpTime: r.tcpTime || 0,
        tlsTime: r.tlsTime || 0,
        ttfbTime: r.ttfbTime || 0,
        responseCode: r.responseCode,
        failureStage: r.failureStage,
        message: r.message,
        resolvedIp: r.resolvedIp,
        tlsCert: r.tlsCert,
        observedAt: r.observedAt,
      })),
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
