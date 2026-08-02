import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInsightPrompt, buildFallbackSummary } from '../src/modules/ai/prompt.builder.js';

test('buildInsightPrompt creates a beginner-friendly SSL prompt', () => {
  const prompt = buildInsightPrompt('ssl', {
    ssl: {
      issuer: 'Example CA',
      status: 'VALID',
      daysRemaining: 45,
      subject: 'example.com'
    }
  });

  assert.match(prompt, /What SSL is/i);
  assert.match(prompt, /healthy/i);
  assert.match(prompt, /Example CA/i);
});

test('buildFallbackSummary returns the required response shape', () => {
  const result = buildFallbackSummary('health', {
    recentStatus: 'DOWN',
    issueCount: 2
  });

  assert.equal(typeof result.summary, 'string');
  assert.ok(Array.isArray(result.recommendations));
  assert.ok(result.recommendations.length > 0);
});
