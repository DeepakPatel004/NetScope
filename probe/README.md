# NetScope remote probe

A standalone Node.js process that polls the coordinator for leased HTTP/HTTPS checks, executes them, and submits observations. It does not collect CPU metrics or restart monitored services.

Probes initiate outbound connections and do not connect directly to PostgreSQL or Redis. Failed submissions are not a durable local result buffer; coordinator assignment retries provide a later opportunity to check again.

| Variable | Default / purpose |
| --- | --- |
| `COORDINATOR_URL` | `http://localhost:5000`; use HTTPS outside the local lab |
| `PROBE_TOKEN` | Required enrollment credential |
| `PROBE_REGION` | Operator-assigned location label |
| `POLL_INTERVAL_MS` | `2000` |
| `HEARTBEAT_INTERVAL_MS` | `15000` |
| `ALLOW_PRIVATE_LAB_NETWORKS` | `false`; enable only in an isolated lab |

```bash
npm ci
npm test
docker build -t netscope-probe:local .
```

See the [deployment guide](../deploy/DEPLOYMENT_GUIDE.md) for remote configuration. Address filtering in this runner is separate from the backend SSRF helper; backend helper tests do not establish full runner security coverage.
