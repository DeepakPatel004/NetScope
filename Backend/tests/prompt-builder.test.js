import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackSummary } from '../src/modules/ai/prompt.builder.js';

test('ssl expiry fallback mentions renewal urgency for short validity windows', () => {
  const result = buildFallbackSummary('ssl', { ssl: { status: 'ACTIVE', daysRemaining: 12 } }, 'what is expiry date of my device');

  assert.match(result.summary, /renew|expiry|expire|days remaining|certificate/i);
  assert.match(result.summary, /12/i);
});

test('port fallback mentions the actual open ports and risk', () => {
  const result = buildFallbackSummary('ports', { portScan: { openPorts: [22, 80, 443] } }, 'what ports are open');

  assert.match(result.summary, /22|80|443/i);
  assert.match(result.summary, /risk|open port|exposed/i);
});
