import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import { deviceValidator } from '../src/modules/device/device.validator.js';
import { deviceService } from '../src/modules/device/device.service.js';
import { reportService } from '../src/modules/report/report.service.js';
import { dashboardService } from '../src/modules/dashboard/dashboard.service.js';

function mockDelegate(t, name) {
  const original = prisma[name];
  prisma[name] = {create: async () => {}, findMany: async () => [], findFirst: async () => null};
  t.after(() => { prisma[name] = original; });
}

test('monitor input preserves distributed settings and rejects retired target types', async t => {
  mockDelegate(t, 'device');
  const data = deviceValidator.create.parse({name:'API',host:'https://example.test',type:'API',interval:30,timeoutMs:7000,selectedProbes:['probe-a']});
  t.mock.method(prisma.device, 'create', async ({data}) => data);
  const saved = await deviceService.createDevice('owner', data);
  assert.equal(saved.timeoutMs,7000);
  assert.deepEqual(saved.selectedProbes,['probe-a']);
  assert.deepEqual(deviceValidator.update.parse({name:'Renamed'}),{name:'Renamed'});
  assert.equal(deviceValidator.create.safeParse({...data,type:'SERVER'}).success,false);
  assert.equal(deviceValidator.create.safeParse({...data,host:'ftp://example.test'}).success,false);
  assert.equal(deviceValidator.create.safeParse({...data,timeoutMs:0}).success,false);
});

test('reports query probe TLS evidence without retired audit relations', async t => {
  mockDelegate(t, 'device');
  t.mock.method(prisma.device,'findMany',async query => {
    assert.equal(query.where.userId,'owner');
    assert.equal(query.include.sslLogs,undefined);
    assert.equal(query.include.portScanLogs,undefined);
    assert.deepEqual(query.include.checkResults.where,{kind:{not:'CONTROL_CHECK'},isLate:false});
    return [{id:'m',healthLogs:[],checkResults:[{observedAt:new Date(),tlsCert:{authorized:true,daysRemaining:12}}]}];
  });
  const report=await reportService.getReportData('owner');
  assert.equal(report.devices[0].sslStatus,'EXPIRING');
  assert.equal(report.devices[0].uptimePercentage,null);
  assert.equal(report.summary.portSummary,undefined);
});

test('dashboard excludes control observations and late results from target evidence', async t => {
  for (const name of ['device','healthLog','checkResult']) mockDelegate(t, name);
  t.mock.method(prisma.device,'findFirst',async () => ({id:'m'}));
  t.mock.method(prisma.healthLog,'findMany',async () => []);
  t.mock.method(prisma.checkResult,'findMany',async query => {
    assert.deepEqual(query.where,{monitorId:'m',kind:{not:'CONTROL_CHECK'},isLate:false});
    return [];
  });
  const detail=await dashboardService.getDeviceDetails('owner','m');
  assert.deepEqual(detail.probeMatrix,[]);
});
