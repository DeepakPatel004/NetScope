import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';
import { createSafeLookup, validateTargetUrl, isPrivateOrBlockedIp } from '../../security/ssrfGuard.js';

const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 1024 * 1024; // 1MB payload limit
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Executes an HTTP or HTTPS probe check with socket-level phase timings,
 * strict execution-time SSRF validation, and TLS certificate extraction.
 */
export async function executeProbeCheck(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const allowPrivateLab = Boolean(options.allowPrivateLabNetworks || process.env.ALLOW_PRIVATE_LAB_NETWORKS === 'true');
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;

  return performCheck(targetUrl, 0, maxRedirects, timeoutMs, allowPrivateLab);
}

function performCheck(urlStr, redirectCount, maxRedirects, timeoutMs, allowPrivateLab) {
  return new Promise((resolve) => {
    // 1. Initial URL validation
    const urlValidation = validateTargetUrl(urlStr, allowPrivateLab);
    if (!urlValidation.valid) {
      return resolve({
        status: 'DOWN',
        latency: null,
        dnsTime: null,
        tcpTime: null,
        tlsTime: null,
        ttfbTime: null,
        responseCode: null,
        failureStage: urlValidation.error.includes('SSRF') || urlValidation.error.includes('forbidden') ? 'SSRF_BLOCKED' : 'DNS_RESOLUTION',
        message: urlValidation.error,
        resolvedIp: null,
        tlsCert: null,
        isRedirect: redirectCount > 0,
      });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(urlValidation.url);
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

    // Use custom safe lookup for execution-time SSRF guard
    const safeLookup = createSafeLookup(allowPrivateLab);

    const reqOptions = {
      method: 'GET',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      timeout: timeoutMs,
      lookup: safeLookup,
      agent: false, // Disables keep-alive pool so socket setup timings are accurate
      rejectUnauthorized: true, // TLS verification must remain enabled
      headers: {
        'User-Agent': 'NetScope-Distributed-Probe/3.0 (+https://github.com/DeepakPatel004/NetScope)',
        'Accept': '*/*',
        'Connection': 'close',
      },
    };

    let timeoutTimer = null;

    const finish = (result) => {
      if (requestFinished) return;
      requestFinished = true;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      resolve(result);
    };

    const req = client.request(reqOptions, (res) => {
      ttfbEndTime = performance.now();
      currentStage = 'HTTP_STATUS';

      // Safe TLS certificate extraction
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
        } catch (certErr) {
          // Non-fatal if cert details fail extraction
        }
      }

      // Handle Redirects (301, 302, 303, 307, 308)
      const statusCode = res.statusCode || 0;
      const isRedirect = [301, 302, 303, 307, 308].includes(statusCode) && Boolean(res.headers.location);

      if (isRedirect) {
        if (redirectCount >= maxRedirects) {
          res.resume();
          return finish({
            status: 'DOWN',
            latency: Math.round(performance.now() - startTime),
            dnsTime: dnsEndTime ? Math.round(dnsEndTime - dnsStartTime) : null,
            tcpTime: tcpEndTime ? Math.round(tcpEndTime - tcpStartTime) : null,
            tlsTime: tlsEndTime ? Math.round(tlsEndTime - tlsStartTime) : null,
            ttfbTime: Math.round(ttfbEndTime - (tlsEndTime || tcpEndTime || dnsEndTime || startTime)),
            responseCode: statusCode,
            failureStage: 'HTTP_STATUS',
            message: `Exceeded maximum redirect limit (${maxRedirects})`,
            resolvedIp,
            tlsCert: tlsCertInfo,
          });
        }

        // Resolve relative redirect locations
        let redirectTargetUrl;
        try {
          redirectTargetUrl = new URL(res.headers.location, parsedUrl).toString();
        } catch {
          res.resume();
          return finish({
            status: 'DOWN',
            latency: Math.round(performance.now() - startTime),
            dnsTime: dnsEndTime ? Math.round(dnsEndTime - dnsStartTime) : null,
            tcpTime: tcpEndTime ? Math.round(tcpEndTime - tcpStartTime) : null,
            tlsTime: tlsEndTime ? Math.round(tlsEndTime - tlsStartTime) : null,
            ttfbTime: null,
            responseCode: statusCode,
            failureStage: 'HTTP_STATUS',
            message: `Invalid redirect location header: ${res.headers.location}`,
            resolvedIp,
            tlsCert: tlsCertInfo,
          });
        }

        res.resume(); // Discard redirect body
        // Follow redirect with re-validation
        return performCheck(redirectTargetUrl, redirectCount + 1, maxRedirects, timeoutMs, allowPrivateLab)
          .then(resolve);
      }

      // Stream response with payload size cap
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
        if (address) {
          resolvedIp = address;
        }
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
      let msg = err.message || err.code || 'CONNECTION_FAILED';

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
        err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
        currentStage === 'TLS_VERIFICATION' ||
        msg.includes('SSL') ||
        msg.includes('TLS') ||
        msg.includes('certificate')
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

    // Fallback timer in case socket events hang
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
