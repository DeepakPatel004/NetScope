import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateOrBlockedIp, validateTargetUrl, redactUrl } from '../src/security/ssrfGuard.js';

test('SSRF Guard blocks IPv4 loopback, private ranges, link-local, and cloud metadata', () => {
  // Loopback
  assert.equal(isPrivateOrBlockedIp('127.0.0.1'), true);
  assert.equal(isPrivateOrBlockedIp('127.255.255.255'), true);

  // RFC1918 Private ranges
  assert.equal(isPrivateOrBlockedIp('10.0.0.1'), true);
  assert.equal(isPrivateOrBlockedIp('172.16.0.1'), true);
  assert.equal(isPrivateOrBlockedIp('172.31.255.254'), true);
  assert.equal(isPrivateOrBlockedIp('192.168.1.1'), true);

  // Link-local & AWS/Cloud Metadata (169.254.169.254)
  assert.equal(isPrivateOrBlockedIp('169.254.169.254'), true);
  assert.equal(isPrivateOrBlockedIp('169.254.1.1'), true);

  // Current network & Multicast
  assert.equal(isPrivateOrBlockedIp('0.0.0.0'), true);
  assert.equal(isPrivateOrBlockedIp('224.0.0.1'), true);
  assert.equal(isPrivateOrBlockedIp('255.255.255.255'), true);
});

test('SSRF Guard blocks IPv6 loopback, link-local, and unique local addresses', () => {
  // IPv6 loopback
  assert.equal(isPrivateOrBlockedIp('::1'), true);
  assert.equal(isPrivateOrBlockedIp('::'), true);

  // IPv6 link-local
  assert.equal(isPrivateOrBlockedIp('fe80::1'), true);

  // IPv6 unique local (fc00::/7)
  assert.equal(isPrivateOrBlockedIp('fc00::1'), true);
  assert.equal(isPrivateOrBlockedIp('fd12:3456:789a::1'), true);

  // IPv4-mapped IPv6
  assert.equal(isPrivateOrBlockedIp('::ffff:127.0.0.1'), true);
  assert.equal(isPrivateOrBlockedIp('::ffff:169.254.169.254'), true);
});

test('SSRF Guard permits public routable IP addresses', () => {
  assert.equal(isPrivateOrBlockedIp('8.8.8.8'), false);
  assert.equal(isPrivateOrBlockedIp('1.1.1.1'), false);
  assert.equal(isPrivateOrBlockedIp('93.184.216.34'), false); // example.com
});

test('ALLOW_PRIVATE_LAB_NETWORKS permits RFC1918 docker lab subnets but STRICTLY keeps 169.254 metadata blocked', () => {
  // RFC1918 allowed in lab mode
  assert.equal(isPrivateOrBlockedIp('172.20.0.5', true), false);
  assert.equal(isPrivateOrBlockedIp('10.244.0.1', true), false);
  assert.equal(isPrivateOrBlockedIp('192.168.1.50', true), false);

  // Cloud metadata MUST REMAIN BLOCKED even in lab mode!
  assert.equal(isPrivateOrBlockedIp('169.254.169.254', true), true);
  assert.equal(isPrivateOrBlockedIp('169.254.0.1', true), true);
  assert.equal(isPrivateOrBlockedIp('fe80::1', true), true);
});

test('validateTargetUrl blocks credentials, unsupported protocols, and localhost', () => {
  // Embedded basic auth
  const credsCheck = validateTargetUrl('https://admin:secret123@api.example.com');
  assert.equal(credsCheck.valid, false);
  assert.match(credsCheck.error, /Embedded basic authentication/);

  // Unsupported protocols
  const ftpCheck = validateTargetUrl('ftp://files.example.com');
  assert.equal(ftpCheck.valid, false);

  const fileCheck = validateTargetUrl('file:///etc/passwd');
  assert.equal(fileCheck.valid, false);

  // Localhost
  const localCheck = validateTargetUrl('http://localhost:8080');
  assert.equal(localCheck.valid, false);

  // Valid public HTTPS target
  const validCheck = validateTargetUrl('https://api.example.com/health?service=payment');
  assert.equal(validCheck.valid, true);
});

test('redactUrl strips username and password from URLs', () => {
  assert.equal(redactUrl('https://user:password@service.net/api'), 'https://REDACTED:REDACTED@service.net/api');
  assert.equal(redactUrl('https://public.service.net/api'), 'https://public.service.net/api');
});
