import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashToken(token) {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

async function main() {
  console.log('🌱 Starting NetScope deterministic database seed...');

  // 1. Seed Default Operator & Demo Users
  const passwordHash = await bcrypt.hash('AdminPass123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@netscope.internal' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@netscope.internal',
      passwordHash,
      fullName: 'Operator Administrator',
      role: 'ADMIN',
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@netscope.internal' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@netscope.internal',
      passwordHash,
      fullName: 'Demo Engineer',
      role: 'USER',
    },
  });

  console.log(`✅ Operator user ensured: admin@netscope.internal / AdminPass123!`);

  // 2. Seed Default Regional Lab Probes (Clearly labeled as simulated lab locations)
  const probeA_Token = 'nsp_probe_lab_us_east_secret_token_123';
  const probeB_Token = 'nsp_probe_lab_eu_west_secret_token_456';

  const probeA = await prisma.probe.upsert({
    where: { tokenHash: hashToken(probeA_Token) },
    update: {},
    create: {
      id: 'probe-lab-us-east',
      name: 'Lab Simulated US-East Probe',
      region: 'lab-simulated-us-east',
      tokenHash: hashToken(probeA_Token),
      status: 'ONLINE',
      version: '1.0.0',
    },
  });

  const probeB = await prisma.probe.upsert({
    where: { tokenHash: hashToken(probeB_Token) },
    update: {},
    create: {
      id: 'probe-lab-eu-west',
      name: 'Lab Simulated EU-West Probe',
      region: 'lab-simulated-eu-west',
      tokenHash: hashToken(probeB_Token),
      status: 'ONLINE',
      version: '1.0.0',
    },
  });

  console.log(`✅ Lab Probes seeded: ${probeA.name} (${probeA.region}) & ${probeB.name} (${probeB.region})`);

  // 3. Seed Operator Control Endpoint
  await prisma.controlEndpoint.upsert({
    where: { id: 'control-default-lab' },
    update: {},
    create: {
      id: 'control-default-lab',
      name: 'Operator Lab Baseline',
      url: 'http://fault-target:9090/control',
      expectedStatus: 200,
      enabled: true,
    },
  });
  console.log(`✅ Operator Control Endpoint seeded`);

  // 4. Seed Initial Monitors for demo
  const sampleMonitors = [
    {
      name: 'Fault Lab: Healthy Service',
      host: 'http://fault-target:9090/healthy',
      type: 'API',
      interval: 10,
      timeoutMs: 5000,
      baselineLatency: 15,
      selectedProbes: [probeA.id, probeB.id],
    },
    {
      name: 'Fault Lab: Intermittent Outage',
      host: 'http://fault-target:9090/flaky',
      type: 'API',
      interval: 10,
      timeoutMs: 5000,
      baselineLatency: 20,
      selectedProbes: [probeA.id, probeB.id],
    },
    {
      name: 'Fault Lab: Geo-Blocked Service',
      host: 'http://fault-target:9090/geo-blocked',
      type: 'API',
      interval: 10,
      timeoutMs: 5000,
      baselineLatency: 25,
      selectedProbes: [probeA.id, probeB.id],
    },
  ];

  for (const mon of sampleMonitors) {
    const existing = await prisma.device.findFirst({
      where: { userId: adminUser.id, host: mon.host },
    });
    if (!existing) {
      await prisma.device.create({
        data: {
          userId: adminUser.id,
          name: mon.name,
          host: mon.host,
          type: mon.type,
          interval: mon.interval,
          timeoutMs: mon.timeoutMs,
          baselineLatency: mon.baselineLatency,
          selectedProbes: mon.selectedProbes,
          enabled: true,
        },
      });
      console.log(`✅ Created monitor: ${mon.name} (${mon.host})`);
    }
  }

  console.log('🎉 Seeding complete. All telemetry will be collected live from running probes.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });