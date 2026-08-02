import test from 'node:test';
import assert from 'node:assert/strict';

import { aiService } from '../src/modules/ai/ai.service.js';
import prisma from '../src/config/database.js';

test('returns an AI-unavailable response instead of a local fallback when the model is not configured', async () => {
  process.env.AI_ENABLED = 'true';
  process.env.AI_API_KEY = '';
  process.env.AI_BASE_URL = '';
  process.env.AI_MODEL = '';

  prisma.device = {
    ...prisma.device,
    findFirst: async () => ({ id: 'dev-1', name: 'Edge Router', host: 'router.local' }),
  };

  prisma.healthLog = {
    ...prisma.healthLog,
    findMany: async () => [{ status: 'UP', checkedAt: new Date().toISOString(), latency: 12, message: 'ok' }],
  };

  const result = await aiService.explainHealth('user-1', 'dev-1', 'Is the device healthy?');

  assert.match(result.summary.toLowerCase(), /ai is currently unavailable|ai unavailable|please enable/i);
});

test('cleans up malformed model output before returning it to the UI', async () => {
  process.env.AI_ENABLED = 'true';
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  process.env.AI_MODEL = 'gemini-flash-latest';

  global.fetch = async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: '):* Great news! Your SSL certificate for **github.com** looks healthy. Review the certificate validity dates. Review the certificate validity dates.' }] } }] }),
  });

  prisma.device = {
    ...prisma.device,
    findFirst: async () => ({ id: 'dev-3', name: 'GitHub Pages', host: 'github.com' }),
  };

  prisma.sSLStatus = {
    ...prisma.sSLStatus,
    findFirst: async () => ({ status: 'ACTIVE', issuer: 'Let\'s Encrypt', subject: 'github.com', daysRemaining: 45, checkedAt: new Date().toISOString() }),
  };

  const result = await aiService.explainSsl('user-3', 'dev-3', 'Show my SSL certificate details');

  assert.doesNotMatch(result.summary, /\):\*/);
  assert.doesNotMatch(result.summary, /review the certificate validity dates\./i);
  assert.doesNotMatch(result.summary, /check the latest health logs/i);
  assert.match(result.summary, /github\.com/i);
});

test('returns a graceful fallback when the AI request hangs', async () => {
  process.env.AI_ENABLED = 'true';
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  process.env.AI_MODEL = 'gemini-flash-latest';
  process.env.AI_REQUEST_TIMEOUT_MS = '50';

  global.fetch = async () => new Promise(() => {});

  prisma.device = {
    ...prisma.device,
    findFirst: async () => ({ id: 'dev-4', name: 'Mail Gateway', host: 'mail.local' }),
  };

  prisma.healthLog = {
    ...prisma.healthLog,
    findMany: async () => [{ status: 'UP', checkedAt: new Date().toISOString(), latency: 10, message: 'reachable' }],
  };

  const result = await Promise.race([
    aiService.explainHealth('user-4', 'dev-4', 'Is the device healthy?'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 200)),
  ]);

  assert.match(result.summary.toLowerCase(), /ai is currently unavailable|configured model could not be reached/i);
  assert.ok(Array.isArray(result.recommendations));
});

test('rejects incomplete model fragments and falls back to a safe summary', async () => {
  process.env.AI_ENABLED = 'true';
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  process.env.AI_MODEL = 'gemini-flash-latest';

  global.fetch = async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: 'The service is currently healthy and fully operational, with response latencies returning to' }] } }] }),
  });

  prisma.device = {
    ...prisma.device,
    findFirst: async () => ({ id: 'dev-5', name: 'Edge Proxy', host: 'proxy.local' }),
  };

  prisma.healthLog = {
    ...prisma.healthLog,
    findMany: async () => [{ status: 'UP', checkedAt: new Date().toISOString(), latency: 8, message: 'reachable' }],
  };

  const result = await aiService.explainHealth('user-5', 'dev-5', 'Show me the current health status');

  assert.match(result.summary.toLowerCase(), /recent health checks show 0 issues|appears stable for now/i);
});

test('sends the monitoring context to the AI model when the model is available', async () => {
  process.env.AI_ENABLED = 'true';
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  process.env.AI_MODEL = 'gemini-flash-latest';

  let capturedBody;
  let capturedUrl;
  let capturedHeaders;
  global.fetch = async (_url, options) => {
    capturedUrl = _url;
    capturedHeaders = options.headers;
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'The device looks healthy based on the latest checks.' }] } }] }),
    };
  };

  prisma.device = {
    ...prisma.device,
    findFirst: async () => ({ id: 'dev-2', name: 'Switch', host: 'switch.local' }),
  };

  prisma.healthLog = {
    ...prisma.healthLog,
    findMany: async () => [{ status: 'UP', checkedAt: new Date().toISOString(), latency: 8, message: 'reachable' }],
  };

  const result = await aiService.explainHealth('user-2', 'dev-2', 'Is the device healthy?');

  assert.equal(result.summary.trim(), 'The device looks healthy based on the latest checks.');
  assert.equal(capturedUrl, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');
  assert.equal(capturedHeaders['X-goog-api-key'], 'test-key');
  assert.match(capturedBody.contents[0].parts[0].text, /Is the device healthy\?/i);
  assert.match(capturedBody.contents[0].parts[0].text, /Recent health logs:/i);
});
