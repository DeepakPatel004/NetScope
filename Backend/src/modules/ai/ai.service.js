import prisma from '../../config/database.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { reportService } from '../report/report.service.js';
import { buildFallbackSummary, buildInsightPrompt } from './prompt.builder.js';
import { aiClient } from '../../utils/aiClient.js';

const reportSnapshots = new Map();

function buildUnavailableAiResponse(fallback = null) {
  const defaultRecommendations = [
    'Verify the AI service configuration and API credentials.',
    'Retry once the model endpoint is available.',
  ];

  return {
    summary: 'AI is currently unavailable. The configured model could not be reached, so I cannot provide a live explanation right now.',
    recommendations: fallback?.recommendations?.length ? fallback.recommendations : defaultRecommendations,
  };
}

function isIncompleteAiFragment(text) {
  if (typeof text !== 'string') return true;

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return true;
  }

  if (/[.!?]$/.test(normalized)) {
    return false;
  }

  if (/,$/.test(normalized)) {
    return true;
  }

  return /\b(?:and|or|but|with|to|for|from|of|in|at|on|into|onto|under|over|through|during|because|as|when|while|if|then|so|after|before|until|unless|although|though|yet|however)\s*$/i.test(normalized);
}

function normalizeAiContent(text) {
  if (typeof text !== 'string') return '';

  let normalized = text
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const codeFenceMatch = normalized.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (codeFenceMatch) {
    normalized = codeFenceMatch[1].trim();
  }

  if (normalized.startsWith('{') && normalized.endsWith('}')) {
    try {
      const parsed = JSON.parse(normalized);
      if (typeof parsed?.summary === 'string') {
        return parsed.summary;
      }
    } catch {
      // Fallback to text cleanup if JSON parsing fails
    }
  }

  return normalized;
}

function sanitizeAiResponse(responsePayload, fallback) {
  if (!responsePayload || !responsePayload.summary) {
    return fallback;
  }

  const summary = normalizeAiContent(responsePayload.summary);
  const recommendations = Array.isArray(responsePayload.recommendations)
    ? responsePayload.recommendations.map(normalizeAiContent).filter(Boolean)
    : fallback.recommendations;

  return {
    summary,
    recommendations,
  };
}

async function getDeviceContext(userId, deviceId) {
  return prisma.device.findFirst({
    where: {
      id: deviceId,
      userId,
    },
  });
}

export const aiService = {
  async explainSsl(userId, deviceId, prompt = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const sslAudit = await prisma.sSLStatus.findFirst({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
    });

    const fallback = buildFallbackSummary('ssl', { device, ssl: sslAudit }, prompt);

    try {
      const aiResponse = await aiClient.generateContent(prompt, { kind: 'ssl', device, ssl: sslAudit });
      return sanitizeAiResponse(aiResponse, fallback);
    } catch (error) {
      return fallback;
    }
  },

  async explainPorts(userId, deviceId, prompt = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const portLog = await prisma.portScanLog.findFirst({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
    });

    const portScan = { openPorts: portLog ? portLog.openPorts : [], checkedAt: portLog?.checkedAt };
    const fallback = buildFallbackSummary('ports', { device, portScan }, prompt);

    try {
      const aiResponse = await aiClient.generateContent(prompt, { kind: 'ports', device, portScan });
      return sanitizeAiResponse(aiResponse, fallback);
    } catch (error) {
      return fallback;
    }
  },

  async explainHealth(userId, deviceId, prompt = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const healthHistory = await prisma.healthLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
      take: 20,
    });

    const analytics = await analyticsService.getDeviceMetrics(deviceId, 24);
    const fallback = buildFallbackSummary('health', { device, healthHistory, metrics: analytics }, prompt);

    try {
      const aiResponse = await aiClient.generateContent(prompt, { kind: 'health', device, healthHistory, metrics: analytics });
      return sanitizeAiResponse(aiResponse, fallback);
    } catch (error) {
      return fallback;
    }
  },

  async analyzeDevice(userId, deviceId, prompt = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const [healthHistory, sslAudit, portLog, analytics] = await Promise.all([
      prisma.healthLog.findMany({
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
        take: 20,
      }),
      prisma.sSLStatus.findFirst({
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
      }),
      prisma.portScanLog.findFirst({
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
      }),
      analyticsService.getDeviceMetrics(deviceId, 24),
    ]);

    const portScan = { openPorts: portLog ? portLog.openPorts : [], checkedAt: portLog?.checkedAt };
    const contextData = { device, healthLogs: healthHistory, ssl: sslAudit, portScan, metrics: analytics };
    const fallback = buildFallbackSummary('device', contextData, prompt);

    try {
      const aiResponse = await aiClient.generateContent(prompt, { kind: 'device', ...contextData });
      return sanitizeAiResponse(aiResponse, fallback);
    } catch (error) {
      return fallback;
    }
  },

  async explainReport(userId, reportId) {
    const reportData = await reportService.getReportData(userId, reportId);
    reportSnapshots.set(reportId, reportData);

    const fallback = buildFallbackSummary('report', reportData);
    try {
      const aiResponse = await aiClient.generateContent('Summarize executive SLA report', { kind: 'report', ...reportData });
      return sanitizeAiResponse(aiResponse, fallback);
    } catch (error) {
      return fallback;
    }
  },

  async getAnomalies(userId, deviceId = null) {
    const where = {
      device: { userId },
    };
    if (deviceId) {
      where.deviceId = deviceId;
    }

    return prisma.anomaly.findMany({
      where,
      include: {
        device: {
          select: { id: true, name: true, host: true, type: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
  },

  async getIncidents(userId) {
    return prisma.incident.findMany({
      where: {
        device: { userId },
        status: { in: ['OPEN', 'INVESTIGATING'] },
      },
      include: {
        device: {
          select: { id: true, name: true, host: true, type: true },
        },
      },
      orderBy: { priorityScore: 'desc' },
      take: 10,
    });
  },

  async triggerDeviceIncidentAnalysis(userId, deviceId) {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const healthLogs = await prisma.healthLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
      take: 20,
    });

    const chronLogs = [...healthLogs].reverse();
    const anomalyRes = await aiClient.detectAnomaly(device, chronLogs);

    const downCount = chronLogs.filter((h) => h.status === 'DOWN').length;
    const errorRate = chronLogs.length > 0 
      ? chronLogs.filter((h) => h.status === 'DOWN' || (h.responseCode && h.responseCode >= 400)).length / chronLogs.length 
      : 0.0;

    const priorityRes = await aiClient.prioritizeAlert(
      anomalyRes.severity,
      chronLogs.length,
      downCount,
      errorRate,
      downCount,
      device.name,
      anomalyRes.anomaly_score
    );

    const llmAnalysis = await aiClient.analyzeIncident(
      device,
      anomalyRes.anomaly_score,
      priorityRes.priority,
      anomalyRes.detection_reason,
      chronLogs.slice(-10),
      anomalyRes.metrics_evaluated
    );

    return {
      device,
      anomaly: anomalyRes,
      priority: priorityRes,
      analysis: llmAnalysis,
    };
  },

  async generateDeviceTimelineSummary(userId, deviceId) {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const logs = await prisma.healthLog.findMany({
      where: { deviceId },
      orderBy: { checkedAt: 'asc' },
      take: 40,
    });

    const startTime = logs.length > 0 ? logs[0].checkedAt?.toISOString() : null;
    const endTime = logs.length > 0 ? logs[logs.length - 1].checkedAt?.toISOString() : null;

    return aiClient.summarizeTimeline(device.name, logs, startTime, endTime);
  },

  async generatePlaybook(userId, deviceId, payload = {}) {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    return aiClient.generatePlaybook(
      device.name,
      device.host,
      device.type,
      payload.summary || `Incident degradation observed on ${device.name}`,
      payload.possibleCauses || ['Latency elevation', 'Socket connection timeout']
    );
  },
};
