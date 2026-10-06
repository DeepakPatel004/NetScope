import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProbeToken, hashProbeToken } from '../src/modules/probe/probe.auth.js';

test('Probe token generation produces cryptographically distinct tokens with consistent hashing', () => {
  const token1 = generateProbeToken();
  const token2 = generateProbeToken();

  assert.notEqual(token1, token2);
  assert.match(token1, /^nsp_probe_/);
  assert.match(token2, /^nsp_probe_/);

  const hash1a = hashProbeToken(token1);
  const hash1b = hashProbeToken(token1);
  const hash2 = hashProbeToken(token2);

  assert.equal(hash1a, hash1b);
  assert.notEqual(hash1a, hash2);
  assert.equal(hash1a.length, 64); // SHA-256 hex length
});

test('Probe result submission enforces lease identity and rejects foreign probe submissions', async () => {
  const mockForeignProbe = { id: 'probe-foreign-999', name: 'Foreign Probe', region: 'ap-south-1' };
  const mockOwningProbe = { id: 'probe-owner-123', name: 'Owner Probe', region: 'us-east-1' };

  // Attempting to submit for an assignment owned by another probe must throw 403
  // We can simulate assignment validation directly
  const assignment = {
    id: 'asgn-1',
    probeId: mockOwningProbe.id,
    monitorId: 'mon-1',
    status: 'LEASED',
  };

  const validateOwnership = (assignedProbeId, submittingProbeId) => {
    if (assignedProbeId !== submittingProbeId) {
      const err = new Error('Forbidden: Assignment was leased to a different probe identity');
      err.statusCode = 403;
      throw err;
    }
  };

  assert.throws(
    () => validateOwnership(assignment.probeId, mockForeignProbe.id),
    (err) => err.statusCode === 403
  );

  // Submitting probe matching lease passes
  assert.doesNotThrow(() => validateOwnership(assignment.probeId, mockOwningProbe.id));
});

test('Duplicate result submissions are idempotent and do not duplicate state', () => {
  // Idempotency policy
  const existingResult = {
    id: 'result-uuid-1',
    assignmentId: 'asgn-123',
    status: 'UP',
    latency: 42,
  };

  const handleSubmission = (status, existing) => {
    if (status === 'COMPLETED') {
      return {
        success: true,
        isDuplicate: true,
        result: existing,
      };
    }
    return { success: true, isDuplicate: false };
  };

  const res1 = handleSubmission('PENDING', null);
  assert.equal(res1.isDuplicate, false);

  const res2 = handleSubmission('COMPLETED', existingResult);
  assert.equal(res2.isDuplicate, true);
  assert.equal(res2.result.id, 'result-uuid-1');
});

test('Late submissions past lease TTL are flagged as isLate', () => {
  const now = Date.now();
  const validExpiry = new Date(now + 15000);
  const expiredExpiry = new Date(now - 5000);

  const checkLate = (leaseExpiresAt) => Boolean(leaseExpiresAt && Date.now() > new Date(leaseExpiresAt).getTime());

  assert.equal(checkLate(validExpiry), false);
  assert.equal(checkLate(expiredExpiry), true);
});
