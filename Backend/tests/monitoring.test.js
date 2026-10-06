import test from 'node:test';
import assert from 'node:assert/strict';
import { statisticalAnomalyService as detector } from '../src/modules/anomaly/statisticalAnomaly.service.js';
import recoveryRoutes from '../src/modules/recovery/recovery.routes.js';
import agentRoutes from '../src/modules/agent/agent.routes.js';
import { healthIntervalMs, supportsTls } from '../src/workers/schedule-policy.js';

const healthy = () => Array.from({ length: 10 }, () => ({ status: 'UP', latency: 20 }));

test('statistical detector evaluates the newest chronological sample', () => {
  const result = detector.detectStatisticalAnomaly({}, [...healthy(), { status: 'UP', latency: 1800 }]);
  assert.equal(result.isAnomaly, true);
  assert.equal(result.metrics.latency, 1800);
  assert.equal(result.metrics.meanLatency, 20);
});

test('healthy endpoint traffic stays normal', () => {
  const result = detector.detectStatisticalAnomaly({}, healthy(), { cpuPercent: 0 });
  assert.equal(result.isAnomaly, false);
  assert.equal('cpuPercent' in result.metrics, false);
});

test('removed host metrics cannot cause endpoint incidents', () => {
  const result = detector.detectStatisticalAnomaly({}, healthy(), { cpuPercent: 99, checkedAt: new Date(Date.now() - 600000) });
  assert.equal(result.isAnomaly, false);
  assert.equal('cpuPercent' in result.metrics, false);
});

test('historical failures age out of the current failure window', () => {
  const result = detector.detectStatisticalAnomaly({}, [...Array(20).fill({ status: 'DOWN', latency: 0 }), ...healthy()]);
  assert.equal(result.isAnomaly, false);
});

test('three failures are critical without an AI model or a trained baseline', () => {
  const result = detector.detectStatisticalAnomaly({}, Array(3).fill({ status: 'DOWN', latency: null }));
  assert.equal(result.isAnomaly, true);
  assert.equal(result.severity, 'CRITICAL');
  assert.equal(result.metrics.consecutiveFailures, 3);
});

test('all retired recovery paths reject actions without invoking execution', () => {
  for (const url of ['/recommend', '/requests', '/123/approve', '/123/verify', '/result', '/device/123']) {
    let status;
    let body;
    recoveryRoutes.handle({ method: 'POST', url }, {
      status(value) { status = value; return this; },
      json(value) { body = value; },
    }, () => assert.fail('Retired route must not continue to another handler'));
    assert.equal(status, 410);
    assert.equal(body.success, false);
  }
});

test('retired agents cannot submit host metrics or register', () => {
  for (const url of ['/heartbeat', '/register', '/metrics/device-1']) {
    let status;
    agentRoutes.handle({ method: 'POST', url }, {
      status(value) { status = value; return this; },
      json(value) { assert.equal(value.success, false); },
    }, () => assert.fail('Agent route must be retired'));
    assert.equal(status, 410);
  }
});

test('scheduler respects configured seconds and excludes ping targets from TLS checks', () => {
  assert.equal(healthIntervalMs({ interval: 30 }), 30000);
  assert.equal(healthIntervalMs({ interval: 1 }), 5000);
  assert.equal(healthIntervalMs({}), 30000);
  assert.equal(supportsTls({ type: 'IP', host: '192.0.2.1' }), false);
  assert.equal(supportsTls({ type: 'API', host: 'https://example.test' }), true);
});
