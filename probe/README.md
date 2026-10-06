# NetScope Remote Monitoring Probe

The NetScope probe is a lightweight, stateless monitoring daemon deployed across independent cloud regions (e.g., AWS `us-east-1`, GCP `europe-west3`).

## Key Characteristics:
- **Zero Inbound Ports**: Probes initiate 100% of network connections outbound over HTTPS to the Central Coordinator. Probes never listen on public ports.
- **Stateless & Resilient**: Probes do not connect directly to PostgreSQL or Redis. Check jobs are retrieved via lease tokens and results posted idempotently.
- **Network Instrumentation**: Executes raw socket-level checks capturing DNS lookup time, TCP connection time, TLS handshake time, TTFB, and certificate trust status.
- **Execution-Time SSRF Defense**: Enforces local IP checks before connecting, protecting against DNS rebinding, internal cloud metadata access (`169.254.169.254`), and loopback attacks.
- **Jittered Backoff**: Automatically handles transient coordinator outages with exponential backoff and randomized jitter.

## Configuration (Environment Variables)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `COORDINATOR_URL` | HTTPS base URL of the Central Coordinator | `http://localhost:5000` |
| `PROBE_TOKEN` | Bearer token provided upon probe enrollment | *Required* |
| `PROBE_REGION` | Geographic / cloud region identifier (e.g. `us-east-1`) | `unspecified-region` |
| `POLL_INTERVAL_MS` | Delay between assignment polling cycles | `2000` |
| `HEARTBEAT_INTERVAL_MS` | Process health check-in interval | `15000` |
| `ALLOW_PRIVATE_LAB_NETWORKS` | Set to `true` strictly for local Docker Compose test labs | `false` |

## Running Locally / In Docker
```bash
docker run -d \
  --name netscope-probe-useast \
  -e COORDINATOR_URL=https://netscope.yourdomain.com \
  -e PROBE_TOKEN=nsp_probe_... \
  -e PROBE_REGION=us-east-1 \
  netscope-probe:latest
```
