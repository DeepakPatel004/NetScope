import test from 'node:test';
import assert from 'node:assert/strict';
import { multiProbeVerifier } from '../src/modules/verification/multiProbeVerifier.js';

const mockDevice = {
  id: 'device-test-1',
  name: 'API Gateway Production',
  host: 'https://api.example.com/health',
  baselineLatency: 45,
};

const probeEast = { id: 'probe-us-east', name: 'US-East AWS Probe', region: 'us-east-1' };
const probeWest = { id: 'probe-eu-west', name: 'EU-West GCP Probe', region: 'eu-west-1' };

test('Classifier: Widespread Failure observed when target fails from all participating locations', () => {
  const reportingResult = {
    status: 'DOWN',
    failureStage: 'HTTP_STATUS',
    responseCode: 503,
    latency: 120,
    message: 'HTTP_503 Service Unavailable',
  };

  const recentResults = [
    { probeId: probeEast.id, status: 'DOWN', probe: probeEast },
    { probeId: probeWest.id, status: 'DOWN', probe: probeWest },
  ];

  const controlStatus = {
    [probeEast.id]: { status: 'UP', url: 'https://control.internal' },
    [probeWest.id]: { status: 'UP', url: 'https://control.internal' },
  };

  const assessment = multiProbeVerifier.classifySituation({
    device: mockDevice,
    reportingProbe: probeEast,
    reportingResult,
    recentResults,
    controlStatus,
  });

  assert.equal(assessment.assessment, 'WIDESPREAD_FAILURE');
  assert.equal(assessment.priority, 'CRITICAL');
  assert.deepEqual(assessment.affectedLocations.sort(), ['eu-west-1', 'us-east-1']);
  assert.ok(assessment.uncertainties.length > 0);
});

test('Classifier: Location-Specific Failure observed when Region A fails, Region B succeeds, and control passes', () => {
  const reportingResult = {
    status: 'DOWN',
    failureStage: 'TCP_CONNECTION',
    latency: null,
    message: 'ECONNREFUSED',
  };

  const recentResults = [
    { probeId: probeEast.id, status: 'DOWN', probe: probeEast, failureStage: 'TCP_CONNECTION' },
    { probeId: probeWest.id, status: 'UP', probe: probeWest, latency: 50 },
  ];

  const controlStatus = {
    [probeEast.id]: { status: 'UP', url: 'https://control.internal' },
    [probeWest.id]: { status: 'UP', url: 'https://control.internal' },
  };

  const assessment = multiProbeVerifier.classifySituation({
    device: mockDevice,
    reportingProbe: probeEast,
    reportingResult,
    recentResults,
    controlStatus,
  });

  assert.equal(assessment.assessment, 'LOCATION_SPECIFIC_FAILURE');
  assert.equal(assessment.priority, 'MEDIUM');
  assert.deepEqual(assessment.affectedLocations, ['us-east-1']);
});

test('Classifier: Probe Connectivity Suspected when target fails AND reporting probe control check fails', () => {
  const reportingResult = {
    status: 'DOWN',
    failureStage: 'TIMEOUT',
    latency: 10000,
    message: 'Connection timed out',
  };

  const recentResults = [
    { probeId: probeEast.id, status: 'DOWN', probe: probeEast, failureStage: 'TIMEOUT' },
    { probeId: probeWest.id, status: 'UP', probe: probeWest, latency: 45 },
  ];

  // Notice: probeEast has a failing control check!
  const controlStatus = {
    [probeEast.id]: { status: 'DOWN', url: 'https://control.internal', latency: null },
    [probeWest.id]: { status: 'UP', url: 'https://control.internal' },
  };

  const assessment = multiProbeVerifier.classifySituation({
    device: mockDevice,
    reportingProbe: probeEast,
    reportingResult,
    recentResults,
    controlStatus,
  });

  assert.equal(assessment.assessment, 'PROBE_CONNECTIVITY_SUSPECTED');
  assert.match(assessment.summary, /cluster at probe/);
  assert.match(assessment.summary, /Probe egress or connectivity degradation suspected/);
});

test('Classifier: DNS Failure observed when DNS resolution fails', () => {
  const reportingResult = {
    status: 'DOWN',
    failureStage: 'DNS_RESOLUTION',
    latency: null,
    message: 'ENOTFOUND: getaddrinfo failed',
  };

  const assessment = multiProbeVerifier.classifySituation({
    device: mockDevice,
    reportingProbe: probeEast,
    reportingResult,
    recentResults: [],
    controlStatus: {},
  });

  assert.equal(assessment.assessment, 'DNS_FAILURE');
  assert.equal(assessment.failedStage, 'DNS_RESOLUTION');
  assert.equal(assessment.priority, 'HIGH');
});

test('Classifier: TLS Certificate Failure observed with certificate metadata', () => {
  const reportingResult = {
    status: 'DOWN',
    failureStage: 'TLS_VERIFICATION',
    latency: 180,
    message: 'CERT_HAS_EXPIRED',
    tlsCert: { issuer: "Let's Encrypt", daysRemaining: -2 },
  };

  const assessment = multiProbeVerifier.classifySituation({
    device: mockDevice,
    reportingProbe: probeEast,
    reportingResult,
    recentResults: [],
    controlStatus: {},
  });

  assert.equal(assessment.assessment, 'TLS_CERTIFICATE_FAILURE');
  assert.equal(assessment.failedStage, 'TLS_VERIFICATION');
  assert.match(assessment.summary, /CERT_HAS_EXPIRED/);
});

test('Classifier: Latency Degradation observed when latency severely deviates from baseline', () => {
  const reportingResult = {
    status: 'UP',
    failureStage: null,
    latency: 350, // Baseline is 45ms -> > 7x baseline!
    responseCode: 200,
    message: 'OK',
  };

  const assessment = multiProbeVerifier.classifySituation({
    device: mockDevice,
    reportingProbe: probeEast,
    reportingResult,
    recentResults: [{ probeId: probeEast.id, status: 'UP', latency: 350, probe: probeEast }],
    controlStatus: {},
  });

  assert.equal(assessment.assessment, 'LATENCY_DEGRADATION');
  assert.equal(assessment.priority, 'LOW');
});

test('Classifier: Insufficient Evidence returned when observations are single or inconclusive', () => {
  const reportingResult = {
    status: 'DOWN',
    failureStage: 'TIMEOUT',
    latency: 10000,
    message: 'Connection timed out',
  };

  const assessment = multiProbeVerifier.classifySituation({
    device: mockDevice,
    reportingProbe: probeEast,
    reportingResult,
    recentResults: [{ probeId: probeEast.id, status: 'DOWN', probe: probeEast }], // Only 1 probe
    controlStatus: { [probeEast.id]: { status: 'UP' } },
  });

  assert.equal(assessment.assessment, 'INSUFFICIENT_EVIDENCE');
  assert.ok(assessment.uncertainties.some(u => u.includes('Single active probe observation')));
});
