import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import { queueManualCheck } from '../src/modules/probe/assignmentScheduler.js';

function delegates(t, probes) {
  const originalProbe = prisma.probe;
  const originalAssignment = prisma.checkAssignment;
  prisma.probe = { findMany: async query => {
    assert.ok(query.where.lastHeartbeatAt.gte instanceof Date);
    assert.equal(query.where.isRevoked, false);
    return probes;
  } };
  prisma.checkAssignment = { createMany: async query => ({ count: query.data.length }) };
  t.after(() => { prisma.probe = originalProbe; prisma.checkAssignment = originalAssignment; });
}

test('manual checks remain restricted to selected remote probes', async t => {
  delegates(t, [{ id: 'a', region: 'A' }, { id: 'b', region: 'B' }]);
  t.mock.method(prisma.checkAssignment, 'createMany', async query => {
    assert.deepEqual(query.data.map(job => job.probeId), ['b']);
    assert.equal(query.data[0].targetUrl, 'https://example.test/health');
    return { count: 1 };
  });
  assert.equal(await queueManualCheck({ id: 'monitor', host: 'https://example.test/health', selectedProbes: ['b'] }), 1);
});

test('manual checks do not fall back to unrelated probes when selection is unavailable', async t => {
  delegates(t, [{ id: 'a', region: 'A' }]);
  t.mock.method(prisma.checkAssignment, 'createMany', async () => assert.fail('must not queue an unrelated probe'));
  assert.equal(await queueManualCheck({ id: 'monitor', selectedProbes: ['missing'] }), 0);
});
