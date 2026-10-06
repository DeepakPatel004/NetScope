import test from 'node:test';
import assert from 'node:assert/strict';
import { aiService } from '../src/modules/ai/ai.service.js';
import { aiClient } from '../src/utils/aiClient.js';
import { analyticsService } from '../src/modules/analytics/analytics.service.js';
import { dashboardService } from '../src/modules/dashboard/dashboard.service.js';
import prisma from '../src/config/database.js';

function context(t) {
  for (const name of ['device', 'healthLog', 'sSLStatus', 'portScanLog']) {
    const original = prisma[name];
    prisma[name] = { findFirst: async () => null, findMany: async () => [] };
    t.after(() => { prisma[name] = original; });
  }
  const device = { id: 'device-1', name: 'Edge API', host: 'example.test' };
  const logs = [{ status: 'DOWN', latency: 0, checkedAt: new Date() }];
  t.mock.method(prisma.device, 'findFirst', async () => device);
  t.mock.method(prisma.healthLog, 'findMany', async () => logs);
  t.mock.method(prisma.sSLStatus, 'findFirst', async () => null);
  t.mock.method(prisma.portScanLog, 'findFirst', async () => null);
  t.mock.method(analyticsService, 'getDeviceMetrics', async () => ({ totalChecks: 1, successfulChecks: 0, uptimePercentage: 0 }));
  return { device, logs };
}

test('unavailable AI returns an explicit unavailable response', async t => {
  context(t);
  t.mock.method(aiClient, 'generateContent', async () => null);
  const result = await aiService.explainHealth('user-1', 'device-1');
  assert.match(result.summary, /AI is currently unavailable/);
  assert.ok(Array.isArray(result.recommendations));
});

test('failed AI transport returns a graceful response', async t => {
  context(t);
  t.mock.method(aiClient, 'generateContent', async () => { throw new Error('timeout'); });
  const result = await aiService.explainHealth('user-1', 'device-1');
  assert.match(result.summary, /unavailable/);
});

test('incomplete model fragments cannot masquerade as an answer', async t => {
  context(t);
  t.mock.method(aiClient, 'generateContent', async () => ({ summary: 'Service recovered with latency returning to', recommendations: [] }));
  const result = await aiService.explainHealth('user-1', 'device-1');
  assert.match(result.summary, /unavailable/);
});

test('device chat sends the question and recorded telemetry to the AI client', async t => {
  const { device, logs } = context(t);
  let supplied;
  t.mock.method(aiClient, 'generateContent', async (prompt, telemetry) => {
    supplied = { prompt, telemetry };
    return { summary: 'The latest check failed.', recommendations: [] };
  });
  const result = await aiService.chat('user-1', 'Why is it down?', device.id);
  assert.equal(result.summary, 'The latest check failed.');
  assert.equal(supplied.prompt, 'Why is it down?');
  assert.deepEqual(supplied.telemetry.healthLogs, logs);
  assert.equal(supplied.telemetry.metrics.uptimePercentage, 0);
});

test('device chat rejects inaccessible devices before invoking AI', async t => {
  context(t);
  t.mock.method(prisma.device, 'findFirst', async () => null);
  const generate = t.mock.method(aiClient, 'generateContent', async () => assert.fail('must not run'));
  await assert.rejects(aiService.chat('user-1', 'Check it', 'other-device'), /Device not found/);
  assert.equal(generate.mock.callCount(), 0);
});

test('timeline uses newest 40 logs, then restores chronological order', async t => {
  context(t);
  t.mock.method(prisma.healthLog, 'findMany', async query => {
    assert.equal(query.orderBy.checkedAt, 'desc');
    assert.equal(query.take, 40);
    return [{ checkedAt: new Date('2026-10-02T10:00:00Z') }, { checkedAt: new Date('2026-10-02T09:00:00Z') }];
  });
  t.mock.method(aiClient, 'summarizeTimeline', async (_name, logs, start, end) => {
    assert.ok(logs[0].checkedAt < logs[1].checkedAt);
    assert.equal(start, '2026-10-02T09:00:00.000Z');
    assert.equal(end, '2026-10-02T10:00:00.000Z');
    return { timeline_summary: 'Recent samples' };
  });
  await aiService.generateDeviceTimelineSummary('user-1', 'device-1');
});

test('dashboard details enforce ownership without a nonexistent recoveryPolicy relation', async t => {
  context(t);
  t.mock.method(prisma.device, 'findFirst', async query => {
    assert.deepEqual(query.where, { userId: 'user-1', id: 'device-1' });
    assert.equal(query.include, undefined);
    return null;
  });
  assert.equal(await dashboardService.getDeviceDetails('user-1', 'device-1'), null);
});
