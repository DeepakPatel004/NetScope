import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clear existing data to prevent duplicates (Optional but recommended)
  await prisma.healthLog.deleteMany({});
  await prisma.device.deleteMany({});
  console.log('🧹 Cleared old database records.');

  // 2. Define realistic demo devices using resolvable local hosts
  const demoDevices = [
    { name: 'Primary API Server', host: 'example.com', type: 'API', interval: 60 },
    { name: 'Customer Payment Gateway', host: 'example.org', type: 'API', interval: 30 },
    { name: 'Marketing Website', host: 'example.net', type: 'WEBSITE', interval: 300 },
    { name: 'Europe Database Replica', host: '127.0.0.1', type: 'IP', interval: 60 },
    { name: 'Background Worker', host: 'localhost', type: 'IP', interval: 60 },
  ];

  // 3. Insert devices and generate historical logs
  // Ensure a demo user exists for seeded devices
  await prisma.user.upsert({
    where: { id: MOCK_USER_ID },
    update: {},
    create: {
      id: MOCK_USER_ID,
      username: 'demo',
      email: 'demo@netscope.local',
      passwordHash: '',
      fullName: 'Demo User',
      role: 'USER'
    }
  });

  for (const dev of demoDevices) {
    const device = await prisma.device.create({
      data: {
        userId: MOCK_USER_ID,
        name: dev.name,
        host: dev.host,
        type: dev.type,
        interval: dev.interval,
      }
    });

    console.log(`✅ Created device: ${device.name}`);

    // Generate 50 fake historical logs per device
    const logsData = [];
    let currentTime = new Date();

    for (let i = 0; i < 50; i++) {
      // Subtract minutes to go backward in time
      const checkTime = new Date(currentTime.getTime() - (i * dev.interval * 1000)); 
      
      // 90% chance it was UP, 10% chance it was DOWN
      const isUp = Math.random() > 0.1;
      
      // Random latency between 20ms and 150ms
      const baseLatency = dev.type === 'PING' ? 15 : 45;
      const latency = isUp ? Math.floor(Math.random() * 80) + baseLatency : null;

      logsData.push({
        deviceId: device.id,
        status: isUp ? 'UP' : 'DOWN',
        latency: latency,
        message: isUp ? null : 'Connection timed out after 5000ms',
        checkedAt: checkTime,
      });
    }

    // Bulk insert the logs
    await prisma.healthLog.createMany({ data: logsData });
    console.log(`   📊 Added 50 historical logs for ${device.name}`);
  }

  console.log('🎉 Seeding complete! Your dashboard is now full of data.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });