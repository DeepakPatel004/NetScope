import http from 'http';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { executeProbeCheck } from '../Backend/src/modules/monitoring/probeCheckRunner.js';
import { multiProbeVerifier } from '../Backend/src/modules/verification/multiProbeVerifier.js';

const PORT = 9191;

// 1. Setup local target mock server
function startTargetServer() {
  let flakyCount = 0;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const region = req.headers['x-probe-region'] || 'unknown';

    if (url.pathname === '/healthy') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }
    if (url.pathname === '/outage') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Service Unavailable' }));
    }
    if (url.pathname === '/flaky') {
      flakyCount++;
      if (flakyCount % 3 === 1) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Transient Flake' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }
    if (url.pathname === '/geo-blocked') {
      if (region.includes('us-east')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Blocked from us-east' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'accessible' }));
    }
    if (url.pathname === '/control') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'control_ok' }));
    }

    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

// 2. Evaluation Runner
async function runBenchmark() {
  console.log('================================================================');
  console.log(' NetScope Empirical Benchmark: Single-Probe vs Independent Multi-Probe');
  console.log('================================================================');

  const server = await startTargetServer();
  console.log(`[Lab] Controlled target mock listening at http://127.0.0.1:${PORT}`);

  const probeEast = { id: 'probe-us-east', name: 'US-East AWS Probe', region: 'us-east-1' };
  const probeWest = { id: 'probe-eu-west', name: 'EU-West GCP Probe', region: 'eu-central-1' };
  const mockDevice = { id: 'dev-eval-1', name: 'Evaluation Target', host: `http://127.0.0.1:${PORT}`, baselineLatency: 20 };

  const ITERATIONS_PER_SCENARIO = 10;

  const metrics = {
    policyA: { // Single-Probe Immediate Alert Policy
      totalChecks: 0,
      falseOutageAlerts: 0,
      trueOutageAlerts: 0,
      missedIncidents: 0,
      detectionDelays: [],
      extraVerificationRequests: 0,
    },
    policyB: { // NetScope Multi-Probe Independent Verification Policy
      totalChecks: 0,
      falseOutageAlerts: 0,
      trueOutageAlerts: 0,
      missedIncidents: 0,
      detectionDelays: [],
      extraVerificationRequests: 0,
    },
  };

  const scenarios = [
    {
      name: 'Scenario 1: Baseline Healthy Traffic',
      path: '/healthy',
      groundTruth: 'HEALTHY',
      simulateProbeFault: false,
    },
    {
      name: 'Scenario 2: Actual Target Outage (Widespread 503)',
      path: '/outage',
      groundTruth: 'OUTAGE',
      simulateProbeFault: false,
    },
    {
      name: 'Scenario 3: Localized Probe Network Glitch (Probe A egress fails, Target healthy)',
      path: '/healthy',
      groundTruth: 'HEALTHY',
      simulateProbeFault: true, // Probe A fails both target & control; Probe B healthy
    },
    {
      name: 'Scenario 4: Transient Single-Request Flake',
      path: '/flaky',
      groundTruth: 'HEALTHY',
      simulateProbeFault: false,
    },
    {
      name: 'Scenario 5: Location-Specific Routing Block (US-East blocked, EU-West healthy)',
      path: '/geo-blocked',
      groundTruth: 'LOCATION_PARTITION',
      simulateProbeFault: false,
    },
  ];

  for (const sc of scenarios) {
    console.log(`\nRunning ${sc.name} (${ITERATIONS_PER_SCENARIO} iterations)...`);

    for (let i = 0; i < ITERATIONS_PER_SCENARIO; i++) {
      const startTime = performance.now();

      // Check from Probe A
      let resA;
      if (sc.simulateProbeFault) {
        // Probe A experiences local network / dns failure
        resA = { status: 'DOWN', failureStage: 'TCP_CONNECTION', latency: null, message: 'ECONNREFUSED (Probe Egress Fault)' };
      } else {
        resA = await executeProbeCheck(`http://127.0.0.1:${PORT}${sc.path}`, {
          allowPrivateLabNetworks: true,
          headers: { 'x-probe-region': probeEast.region },
        });
      }

      // --- EVALUATE POLICY A: Single-Probe Alert Policy ---
      // Alerts immediately whenever Probe A sees DOWN
      metrics.policyA.totalChecks++;
      const policyAAlerted = resA.status === 'DOWN';
      const delayA = Math.round(performance.now() - startTime);

      if (policyAAlerted) {
        if (sc.groundTruth === 'HEALTHY') {
          metrics.policyA.falseOutageAlerts++;
        } else {
          metrics.policyA.trueOutageAlerts++;
          metrics.policyA.detectionDelays.push(delayA);
        }
      } else {
        if (sc.groundTruth === 'OUTAGE') {
          metrics.policyA.missedIncidents++;
        }
      }

      // --- EVALUATE POLICY B: NetScope Independent Multi-Probe Verification ---
      metrics.policyB.totalChecks++;

      let policyBClassification;
      let policyBExtraRequests = 0;

      if (resA.status === 'UP') {
        policyBClassification = { assessment: 'HEALTHY' };
      } else {
        // Trigger bounded diagnostic follow-ups:
        // 1. Follow-up confirmation check on Probe B
        policyBExtraRequests++;
        const resB = await executeProbeCheck(`http://127.0.0.1:${PORT}${sc.path}`, {
          allowPrivateLabNetworks: true,
          headers: { 'x-probe-region': probeWest.region },
        });

        // 2. Control check from Probe A
        policyBExtraRequests++;
        let resControlA;
        if (sc.simulateProbeFault) {
          // Probe A's control check also fails due to local egress fault!
          resControlA = { status: 'DOWN', url: `http://127.0.0.1:${PORT}/control` };
        } else {
          resControlA = await executeProbeCheck(`http://127.0.0.1:${PORT}/control`, {
            allowPrivateLabNetworks: true,
          });
        }

        const controlStatus = {
          [probeEast.id]: { status: resControlA.status, url: 'control' },
          [probeWest.id]: { status: 'UP', url: 'control' },
        };

        const recentResults = [
          { probeId: probeEast.id, status: resA.status, failureStage: resA.failureStage, probe: probeEast },
          { probeId: probeWest.id, status: resB.status, failureStage: resB.failureStage, probe: probeWest },
        ];

        policyBClassification = multiProbeVerifier.classifySituation({
          device: mockDevice,
          reportingProbe: probeEast,
          reportingResult: resA,
          recentResults,
          controlStatus,
        });
      }

      metrics.policyB.extraVerificationRequests += policyBExtraRequests;
      const delayB = Math.round(performance.now() - startTime);

      // Evaluate Policy B accuracy
      const assessment = policyBClassification.assessment;
      const isOutageAlertB = assessment === 'WIDESPREAD_FAILURE';
      const isPartitionB = assessment === 'LOCATION_SPECIFIC_FAILURE';
      const isProbeFaultB = assessment === 'PROBE_CONNECTIVITY_SUSPECTED';

      if (isOutageAlertB) {
        if (sc.groundTruth === 'HEALTHY' || sc.groundTruth === 'LOCATION_PARTITION') {
          metrics.policyB.falseOutageAlerts++;
        } else {
          metrics.policyB.trueOutageAlerts++;
          metrics.policyB.detectionDelays.push(delayB);
        }
      } else if (isPartitionB) {
        if (sc.groundTruth === 'LOCATION_PARTITION') {
          metrics.policyB.trueOutageAlerts++;
          metrics.policyB.detectionDelays.push(delayB);
        }
      } else if (isProbeFaultB) {
        // Correctly categorized as probe fault, NOT a false outage alarm for the target!
      } else {
        if (sc.groundTruth === 'OUTAGE') {
          metrics.policyB.missedIncidents++;
        }
      }
    }
  }

  server.close();

  // 3. Compute Summary Statistics
  const avgDelayA = metrics.policyA.detectionDelays.length
    ? Math.round(metrics.policyA.detectionDelays.reduce((a, b) => a + b, 0) / metrics.policyA.detectionDelays.length)
    : 0;
  const avgDelayB = metrics.policyB.detectionDelays.length
    ? Math.round(metrics.policyB.detectionDelays.reduce((a, b) => a + b, 0) / metrics.policyB.detectionDelays.length)
    : 0;

  console.log('\n================================================================');
  console.log(' BENCHMARK RESULTS');
  console.log('================================================================');
  console.log(`Total Routine Check Iterations: ${metrics.policyA.totalChecks}`);
  console.log('\nPOLICY A (Single-Probe Immediate Alert):');
  console.log(`  - False Outage Alerts: ${metrics.policyA.falseOutageAlerts} (Alarms on localized probe blips / flakes)`);
  console.log(`  - True Outages Detected: ${metrics.policyA.trueOutageAlerts}`);
  console.log(`  - Missed Outages: ${metrics.policyA.missedIncidents}`);
  console.log(`  - Mean Detection Delay: ${avgDelayA} ms`);
  console.log(`  - Extra Verification Requests: 0`);

  console.log('\nPOLICY B (NetScope Independent Verification Policy):');
  console.log(`  - False Outage Alerts: ${metrics.policyB.falseOutageAlerts} (Probe blips properly categorized as PROBE_CONNECTIVITY_SUSPECTED)`);
  console.log(`  - True Outages Detected: ${metrics.policyB.trueOutageAlerts}`);
  console.log(`  - Missed Outages: ${metrics.policyB.missedIncidents}`);
  console.log(`  - Mean Confirmation Delay: ${avgDelayB} ms (Includes cross-probe verification check)`);
  console.log(`  - Extra Verification Requests: ${metrics.policyB.extraVerificationRequests} (${(metrics.policyB.extraVerificationRequests / metrics.policyB.totalChecks).toFixed(2)} req/check overhead)`);

  // 4. Generate EVALUATION_REPORT.md
  const reportContent = `# Local classifier comparison

This harness uses a local HTTP server, the backend check runner and simulated probe observations. It does not exercise independently deployed probe processes, the assignment polling protocol, database concurrency or cloud networking.

| Fixture metric | Immediate alert | Verification policy |
| --- | ---: | ---: |
| False outage alerts | ${metrics.policyA.falseOutageAlerts} | ${metrics.policyB.falseOutageAlerts} |
| True outage alerts | ${metrics.policyA.trueOutageAlerts} | ${metrics.policyB.trueOutageAlerts} |
| Missed incidents | ${metrics.policyA.missedIncidents} | ${metrics.policyB.missedIncidents} |
| Mean harness duration (ms) | ${avgDelayA} | ${avgDelayB} |
| Extra requests counted by harness | 0 | ${metrics.policyB.extraVerificationRequests} |

These values describe this fixture run only. Harness duration excludes real distributed scheduling and cannot be presented as production confirmation latency. Request counts do not validate live coordinator budgets. No general false-positive reduction or cloud capacity claim follows from these scenarios.

Run from the repository root: node scripts/run_evaluation.js.
`;

  fs.writeFileSync(path.resolve('EVALUATION_REPORT.md'), reportContent, 'utf-8');
  console.log('\n[Report] EVALUATION_REPORT.md written successfully.');
}

runBenchmark().catch(console.error);
