import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Lightweight HTTP client for remote probe communication with coordinator.
 * Implements exponential backoff with jitter for transient coordinator outages.
 */
export class CoordinatorClient {
  constructor(options = {}) {
    this.coordinatorUrl = (options.coordinatorUrl || process.env.COORDINATOR_URL || 'http://localhost:5000').replace(/\/$/, '');
    this.probeToken = options.probeToken || process.env.PROBE_TOKEN;
    this.region = options.region || process.env.PROBE_REGION || 'unspecified-region';
    this.version = options.version || '1.0.0';

    if (!this.probeToken) {
      console.warn('[CoordinatorClient] Warning: PROBE_TOKEN is not configured.');
    }
  }

  async request(method, path, body = null, retries = 3) {
    const fullUrl = `${this.coordinatorUrl}${path}`;
    const parsed = new URL(fullUrl);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const payload = body ? JSON.stringify(body) : null;

    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await new Promise((resolve, reject) => {
          const reqOptions = {
            method,
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: `${parsed.pathname}${parsed.search}`,
            headers: {
              'User-Agent': `NetScope-Remote-Probe/${this.version} (${this.region})`,
              'Authorization': `Bearer ${this.probeToken}`,
              'Content-Type': 'application/json',
              ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
            },
            timeout: 10000,
          };

          const req = client.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve(json);
                } else {
                  const error = new Error(json.message || `HTTP ${res.statusCode}`);
                  error.statusCode = res.statusCode;
                  error.body = json;
                  reject(error);
                }
              } catch (parseErr) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve({ raw: data });
                } else {
                  reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
              }
            });
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Coordinator request timed out'));
          });

          req.on('error', reject);

          if (payload) {
            req.write(payload);
          }
          req.end();
        });
      } catch (err) {
        attempt++;
        if (attempt > retries || (err.statusCode && err.statusCode < 500 && err.statusCode !== 429)) {
          // Do not retry 4xx errors (e.g. 401 Unauthorized, 403 Forbidden, 404 Not Found)
          throw err;
        }

        // Exponential backoff with random jitter: (base * 2^attempt) + jitter
        const baseMs = 500;
        const backoffMs = Math.min(baseMs * Math.pow(2, attempt), 8000) + Math.random() * 500;
        console.warn(`[CoordinatorClient] Coordinator call failed (${err.message}). Retrying in ${Math.round(backoffMs)}ms (attempt ${attempt}/${retries})...`);
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }
  }

  async sendHeartbeat(activeLeases = 0) {
    return this.request('POST', '/api/v3/probes/heartbeat', {
      version: this.version,
      activeLeases,
      region: this.region,
    });
  }

  async fetchAssignments(limit = 5) {
    return this.request('GET', `/api/v3/probes/assignments?limit=${limit}`);
  }

  async submitResult(assignmentId, result) {
    return this.request('POST', `/api/v3/probes/assignments/${assignmentId}/results`, result);
  }
}
