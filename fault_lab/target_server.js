import http from 'http';

const PORT = Number(process.env.PORT) || 9090;

let flakyCounter = 0;

/**
 * Fault Target Server
 * Simulates controlled real-world networking & application fault conditions.
 */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const region = req.headers['x-probe-region'] || (req.headers['user-agent']?.match(/\((.*?)\)/)?.[1]) || 'unknown';

  // 1. Healthy Endpoint
  if (url.pathname === '/healthy') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'healthy', timestamp: Date.now() }));
  }

  // 2. Target Outage (HTTP 503)
  if (url.pathname === '/outage') {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Service Unavailable', code: 'OUTAGE_SIMULATED' }));
  }

  // 3. Slow Response (Latency Anomaly)
  if (url.pathname === '/slow') {
    const delayMs = Number(url.searchParams.get('delay')) || 2500;
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'slow_response', delayedMs: delayMs }));
    }, delayMs);
    return;
  }

  // 4. Transient Flaky Blip (1 failure every 5 requests)
  if (url.pathname === '/flaky') {
    flakyCounter++;
    if (flakyCounter % 5 === 1) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Transient Internal Error' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', counter: flakyCounter }));
  }

  // 5. Location-Specific Failure (Simulates Geo-blocking or peering failure in us-east-1)
  if (url.pathname === '/geo-blocked') {
    if (region.includes('us-east')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Forbidden for region us-east', region }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'accessible', region }));
  }

  // 6. Operator Control Endpoint Baseline
  if (url.pathname === '/control') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'control_ok', provider: 'NetScope-Operator-Control' }));
  }

  // 7. Oversized Payload (>1MB)
  if (url.pathname === '/payload-overflow') {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    const chunk = Buffer.alloc(64 * 1024, 'X');
    for (let i = 0; i < 25; i++) {
      res.write(chunk); // 1.6MB total
    }
    return res.end();
  }

  // Default Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[FaultLabTarget] Controlled fault server running on port ${PORT}`);
});
