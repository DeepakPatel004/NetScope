import { CoordinatorClient } from './client.js';
import { runCheck } from './runner.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 2000;
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS) || 15000;
const ALLOW_PRIVATE_LAB = process.env.ALLOW_PRIVATE_LAB_NETWORKS === 'true';

const client = new CoordinatorClient();

let isRunning = true;
let inFlightChecks = 0;

console.log('====================================================');
console.log(` NetScope Remote Probe starting...`);
console.log(` Region: ${client.region}`);
console.log(` Coordinator: ${client.coordinatorUrl}`);
console.log(` Allow Lab Networks: ${ALLOW_PRIVATE_LAB}`);
console.log('====================================================');

// 1. Heartbeat Loop
async function heartbeatLoop() {
  while (isRunning) {
    try {
      await client.sendHeartbeat(inFlightChecks);
      // console.log(`[Heartbeat] Probe alive. In-flight checks: ${inFlightChecks}`);
    } catch (err) {
      console.warn(`[Heartbeat] Failed to report heartbeat: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, HEARTBEAT_INTERVAL_MS));
  }
}

// 2. Main Check Execution Loop
async function assignmentLoop() {
  while (isRunning) {
    try {
      const response = await client.fetchAssignments(5);
      const assignments = response?.assignments || [];

      if (assignments.length > 0) {
        // Execute leased checks concurrently up to batch size
        await Promise.all(
          assignments.map(async (assignment) => {
            inFlightChecks++;
            try {
              console.log(`[Check] Executing ${assignment.kind} check on ${assignment.targetUrl} (assignment: ${assignment.assignmentId})...`);
              const outcome = await runCheck(assignment.targetUrl, {
                timeoutMs: assignment.timeoutMs || 10000,
                allowPrivateLab: ALLOW_PRIVATE_LAB,
              });

              console.log(`[Check] Completed ${assignment.targetUrl} -> ${outcome.status} (${outcome.latency}ms, ${outcome.failureStage || 'OK'})`);
              await client.submitResult(assignment.assignmentId, outcome);
            } catch (err) {
              console.error(`[Check] Failed to execute/submit check for ${assignment.assignmentId}:`, err.message);
            } finally {
              inFlightChecks--;
            }
          })
        );
      }
    } catch (err) {
      // Coordinator might be temporarily unreachable; wait before next poll
      // console.warn(`[Poll] Assignment poll skipped: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// Graceful Shutdown
const shutdown = () => {
  console.log('\n[Shutdown] Probe shutting down gracefully...');
  isRunning = false;
  setTimeout(() => process.exit(0), 3000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Launch concurrent workers
heartbeatLoop();
assignmentLoop();
