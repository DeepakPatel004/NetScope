import { reportService } from './report.service.js';
import PDFDocument from 'pdfkit';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const buildCsv = (reportData) => {
  const lines = [];
  const { summary, devices } = reportData;

  lines.push('Report Name,NetScope Monitoring Report');
  lines.push(`Generated At,${formatDate(summary.generatedAt)}`);
  lines.push(`Total Devices,${summary.totalDevices}`);
  lines.push(`Overall Uptime %,${summary.overallUptime}`);
  lines.push(`Average Latency (ms),${summary.averageLatency}`);
  lines.push(`Online Devices,${summary.availability.online}`);
  lines.push(`Offline Devices,${summary.availability.offline}`);
  lines.push(`Unknown Devices,${summary.availability.unknown}`);
  lines.push(`SSL Valid,${summary.sslSummary.VALID || 0}`);
  lines.push(`SSL Expiring,${summary.sslSummary.EXPIRING || 0}`);
  lines.push(`SSL Expired,${summary.sslSummary.EXPIRED || 0}`);
  lines.push(`SSL Invalid,${summary.sslSummary.INVALID || 0}`);
  lines.push(`Total Open Ports Seen,${summary.portSummary.totalOpenPortsSeen}`);
  lines.push('');

  lines.push('Device ID,Name,Host,Type,Enabled,Availability,Uptime %,Average Latency (ms),Last Checked,SSL Status,SSL Days Remaining,Open Ports');
  devices.forEach((device) => {
    lines.push([
      device.deviceId,
      device.name,
      device.host,
      device.type,
      device.enabled ? 'YES' : 'NO',
      device.availability,
      device.uptimePercentage,
      device.averageLatency,
      formatDate(device.lastChecked),
      device.sslStatus,
      device.sslDaysRemaining ?? 'N/A',
      `"${device.openPorts.join(', ')}"`,
    ].join(','));
  });

  return lines.join('\n');
};

const generatePdf = (reportData, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="netscope-report.pdf"');
  doc.pipe(res);

  const { summary, devices } = reportData;
  doc.fontSize(20).text('NetScope Monitoring Report', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('gray').text(`Generated: ${formatDate(summary.generatedAt)}`);
  doc.moveDown();

  doc.fontSize(12).fillColor('black').text('Summary', { underline: true });
  doc.moveDown(0.25);
  doc.fontSize(10);
  doc.text(`Total devices: ${summary.totalDevices}`);
  doc.text(`Overall uptime %: ${summary.overallUptime}`);
  doc.text(`Average latency: ${summary.averageLatency} ms`);
  doc.text(`Online devices: ${summary.availability.online}`);
  doc.text(`Offline devices: ${summary.availability.offline}`);
  doc.text(`Unknown devices: ${summary.availability.unknown}`);
  doc.text(`SSL valid: ${summary.sslSummary.VALID || 0}`);
  doc.text(`SSL expiring: ${summary.sslSummary.EXPIRING || 0}`);
  doc.text(`SSL expired: ${summary.sslSummary.EXPIRED || 0}`);
  doc.text(`SSL invalid: ${summary.sslSummary.INVALID || 0}`);
  doc.text(`Total open ports seen: ${summary.portSummary.totalOpenPortsSeen}`);
  doc.moveDown();

  doc.fontSize(12).text('Devices', { underline: true });
  doc.moveDown(0.25);
  doc.fontSize(9);

  devices.forEach((device) => {
    doc.text(`Name: ${device.name} (${device.type})`);
    doc.text(`Host: ${device.host}`);
    doc.text(`Enabled: ${device.enabled ? 'Yes' : 'No'} | Availability: ${device.availability} | Uptime: ${device.uptimePercentage}%`);
    doc.text(`Avg latency: ${device.averageLatency} ms | Last checked: ${formatDate(device.lastChecked)}`);
    doc.text(`SSL: ${device.sslStatus} | Days remaining: ${device.sslDaysRemaining ?? 'N/A'}`);
    doc.text(`Open ports: ${device.openPorts.join(', ') || 'None'}`);
    doc.moveDown(0.5);
  });

  doc.end();
};

export const reportController = {
  async getReportCsv(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const reportData = await reportService.getReportData(userId);
      const csvText = buildCsv(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="netscope-report.csv"');
      return res.send(csvText);
    } catch (error) {
      next(error);
    }
  },

  async getReportPdf(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const reportData = await reportService.getReportData(userId);
      return generatePdf(reportData, res);
    } catch (error) {
      next(error);
    }
  },
};
