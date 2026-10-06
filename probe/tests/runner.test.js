import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import { runCheck } from '../src/runner.js';

test('remote probe rejects a hostname resolving to private IPv4 without crashing', async t => {
  t.mock.method(dns, 'lookup', (_hostname, _options, callback) => {
    callback(null, '10.20.30.40', 4);
  });
  const result = await runCheck('http://private-target.invalid', { timeoutMs: 500 });
  assert.equal(result.status, 'DOWN');
  assert.equal(result.failureStage, 'SSRF_BLOCKED');
});
