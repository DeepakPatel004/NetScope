import prisma from '../../config/database.js';

export const reportService = {
  async getReportData(userId) {
    const devices = await prisma.device.findMany({
      where: { userId },
      include: {
        healthLogs: {
          orderBy: { checkedAt: 'desc' },
          take: 50,
        },
        checkResults: {
          where: { kind: { not: 'CONTROL_CHECK' }, isLate: false },
          orderBy: { observedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const deviceReports = devices.map((device) => {
      const latestHealthLog = device.healthLogs[0] || null;
      const logsWithLatency = device.healthLogs.filter((log) => log.latency !== null && log.latency > 0);
      const uptimeLogs = device.healthLogs.length;
      const onlineLogs = device.healthLogs.filter((log) => log.status === 'UP').length;
      const uptimePercentage = uptimeLogs > 0 ? Math.round((onlineLogs / uptimeLogs) * 100) : null;
      const averageLatency = logsWithLatency.length > 0
        ? Math.round(logsWithLatency.reduce((sum, log) => sum + log.latency, 0) / logsWithLatency.length)
        : 0;
      const latestResult = device.checkResults[0];
      const cert = latestResult?.tlsCert;
      const tlsStatus = !cert ? 'UNKNOWN' : cert.authorized === false ? 'INVALID'
        : cert.daysRemaining < 0 ? 'EXPIRED' : cert.daysRemaining <= 30 ? 'EXPIRING'
        : cert.authorized === true ? 'VALID' : 'UNKNOWN';

      return {
        deviceId: device.id,
        name: device.name,
        host: device.host,
        type: device.type,
        interval: device.interval,
        enabled: device.enabled,
        availability: latestHealthLog ? latestHealthLog.status : 'UNKNOWN',
        lastChecked: latestHealthLog ? latestHealthLog.checkedAt : null,
        uptimePercentage,
        averageLatency,
        latestLatency: latestHealthLog ? latestHealthLog.latency : null,
        latestStatusMessage: latestHealthLog ? latestHealthLog.message : null,
        sslStatus: tlsStatus,
        sslDaysRemaining: cert?.daysRemaining ?? null,
        sslValidTo: cert?.validTo ?? null,
        sslCheckedAt: cert ? latestResult.observedAt : null,
      };
    });

    const totalDevices = deviceReports.length;
    const onlineDevices = deviceReports.filter((device) => device.availability === 'UP').length;
    const offlineDevices = deviceReports.filter((device) => device.availability === 'DOWN').length;
    const unknownDevices = totalDevices - onlineDevices - offlineDevices;
    const averageLatency = deviceReports.length > 0
      ? Math.round(deviceReports.reduce((sum, device) => sum + device.averageLatency, 0) / deviceReports.length)
      : 0;
    const measuredDevices = deviceReports.filter(device => device.uptimePercentage !== null);
    const overallUptime = measuredDevices.length > 0
      ? Math.round(measuredDevices.reduce((sum, device) => sum + device.uptimePercentage, 0) / measuredDevices.length)
      : null;

    const sslSummary = deviceReports.reduce((summary, device) => {
      const status = device.sslStatus || 'UNKNOWN';
      summary[status] = (summary[status] || 0) + 1;
      if (device.sslStatus === 'VALID' && device.sslDaysRemaining !== null && device.sslDaysRemaining <= 30) {
        summary.EXPIRING = (summary.EXPIRING || 0) + 1;
      }
      return summary;
    }, {});

    const devicesByHealth = {
      online: onlineDevices,
      offline: offlineDevices,
      unknown: unknownDevices,
    };

    return {
      summary: {
        totalDevices,
        availability: devicesByHealth,
        averageLatency,
        overallUptime,
        sslSummary,
        generatedAt: new Date().toISOString(),
      },
      devices: deviceReports,
    };
  },
};
