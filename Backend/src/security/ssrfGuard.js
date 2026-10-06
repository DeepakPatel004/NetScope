import dns from 'dns';
import net from 'net';
import { URL } from 'url';

/**
 * Checks if an IPv4 address is in a reserved/private/link-local/metadata range.
 */
function isBlockedIpv4(ip, allowPrivateLabNetworks = false) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP is blocked
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) {
    return !allowPrivateLabNetworks;
  }

  // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
  // NEVER ALLOW LINK-LOCAL / CLOUD METADATA, even in private lab mode!
  if (a === 169 && b === 254) return true;

  // Multicast (224.0.0.0/4) & Reserved (240.0.0.0/4) & Broadcast (255.255.255.255)
  if (a >= 224) return true;

  // RFC1918 Private Ranges
  // 10.0.0.0/8
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  // 192.168.0.0/16
  const isRfc1918 = (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );

  if (isRfc1918) {
    if (allowPrivateLabNetworks) {
      return false; // Permitted strictly for local Docker fault lab
    }
    return true;
  }

  // 100.64.0.0/10 (Carrier Grade NAT / Shared Address Space)
  if (a === 100 && b >= 64 && b <= 127) {
    return !allowPrivateLabNetworks;
  }

  return false;
}

/**
 * Checks if an IPv6 address is in a reserved/private/link-local range.
 */
function isBlockedIpv6(ip, allowPrivateLabNetworks = false) {
  const normalized = ip.toLowerCase();

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.substring(7);
    if (net.isIPv4(v4Part)) {
      return isBlockedIpv4(v4Part, allowPrivateLabNetworks);
    }
  }

  // ::1 (Loopback) or :: (Unspecified)
  if (normalized === '::1' || normalized === '::') return true;

  // fe80::/10 (Link-Local) - ALWAYS BLOCKED
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }

  // fc00::/7 (Unique Local Address)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return !allowPrivateLabNetworks;
  }

  // ff00::/8 (Multicast)
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Validates if an IP address (IPv4 or IPv6) is permitted for outbound checks.
 */
export function isPrivateOrBlockedIp(ip, allowPrivateLabNetworks = false) {
  if (!ip) return true;

  const family = net.isIP(ip);
  if (family === 4) {
    return isBlockedIpv4(ip, allowPrivateLabNetworks);
  }
  if (family === 6) {
    return isBlockedIpv6(ip, allowPrivateLabNetworks);
  }

  return true; // Invalid IP format is treated as blocked
}

/**
 * Redacts credentials from target URLs (e.g. http://admin:pass@host/path -> http://[REDACTED]@host/path)
 */
export function redactUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.username || parsed.password) {
      parsed.username = 'REDACTED';
      parsed.password = 'REDACTED';
    }
    return parsed.toString();
  } catch {
    return urlStr;
  }
}

/**
 * Validates target URL structure at creation/update time.
 */
export function validateTargetUrl(urlStr, allowPrivateLabNetworks = false) {
  if (!urlStr || typeof urlStr !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let parsed;
  try {
    const raw = urlStr.trim();
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
    parsed = new URL(hasScheme ? raw : `https://${raw}`);
  } catch (err) {
    return { valid: false, error: 'Malformed URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only http: and https: protocols are supported' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: 'Embedded basic authentication credentials in URLs are not permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and common loopback aliases
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'local' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    if (!allowPrivateLabNetworks) {
      return { valid: false, error: 'Loopback and localhost destinations are forbidden' };
    }
  }

  // If host is already an IP, validate directly
  if (net.isIP(hostname)) {
    if (isPrivateOrBlockedIp(hostname, allowPrivateLabNetworks)) {
      return { valid: false, error: `Direct IP destination ${hostname} is blocked by SSRF policy` };
    }
  }

  return { valid: true, url: parsed.toString(), hostname, protocol: parsed.protocol };
}

/**
 * Creates a safe DNS lookup function for Node's http/https request options.
 * Validates the resolved IP before allowing the socket connection to proceed,
 * preventing DNS rebinding and execution-time SSRF.
 */
export function createSafeLookup(allowPrivateLabNetworks = false) {
  return function safeLookup(hostname, options, callback) {
    // Handle overloaded callback signature
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'object' ? options : {};

    dns.lookup(hostname, { ...opts, all: false }, (err, address, family) => {
      if (err) {
        return cb(err);
      }

      if (isPrivateOrBlockedIp(address, allowPrivateLabNetworks)) {
        const ssrfError = new Error(`SSRF_BLOCKED: Destination IP ${address} (${hostname}) is blocked by security policy`);
        ssrfError.code = 'ERR_SSRF_BLOCKED';
        return cb(ssrfError);
      }

      return cb(null, address, family);
    });
  };
}
