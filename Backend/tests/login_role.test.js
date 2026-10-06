import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import { hashPassword } from '../src/utils/hash.js';
import { authService } from '../src/modules/auth/auth.service.js';

test('login returns the stored role so operator enrollment controls are visible', async t => {
  const originalUser = prisma.user;
  const originalTokens = prisma.refreshToken;
  const passwordHash = await hashPassword('local-test-password');
  prisma.user = {findUnique: async () => ({id:'operator',email:'operator@example.invalid',username:'operator',fullName:'Operator',role:'ADMIN',passwordHash})};
  prisma.refreshToken = {create: async () => ({})};
  t.after(() => {prisma.user = originalUser; prisma.refreshToken = originalTokens;});
  const result = await authService.login({email:'operator@example.invalid',password:'local-test-password'});
  assert.equal(result.user.role,'ADMIN');
  assert.equal(result.user.fullName,'Operator');
  assert.equal(result.user.passwordHash,undefined);
});
