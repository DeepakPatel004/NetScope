import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';

export const httpService = {
  /**
   * Performs an HTTP/HTTPS GET request with phase-by-phase latency breakdown
   * (DNS Lookup, TCP Connect, TLS Handshake, TTFB, Total Latency)
   * @param {string} urlStr - Target endpoint URL
   * @returns {Promise<{
   *   status: 'UP' | 'DOWN',
   *   latency: number | null,
   *   dnsTime: number,
   *   tcpTime: number,
   *   tlsTime: number,
   *   ttfbTime: number,
   *   responseCode: number | null,
   *   message?: string
   * }>}
   */
  async check(urlStr) {
    return new Promise((resolve) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
      } catch (err) {
        return resolve({
          status: 'DOWN',
          latency: null,
          dnsTime: 0,
          tcpTime: 0,
          tlsTime: 0,
          ttfbTime: 0,
          responseCode: null,
          message: 'INVALID_URL'
        });
      }

      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const startTime = performance.now();
      let dnsEndTime = 0;
      let tcpEndTime = 0;
      let tlsEndTime = 0;
      let ttfbEndTime = 0;
      let totalEndTime = 0;

      const reqOptions = {
        method: 'GET',
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        timeout: 10000,
        headers: {
          'User-Agent': 'NetScope-Diagnostics/2.0 (+https://github.com/DeepakPatel004/NetScope)',
          'Accept': '*/*'
        }
      };

      const req = client.request(reqOptions, (res) => {
        ttfbEndTime = performance.now();

        // Consume body data stream
        res.on('data', () => {});
        res.on('end', () => {
          totalEndTime = performance.now();

          const dnsTime = Math.max(0, Math.round(dnsEndTime ? dnsEndTime - startTime : 0));
          const tcpTime = Math.max(0, Math.round(tcpEndTime ? tcpEndTime - (dnsEndTime || startTime) : 0));
          const tlsTime = isHttps ? Math.max(0, Math.round(tlsEndTime ? tlsEndTime - tcpEndTime : 0)) : 0;
          const ttfbTime = Math.max(0, Math.round(ttfbEndTime - (tlsEndTime || tcpEndTime || dnsEndTime || startTime)));
          const latency = Math.max(1, Math.round(totalEndTime - startTime));

          const isUp = res.statusCode >= 200 && res.statusCode < 400;

          resolve({
            status: isUp ? 'UP' : 'DOWN',
            latency,
            dnsTime,
            tcpTime,
            tlsTime,
            ttfbTime,
            responseCode: res.statusCode,
            message: isUp ? 'OK' : `HTTP_${res.statusCode}`
          });
        });
      });

      req.on('socket', (socket) => {
        socket.on('lookup', () => {
          dnsEndTime = performance.now();
        });

        socket.on('connect', () => {
          tcpEndTime = performance.now();
        });

        if (isHttps) {
          socket.on('secureConnect', () => {
            tlsEndTime = performance.now();
          });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'DOWN',
          latency: null,
          dnsTime: 0,
          tcpTime: 0,
          tlsTime: 0,
          ttfbTime: 0,
          responseCode: null,
          message: 'TIMEOUT'
        });
      });

      req.on('error', (err) => {
        resolve({
          status: 'DOWN',
          latency: null,
          dnsTime: 0,
          tcpTime: 0,
          tlsTime: 0,
          ttfbTime: 0,
          responseCode: null,
          message: err.code || 'CONNECTION_FAILED'
        });
      });

      req.end();
    });
  }
};