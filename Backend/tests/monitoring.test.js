import test from 'node:test';
import assert from 'node:assert/strict';
import recoveryRoutes from '../src/modules/recovery/recovery.routes.js';
import agentRoutes from '../src/modules/agent/agent.routes.js';
import { healthIntervalMs, supportsTls } from '../src/workers/schedule-policy.js';

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
