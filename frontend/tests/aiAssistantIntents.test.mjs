import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssistantIntent, assistantQuestionTree } from '../src/pages/aiAssistantIntents.mjs';

test('recognizes SSL and expiry questions', () => {
  const sslIntent = resolveAssistantIntent('When does my SSL certificate expire?');
  assert.equal(sslIntent?.category, 'ssl');
});

test('recognizes port exposure questions', () => {
  const portIntent = resolveAssistantIntent('What harm can unnecessary open ports cause?');
  assert.equal(portIntent?.category, 'ports');
});

test('returns the guided prompt tree', () => {
  assert.ok(assistantQuestionTree.health.prompts.length > 0);
  assert.ok(assistantQuestionTree.ssl.prompts.length > 0);
  assert.ok(assistantQuestionTree.ports.prompts.length > 0);
});
