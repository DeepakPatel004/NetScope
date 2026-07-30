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
        sslLogs: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
        portScanLogs: {
          orderBy: { checkedAt: 'desc' },
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
      const uptimePercentage = uptimeLogs > 0 ? Math.round((onlineLogs / uptimeLogs) * 100) : 100;
      const averageLatency = logsWithLatency.length > 0
        ? Math.round(logsWithLatency.reduce((sum, log) => sum + log.latency, 0) / logsWithLatency.length)
        : 0;
      const latestSSL = device.sslLogs[0] || null;
      const latestPortScan = device.portScanLogs[0] || null;

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
        sslStatus: latestSSL ? latestSSL.status : 'UNKNOWN',
        sslDaysRemaining: latestSSL ? latestSSL.daysRemaining : null,
        sslValidTo: latestSSL ? latestSSL.validTo : null,
        sslCheckedAt: latestSSL ? latestSSL.checkedAt : null,
        openPorts: latestPortScan ? latestPortScan.openPorts : [],
        portScanCheckedAt: latestPortScan ? latestPortScan.checkedAt : null,
      };
    });

    const totalDevices = deviceReports.length;
    const onlineDevices = deviceReports.filter((device) => device.availability === 'UP').length;
    const offlineDevices = deviceReports.filter((device) => device.availability === 'DOWN').length;
    const unknownDevices = totalDevices - onlineDevices - offlineDevices;
    const averageLatency = deviceReports.length > 0
      ? Math.round(deviceReports.reduce((sum, device) => sum + device.averageLatency, 0) / deviceReports.length)
      : 0;
    const overallUptime = deviceReports.length > 0
      ? Math.round(deviceReports.reduce((sum, device) => sum + device.uptimePercentage, 0) / deviceReports.length)
      : 100;

    const sslSummary = deviceReports.reduce((summary, device) => {
      const status = device.sslStatus || 'UNKNOWN';
      summary[status] = (summary[status] || 0) + 1;
      if (device.sslStatus === 'VALID' && device.sslDaysRemaining !== null && device.sslDaysRemaining <= 30) {
        summary.EXPIRING = (summary.EXPIRING || 0) + 1;
      }
      return summary;
    }, {});

    const portSummary = {
      totalDevicesScanned: deviceReports.filter((device) => device.openPorts.length > 0).length,
      totalOpenPortsSeen: deviceReports.reduce((sum, device) => sum + device.openPorts.length, 0),
      openPortFrequency: {},
    };

    deviceReports.forEach((device) => {
      device.openPorts.forEach((port) => {
        portSummary.openPortFrequency[port] = (portSummary.openPortFrequency[port] || 0) + 1;
      });
    });

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
        portSummary,
        generatedAt: new Date().toISOString(),
      },
      devices: deviceReports,
    };
  },
};
