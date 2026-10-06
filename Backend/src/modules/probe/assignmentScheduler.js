import prisma from '../../config/database.js';
import { healthIntervalMs } from '../../workers/schedule-policy.js';

let isScheduling = false;

export async function queueManualCheck(device) {
  const probes = await prisma.probe.findMany({
    where: {
      status: 'ONLINE', isRevoked: false,
      lastHeartbeatAt: { gte: new Date(Date.now() - 60000) },
    },
  });
  const selected = Array.isArray(device.selectedProbes) ? device.selectedProbes : [];
  const eligible = probes.filter(probe => !selected.length || selected.includes(probe.id) || selected.includes(probe.region));
  if (!eligible.length) return 0;
  const result = await prisma.checkAssignment.createMany({
    data: eligible.map(probe => ({
      monitorId: device.id, probeId: probe.id, kind: 'ROUTINE',
      targetUrl: device.host, status: 'PENDING',
    })),
  });
  return result.count;
}

/**
 * Durable Check Assignment Scheduler
 * Generates durable check assignments in PostgreSQL for distributed probes
 * and handles lease timeouts / reassignment.
 */
export async function runAssignmentSchedulerTick() {
  if (isScheduling) return;
  isScheduling = true;

  try {
    const now = new Date();

    // 1. Reclaim / Expire Stale Leases
    // If a probe leased an assignment but never submitted results before leaseExpiresAt:
    const expiredLeases = await prisma.checkAssignment.findMany({
      where: {
        status: 'LEASED',
        leaseExpiresAt: { lt: now },
      },
      take: 50,
    });

    for (const lease of expiredLeases) {
      if (lease.attemptCount >= 3) {
        // Exceeded maximum retries, mark as EXPIRED
        await prisma.checkAssignment.update({
          where: { id: lease.id },
          data: { status: 'EXPIRED' },
        });
      } else {
        // Permit controlled reassignment: return to PENDING
        await prisma.checkAssignment.update({
          where: { id: lease.id },
          data: { status: 'PENDING', leasedAt: null, leaseExpiresAt: null },
        });
      }
    }

    // 2. Fetch Active Fleet of Probes
    const activeProbes = await prisma.probe.findMany({
      where: {
        status: 'ONLINE',
        isRevoked: false,
        lastHeartbeatAt: { gte: new Date(Date.now() - 60000) },
      },
    });

    if (activeProbes.length === 0) {
      // No active probes registered yet
      return;
    }

    // 3. Fetch Enabled Monitors
    const devices = await prisma.device.findMany({
      where: { enabled: true, type: { in: ['WEBSITE', 'API'] } },
    });

    for (const device of devices) {
      const intervalMs = healthIntervalMs(device);

      // Determine which probes are assigned to this monitor
      let targetProbes = activeProbes;
      if (Array.isArray(device.selectedProbes) && device.selectedProbes.length > 0) {
        targetProbes = activeProbes.filter(p =>
          device.selectedProbes.includes(p.id) || device.selectedProbes.includes(p.region)
        );
      }

      for (const probe of targetProbes) {
        // Check if there is an existing pending or currently leased check for this pair
        const existingActive = await prisma.checkAssignment.findFirst({
          where: {
            monitorId: device.id,
            probeId: probe.id,
            status: { in: ['PENDING', 'LEASED'] },
          },
        });

        if (existingActive) {
          continue; // Work already in flight for this probe & monitor
        }

        // Check when the last check result was recorded for this pair
        const lastResult = await prisma.checkResult.findFirst({
          where: {
            monitorId: device.id,
            probeId: probe.id,
          },
          orderBy: { observedAt: 'desc' },
          select: { observedAt: true },
        });

        const timeSinceLast = lastResult ? now.getTime() - new Date(lastResult.observedAt).getTime() : Infinity;

        if (timeSinceLast >= intervalMs) {
          // Schedule new durable check assignment
          await prisma.checkAssignment.create({
            data: {
              monitorId: device.id,
              probeId: probe.id,
              kind: 'ROUTINE',
              targetUrl: device.host,
              status: 'PENDING',
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('[AssignmentScheduler] Error generating check assignments:', error.message);
  } finally {
    isScheduling = false;
  }
}

let schedulerTimer = null;

export function startAssignmentScheduler(intervalMs = 5000) {
  if (schedulerTimer) clearInterval(schedulerTimer);
  runAssignmentSchedulerTick();
  schedulerTimer = setInterval(runAssignmentSchedulerTick, intervalMs);
  console.log(`[AssignmentScheduler] Durable check scheduler running every ${intervalMs}ms.`);
  return schedulerTimer;
}

export function stopAssignmentScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
