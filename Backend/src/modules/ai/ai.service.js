import prisma from '../../config/database.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { reportService } from '../report/report.service.js';
import { buildFallbackSummary, buildInsightPrompt } from './prompt.builder.js';

const reportSnapshots = new Map();

function buildResponse(kind, payload, fallback) {
  return {
    summary: payload?.summary || fallback.summary,
    recommendations: payload?.recommendations || fallback.recommendations,
  };
}

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
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  normalized = normalized.replace(/^[:)*\s]+/i, '');
  normalized = normalized.replace(/[:)*\s]+$/i, '');
  normalized = normalized.replace(/^great news!\s+/i, '');
  normalized = normalized.replace(/^#{1,6}\s*/g, '');
  normalized = normalized.replace(/\b(?:review the certificate validity dates\.?|renew the certificate before it expires if the status is expiring or expired\.?|check the latest health logs for repeated errors\.?|confirm network connectivity and dns settings\.?|choose a device and pick one of the guided topics below for a practical, domain-specific answer\.?|i can help with a few guided topics\.?.*?overview\.?)+/gi, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !/^(?:check|confirm|review|renew|choose|i can help|health:|ssl:|ports:)/i.test(sentence));

  if (sentences.length > 0) {
    const firstSentence = sentences.find((sentence) => !/^(?:the system is currently|your system is currently)/i.test(sentence));
    const kept = firstSentence || sentences[0];
    const cleaned = kept.replace(/\s+/g, ' ').trim();
    if (isIncompleteAiFragment(cleaned)) {
      return '';
    }
    return cleaned;
  }

  return normalized;
}

async function callAiModel(prompt) {
  const enabled = process.env.AI_ENABLED !== 'false';
  const apiKey = process.env.AI_API_KEY?.trim();

  if (!enabled) {
    return { content: null, available: false, reason: 'disabled' };
  }

  if (!apiKey) {
    return { content: null, available: false, reason: 'missing-api-key' };
  }

  const baseUrl = (process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models').trim();
  const model = (process.env.AI_MODEL || 'gemini-flash-latest').trim();
  const endpointUrl = baseUrl.includes(':generateContent')
    ? baseUrl
    : `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  let timeoutId;
  const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS || 8000);
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 8000);
  });

  try {
    const response = await Promise.race([
      fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 400,
          },
        }),
        signal: controller.signal,
      }),
      timeoutPromise,
    ]);

    if (!response.ok) {
      return { content: null, available: false, reason: `http-${response.status}` };
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return { content: content || null, available: Boolean(content), reason: content ? 'ok' : 'empty-response' };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { content: null, available: false, reason: 'timeout' };
    }

    return { content: null, available: false, reason: 'request-failed' };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function generateInsight(kind, payload, fallback, promptText = '') {
  try {
    const prompt = buildInsightPrompt(kind, payload, promptText);
    const aiResult = await callAiModel(prompt);

    if (aiResult?.content) {
      const cleanedSummary = normalizeAiContent(aiResult.content);
      return buildResponse(kind, {
        summary: cleanedSummary || fallback.summary,
        recommendations: fallback.recommendations,
      }, fallback);
    }

    return buildUnavailableAiResponse(fallback);
  } catch (error) {
    console.error('AI insight generation failed', error);
    return buildUnavailableAiResponse(fallback);
  }
}

function buildConversationFallback(promptText) {
  const normalized = (promptText || '').trim().toLowerCase();

  if (!normalized) {
    return {
      summary: 'Hello! I can help explain your device health, SSL status, open ports, or overall monitoring trends.',
      recommendations: ['Pick a device to get started.', 'Ask about health, SSL, or ports.'],
    };
  }

  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
    return {
      summary: 'Hello! I can help you quickly understand your device status in plain English.',
      recommendations: ['Ask about health, SSL, or ports.', 'Choose a device and I’ll summarize it for you.'],
    };
  }

  if (normalized.includes('history') || normalized.includes('summar') || normalized.includes('overview')) {
    return {
      summary: 'I can summarize the recent monitoring history for the selected device, including health checks, SSL posture, and open-port findings.',
      recommendations: ['Select a device first if needed.', 'Ask for a health, SSL, or port summary.'],
    };
  }

  return {
    summary: 'I can help explain the current monitoring status for this device in simple terms.',
    recommendations: ['Ask about health, SSL, or ports.', 'I can also give you an overall summary.'],
  };
}

async function safePrismaCall(model, operation, options = {}) {
  if (!model || typeof model[operation] !== 'function') {
    return null;
  }

  try {
    return await model[operation](options);
  } catch (error) {
    console.error(`Prisma ${operation} failed`, error);
    return null;
  }
}

async function getDeviceContext(userId, deviceId) {
  const device = await safePrismaCall(prisma.device, 'findFirst', {
    where: { id: deviceId, userId },
    select: { id: true, name: true, host: true },
  });

  if (!device) {
    return null;
  }

  return device;
}

export const aiService = {
  async explainSsl(userId, deviceId, promptText = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      return buildFallbackSummary('ssl', {});
    }

    const ssl = await safePrismaCall(prisma.sSLStatus, 'findFirst', {
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
    });

    if (!ssl) {
      return buildFallbackSummary('ssl', { ssl: {} });
    }

    const fallback = buildFallbackSummary('ssl', { ssl }, promptText);
    return generateInsight('ssl', { ssl }, fallback, promptText);
  },

  async explainPorts(userId, deviceId, promptText = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      return buildFallbackSummary('ports', {});
    }

    const portScan = await safePrismaCall(prisma.portScanLog, 'findFirst', {
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
    });

    if (!portScan) {
      return buildFallbackSummary('ports', { portScan: {} });
    }

    const fallback = buildFallbackSummary('ports', { portScan }, promptText);
    return generateInsight('ports', { portScan }, fallback, promptText);
  },

  async explainHealth(userId, deviceId, promptText = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      return buildFallbackSummary('health', {});
    }

    const healthLogs = await safePrismaCall(prisma.healthLog, 'findMany', {
      where: { deviceId },
      orderBy: { checkedAt: 'desc' },
      take: 12,
    });

    if (!healthLogs.length) {
      return buildFallbackSummary('health', { issueCount: 0 });
    }

    const issueCount = healthLogs.filter((log) => log.status === 'DOWN' || /timeout|refused|reset|dns|error/i.test(log.message || '')).length;
    const fallback = buildFallbackSummary('health', { issueCount }, promptText);
    return generateInsight('health', { healthLogs }, fallback, promptText);
  },

  async analyzeDevice(userId, deviceId, promptText = '') {
    const device = await getDeviceContext(userId, deviceId);
    if (!device) {
      return buildFallbackSummary('device', {});
    }

    const [metrics, ssl, portScan, healthLogs] = await Promise.all([
      analyticsService.getDeviceMetrics(deviceId, 24),
      safePrismaCall(prisma.sSLStatus, 'findFirst', {
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
      }),
      safePrismaCall(prisma.portScanLog, 'findFirst', {
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
      }),
      safePrismaCall(prisma.healthLog, 'findMany', {
        where: { deviceId },
        orderBy: { checkedAt: 'desc' },
        take: 10,
      }),
    ]);

    const reportSummary = metrics?.summary || null;
    const fallback = buildFallbackSummary('device', { metrics, ssl, portScan, healthLogs }, promptText);
    return generateInsight('device', { metrics, ssl, portScan, healthLogs, reportSummary }, fallback, promptText);
  },

  async explainReport(userId, reportId) {
    const cacheKey = reportId || 'latest';
    const existingSnapshot = reportSnapshots.get(cacheKey);
    let reportData = existingSnapshot;

    if (!reportData) {
      reportData = await reportService.getReportData(userId);
      reportSnapshots.set(cacheKey, reportData);
    }

    const fallback = buildFallbackSummary('report', { report: reportData });
    return generateInsight('report', { reportId: cacheKey, report: reportData }, fallback);
  },
};
