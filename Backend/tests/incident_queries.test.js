import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import { incidentService } from '../src/modules/incident/incident.service.js';

test('incident queries retain owner scope when filtering a monitor', async t => {
  const original = prisma.incident;
  prisma.incident = { findMany: async query => {
    assert.deepEqual(query.where, { device: { userId: 'owner' }, deviceId: 'monitor' });
    assert.equal(query.include.device.select.agentKey, undefined);
    return [];
  } };
  t.after(() => { prisma.incident = original; });
  assert.deepEqual(await incidentService.list('owner', 'monitor'), []);
});
