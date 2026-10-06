import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import { dashboardService } from '../src/modules/dashboard/dashboard.service.js';

test('dashboard details reject inaccessible monitors before reading telemetry', async t => {
  const original = prisma.device;
  prisma.device = { findFirst: async query => {
    assert.deepEqual(query.where, { userId: 'owner', id: 'other-monitor' });
    return null;
  } };
  t.after(() => { prisma.device = original; });
  assert.equal(await dashboardService.getDeviceDetails('owner', 'other-monitor'), null);
});
