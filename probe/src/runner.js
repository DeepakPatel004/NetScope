import http from 'http';
import https from 'https';
import dns from 'dns';
import net from 'net';
import { URL } from 'url';
import { performance } from 'perf_hooks';

const MAX_BODY_BYTES = 1024 * 1024; // 1MB payload cap

function isBlockedIp(ip, allowPrivateLab = false) {
  if (!ip) return true;
  const family = net.isIP(ip);
  if (family === 4) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    const [a, b, c, d] = parts;
    if (a === 0 || a >= 224) return true;
    if (a === 127) return !allowPrivateLab;
    if (a === 169 && b === 254) return true; // Link-local & cloud metadata ALWAYS BLOCKED
    const isPrivate = a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
    if (isPrivate) return !allowPrivateLab;
    if (a === 100 && b >= 64 && b <= 127) return !allowPrivateLab;
    return false;
  }
  if (family === 6) {
    const norm = ip.toLowerCase();
    if (norm === '::1' || norm === '::') return true;
    if (norm.startsWith('fe8') || norm.startsWith('fe9') || norm.startsWith('fea') || norm.startsWith('feb')) return true;
    if (norm.startsWith('fc') || norm.startsWith('fd')) return !allowPrivateLab;
    if (norm.startsWith('ff')) return true;
    return false;
  }
  return true;
}

export async function runCheck(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 10000;
  const allowPrivateLab = Boolean(options.allowPrivateLab);

  return new Promise((resolve) => {
    let parsedUrl;
    try {
      const raw = targetUrl.trim();
      const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
      parsedUrl = new URL(hasScheme ? raw : `https://${raw}`);
    } catch {
      return resolve({
        status: 'DOWN',
        latency: null,
        dnsTime: null,
        tcpTime: null,
        tlsTime: null,
        ttfbTime: null,
        responseCode: null,
        failureStage: 'DNS_RESOLUTION',
        message: 'Invalid URL format',
        resolvedIp: null,
        tlsCert: null,
      });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return resolve({
        status: 'DOWN',
        latency: null,
        dnsTime: null,
        tcpTime: null,
        tlsTime: null,
        ttfbTime: null,
        responseCode: null,
        failureStage: 'DNS_RESOLUTION',
        message: 'Only http and https protocols are supported',
        resolvedIp: null,
        tlsCert: null,
      });
    }

    if (parsedUrl.username || parsedUrl.password) {
      return resolve({
        status: 'DOWN',
        latency: null,
        dnsTime: null,
        tcpTime: null,
        tlsTime: null,
        ttfbTime: null,
        responseCode: null,
        failureStage: 'DNS_RESOLUTION',
        message: 'Embedded URL credentials are forbidden',
        resolvedIp: null,
        tlsCert: null,
      });
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const startTime = performance.now();
    let dnsStartTime = startTime;
    let dnsEndTime = 0;
    let tcpStartTime = 0;
    let tcpEndTime = 0;
    let tlsStartTime = 0;
    let tlsEndTime = 0;
    let ttfbEndTime = 0;
    let totalEndTime = 0;

    let resolvedIp = null;
    let tlsCertInfo = null;
    let currentStage = 'DNS_RESOLUTION';
    let bytesReceived = 0;
    let requestFinished = false;

    const safeLookup = (hostname, opts, cb) => {
      const callback = typeof opts === 'function' ? opts : cb;
      const lookupOpts = typeof opts === 'object' ? opts : {};

      dns.lookup(hostname, { ...lookupOpts, all: false }, (err, address, family) => {
        if (err) return callback(err);
        if (isBlockedIp(address, allowPrivateLab)) {
          const ssrfErr = new Error(`SSRF_BLOCKED: Destination IP ${address} (${hostname}) is blocked`);
          ssrfErr.code = 'ERR_SSRF_BLOCKED';
          return callback(ssrfErr);
        }
        callback(null, address, family);
      });
    };

    const reqOptions = {
      method: 'GET',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      timeout: timeoutMs,
      lookup: safeLookup,
      agent: false,
      rejectUnauthorized: true,
      headers: {
        'User-Agent': 'NetScope-Remote-Probe/1.0',
        'Accept': '*/*',
        'Connection': 'close',
      },
    };

    let timeoutTimer = null;

    const finish = (result) => {
      if (requestFinished) return;
      requestFinished = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      resolve({
        ...result,
        observedAt: new Date().toISOString(),
      });
    };

    const req = client.request(reqOptions, (res) => {
      ttfbEndTime = performance.now();
      currentStage = 'HTTP_STATUS';

      if (isHttps && req.socket?.getPeerCertificate) {
        try {
          const peerCert = req.socket.getPeerCertificate();
          if (peerCert && Object.keys(peerCert).length > 0) {
            const validTo = peerCert.valid_to ? new Date(peerCert.valid_to) : null;
            const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            tlsCertInfo = {
              subject: peerCert.subject?.CN || peerCert.subject?.O || 'Unknown',
              issuer: peerCert.issuer?.O || peerCert.issuer?.CN || 'Unknown',
              validFrom: peerCert.valid_from,
              validTo: peerCert.valid_to,
              daysRemaining,
              authorized: req.socket.authorized ?? true,
              fingerprint: peerCert.fingerprint,
            };
          }
        } catch {
          // Non-fatal
        }
      }

      res.on('data', (chunk) => {
        bytesReceived += chunk.length;
        if (bytesReceived > MAX_BODY_BYTES) {
          req.destroy(new Error('PAYLOAD_LIMIT_EXCEEDED'));
        }
      });

      res.on('end', () => {
        totalEndTime = performance.now();

        const dnsTime = dnsEndTime ? Math.max(0, Math.round(dnsEndTime - dnsStartTime)) : null;
        const tcpTime = tcpEndTime ? Math.max(0, Math.round(tcpEndTime - tcpStartTime)) : null;
        const tlsTime = isHttps && tlsEndTime ? Math.max(0, Math.round(tlsEndTime - tlsStartTime)) : null;
        const ttfbTime = ttfbEndTime ? Math.max(0, Math.round(ttfbEndTime - (tlsEndTime || tcpEndTime || dnsEndTime || startTime))) : null;
        const totalLatency = Math.max(1, Math.round(totalEndTime - startTime));

        const statusCode = res.statusCode || 0;
        const isUp = statusCode >= 200 && statusCode < 400;

        finish({
          status: isUp ? 'UP' : 'DOWN',
          latency: totalLatency,
          dnsTime,
          tcpTime,
          tlsTime,
          ttfbTime,
          responseCode: statusCode,
          failureStage: isUp ? null : 'HTTP_STATUS',
          message: isUp ? 'OK' : `HTTP_${statusCode}`,
          resolvedIp,
          tlsCert: tlsCertInfo,
        });
      });
    });

    req.on('socket', (socket) => {
      currentStage = 'DNS_RESOLUTION';

      socket.on('lookup', (err, address) => {
        dnsEndTime = performance.now();
        if (address) resolvedIp = address;
        tcpStartTime = dnsEndTime;
        currentStage = 'TCP_CONNECTION';
      });

      socket.on('connect', () => {
        tcpEndTime = performance.now();
        if (isHttps) {
          tlsStartTime = tcpEndTime;
          currentStage = 'TLS_VERIFICATION';
        } else {
          currentStage = 'HTTP_STATUS';
        }
      });

      if (isHttps) {
        socket.on('secureConnect', () => {
          tlsEndTime = performance.now();
          currentStage = 'HTTP_STATUS';
        });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      const elapsed = Math.round(performance.now() - startTime);
      finish({
        status: 'DOWN',
        latency: elapsed,
        dnsTime: dnsEndTime ? Math.round(dnsEndTime - dnsStartTime) : null,
        tcpTime: tcpEndTime ? Math.round(tcpEndTime - tcpStartTime) : null,
        tlsTime: tlsEndTime ? Math.round(tlsEndTime - tlsStartTime) : null,
        ttfbTime: null,
        responseCode: null,
        failureStage: 'TIMEOUT',
        message: `Connection timed out after ${timeoutMs}ms in stage ${currentStage}`,
        resolvedIp,
        tlsCert: tlsCertInfo,
      });
    });

    req.on('error', (err) => {
      const elapsed = Math.round(performance.now() - startTime);
      let failureStage = currentStage;
      const msg = err.message || err.code || 'CONNECTION_FAILED';

      if (err.code === 'ERR_SSRF_BLOCKED' || msg.includes('SSRF_BLOCKED')) {
        failureStage = 'SSRF_BLOCKED';
      } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || currentStage === 'DNS_RESOLUTION') {
        failureStage = 'DNS_RESOLUTION';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || currentStage === 'TCP_CONNECTION') {
        failureStage = 'TCP_CONNECTION';
      } else if (
        err.code === 'CERT_HAS_EXPIRED' ||
        err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
        err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        currentStage === 'TLS_VERIFICATION' ||
        msg.includes('SSL') || msg.includes('TLS') || msg.includes('certificate')
      ) {
        failureStage = 'TLS_VERIFICATION';
      } else if (msg === 'PAYLOAD_LIMIT_EXCEEDED') {
        failureStage = 'PAYLOAD_LIMIT_EXCEEDED';
      }

      finish({
        status: 'DOWN',
        latency: elapsed,
        dnsTime: dnsEndTime ? Math.round(dnsEndTime - dnsStartTime) : null,
        tcpTime: tcpEndTime ? Math.round(tcpEndTime - tcpStartTime) : null,
        tlsTime: tlsEndTime ? Math.round(tlsEndTime - tlsStartTime) : null,
        ttfbTime: null,
        responseCode: null,
        failureStage,
        message: msg,
        resolvedIp,
        tlsCert: tlsCertInfo,
      });
    });

    timeoutTimer = setTimeout(() => {
      req.destroy();
      finish({
        status: 'DOWN',
        latency: timeoutMs,
        dnsTime: dnsEndTime ? Math.round(dnsEndTime - dnsStartTime) : null,
        tcpTime: tcpEndTime ? Math.round(tcpEndTime - tcpStartTime) : null,
        tlsTime: tlsEndTime ? Math.round(tlsEndTime - tlsStartTime) : null,
        ttfbTime: null,
        responseCode: null,
        failureStage: 'TIMEOUT',
        message: `Probe check deadline exceeded (${timeoutMs}ms)`,
        resolvedIp,
        tlsCert: tlsCertInfo,
      });
    }, timeoutMs + 1000);

    req.end();
  });
}
