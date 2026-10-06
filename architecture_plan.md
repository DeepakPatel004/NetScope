# NetScope — Distributed Incident Verification: Architecture & Implementation Plan

## 1. System Mission & Scope
NetScope is an active HTTP/HTTPS endpoint monitoring and multi-probe incident verification platform. Its primary engineering purpose is distinguishing **monitored-endpoint failures** from **probe/connectivity problems** through independent verification across distributed probe locations.

Targeted as a software engineering internship showcase for **Zscaler Skybound**, the implementation emphasizes:
- Networking fundamentals (DNS resolution, TCP connection, TLS handshake, HTTP semantics, and phase-level timing breakdown).
- Reliable distributed backend processing (lease-based check assignments, idempotent submissions, expired lease recovery, and bounded retries with jitter).
- Robust security & tenant isolation (SSRF mitigation with execution-time DNS/IP revalidation, isolated tenant scopes, and separate probe operator credentials).
- Deterministic diagnosis without mandatory LLM dependency (rule-based multi-probe cross-checking, operator control endpoints, and explicit evidence/uncertainty tracking).
- Real, reproducible measurements (Fault lab comparing single-probe alerting vs. NetScope independent verification).

---

## 2. Architecture Overview

```
                      +---------------------------------------+
                      |       Central Host (Machine A)        |
                      |                                       |
                      |  +---------------------------------+  |
                      |  |     Built React Dashboard       |  |
                      |  +---------------------------------+  |
                      |                  |                    |
                      |  +---------------------------------+  |
                      |  |   Management API & Coordinator  |  |
                      |  |  (Auth, Monitors, Incidents)    |  |
                      |  +---------------------------------+  |
                      |      |                          |     |
                      |  +--------+                +-------+  |
                      |  |Postgres|                | Redis |  |
                      |  +--------+                +-------+  |
                      +---------------------------------------+
                                    ^           ^
             Outbound HTTPS Only   /             \   Outbound HTTPS Only
             (Assignments & Results)             (Assignments & Results)
                                  /               \
        +----------------------------+   +----------------------------+
        |   Remote Probe (Region A)  |   |   Remote Probe (Region B)  |
        |   - Check Runner           |   |   - Check Runner           |
        |   - SSRF Validator         |   |   - SSRF Validator         |
        |   - Latency Instrumentation|   |   - Latency Instrumentation|
        +----------------------------+   +----------------------------+
                      \                                 /
                       \                               /
                        v                             v
           +-----------------------------------------------+
           |    Monitored HTTP/HTTPS Targets & Controls    |
           +-----------------------------------------------+
```

### Component Roles:
1. **Central Coordinator (Machine A)**:
   - Hosts the versioned Management & Probe REST API (`/api/v3/...`).
   - Serves the built production React frontend.
   - Schedules routine checks as durable leases in PostgreSQL.
   - Evaluates observations, coordinates bounded diagnostic investigations, and maintains incident state.
   - Backed by PostgreSQL (durable records) and Redis (rate limits, counters, coordination).
2. **Remote Probes (Machines B & C)**:
   - Outbound HTTPS workers running in independent locations/regions.
   - Authenticate with unique probe credentials (`Bearer <probeToken>`).
   - Poll / lease check assignments from the coordinator.
   - Execute socket-level HTTP/HTTPS checks (DNS -> TCP -> TLS -> TTFB).
   - Apply SSRF filters on target host & IP destinations.
   - Post idempotent results back to the coordinator.
   - No inbound open ports required on probe hosts.

---

## 3. Reusable vs. Replaced Components

| Component | Current State | Strategy | Rationale |
| :--- | :--- | :--- | :--- |
| **User & Tenant Auth** | JWT auth, bcrypt passwords, Prisma models | **Reuse & Extend** | Solid foundation for tenant scoping; add probe operator role / probe API tokens. |
| **Prisma Schema** | Devices, HealthLogs, Anomalies, Incidents | **Extend Forward** | Add `Probe`, `CheckAssignment`, `ControlEndpoint` models. Keep backwards compatibility with `Device` / `HealthLog`. |
| **Host Agent & Auto-Recovery** | `agent.py`, `recovery.service.js` | **Permanently Decommission** | Out of scope. Monitoring is purely external HTTP/HTTPS without host agents. |
| **HTTP Check Logic** | `http.service.js` socket hooks | **Upgrade & Harden** | Add strict SSRF filter (block loopback, private RFC1918, link-local, cloud metadata), cert metadata extraction, max response size, and failure stages. |
| **Incident Engine** | Single-node debounced counter | **Replace with Multi-Probe Verifier** | Transition to multi-probe confirmation: anomaly -> trigger follow-up checks on other probes + control check -> classify situation -> open/update incident. |
| **Scheduler** | In-memory cron + BullMQ | **Rebuild with Durable Leases** | Persist scheduled checks in DB with bounded lease TTLs to prevent job loss across worker restarts. |
| **Frontend UI** | Complex AI-themed dashboard | **Rebuild Clean & Informative** | Neutral surfaces, matrix of monitors by probe location, real latency breakdowns, honest uncertainty indicators. |

---

## 4. Probe Assignment & Result Lifecycle

```
[SCHEDULED] 
     │
     ▼
[PENDING] ──── Probe fetches via GET /api/v3/probes/assignments ────► [LEASED]
                                                                        │
        ┌───────────────────────────────────────────────────────────────┴────────────────────────┐
        ▼                                                                                        ▼
[COMPLETED] (Idempotent result submitted within lease TTL)                        [EXPIRED] (Lease TTL passed)
        │                                                                                        │
        ▼                                                                                        ▼
Observation evaluated for anomaly & diagnostic follow-up                         Re-queued or marked failed attempt
```

### Safety & Idempotency Rules:
- Assignment has `id`, `probeId`, `leaseExpiresAt`, `attemptCount`.
- Results are strictly bound to the assigned `probeId` and `assignmentId`. Submissions from other probes are rejected (403 Forbidden).
- Late submissions after lease expiry are recorded with `isLate: true` and excluded from real-time incident diagnosis.
- Duplicate submissions for the same assignment return the recorded result without duplicate database insertions or alert triggers.

---

## 5. Bounded Diagnostic Follow-up & Assessment Engine

When an observation deviates (status DOWN, connection timeout, DNS failure, TLS failure, or latency > baseline threshold):
1. **Throttle & Budget Check**: Ensure target is not already under active investigation and tenant budget has not exceeded limits.
2. **Investigation Dispatch**:
   - Coordinator schedules a **confirmation check** on a *different* healthy probe location.
   - Coordinator schedules a **control check** on the reporting probe against a configured operator control endpoint.
3. **Assessment Classification**:
   - **`WIDESPREAD_FAILURE`**: Target fails across all eligible healthy probes.
   - **`LOCATION_SPECIFIC_FAILURE`**: Target fails in Region A but succeeds in Region B; control endpoint from Region A succeeds.
   - **`PROBE_CONNECTIVITY_SUSPECTED`**: Target fails from Region A AND Region A's control check fails (issue is Region A's network, not the target!).
   - **`DNS_FAILURE`**: DNS resolution error (NXDOMAIN / ServFail) confirmed.
   - **`TLS_CERTIFICATE_FAILURE`**: Untrusted cert, expired cert, or TLS handshake failure.
   - **`LATENCY_DEGRADATION`**: Latency exceeds baseline significantly across participating probes.
   - **`INSUFFICIENT_EVIDENCE`**: Unresponsive probes, conflicting observations, or incomplete diagnostic cycle.
4. **Incident Lifecycle**:
   - Opens or updates an incident with structured evidence:
     - Root cause category / assessment.
     - Participating probes and individual verdicts.
     - Diagnostic failure stage.
     - Known evidence vs. remaining uncertainties.
   - Incident recovers only when **confirmed healthy observations** (e.g. 2 consecutive healthy checks from all assigned probes) are recorded.

---

## 6. Security & SSRF Protection Architecture

- **Creation & Execution Time Guard**:
  - Target URLs are parsed and hostnames resolved before dialing.
  - IP destinations are matched against strict blacklists:
    - IPv4: `0.0.0.0/8`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` (Link-local & AWS metadata `169.254.169.254`).
    - IPv6: `::1`, `fc00::/7` (Unique Local), `fe80::/10` (Link-local).
  - Explicit Lab Profile: For local Docker development, private IPs are only allowed if `ALLOW_PRIVATE_LAB_NETWORKS=true` is explicitly configured.
  - Redirect protection: HTTP redirects (301/302) are intercepted and destination URLs are re-filtered through the SSRF guard before following.
- **Tenant Scoping**: All monitors, check logs, and incidents are strictly isolated by `userId`.

---

## 7. Fault Lab & Quantitative Evaluation

A reproducible Docker fault lab provides controlled conditions to empirically benchmark:
- **Policy A (Single-Probe Alerting)**: Alerts immediately on a single failed check.
- **Policy B (NetScope Multi-Probe Verification)**: Cross-checks across 2 probes and control endpoints before alerting.

### Measured Metrics:
1. **False Outage Alerts**: Number of alerts triggered during localized probe network blips.
2. **Detection & Confirmation Delay (MTTD)**: Time from fault injection to confirmed incident.
3. **Investigation Overhead**: Number of additional follow-up requests per incident.
4. **Result Latency & Lease Throughput**.

---

## 8. Implementation Milestones

- [x] **Milestone 1**: Codebase inspection, repository plan, architecture decision record.
- [ ] **Milestone 2**: Database schema migration (`Probe`, `CheckAssignment`, `ControlEndpoint`, updated `Incident`).
- [ ] **Milestone 3**: Enhanced probe execution engine with SSRF guard, socket timing breakdowns, and cert inspection.
- [ ] **Milestone 4**: Coordinator probe API (`/api/v3/probes/...`) with token auth, lease management, and idempotent result submission.
- [ ] **Milestone 5**: Distributed verification & incident classification engine.
- [ ] **Milestone 6**: Standalone probe client & Docker packaging.
- [ ] **Milestone 7**: Clean, high-density React UI (matrix view, evidence inspector, probe management).
- [ ] **Milestone 8**: Docker fault lab & automated benchmarking script.
- [ ] **Milestone 9**: Terraform deployment scripts, protocol documentation, and final report.
