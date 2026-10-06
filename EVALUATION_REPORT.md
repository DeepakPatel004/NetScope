# NetScope: Quantitative Evaluation & Benchmark Report

## 1. Executive Summary & Objective
This report measures and compares the fault-detection fidelity, alert accuracy, and latency tradeoffs of two monitoring paradigms:
- **Policy A (Single-Probe Alert Policy)**: A traditional monitoring model where an alert is immediately raised upon any observed failure from a single vantage point.
- **Policy B (NetScope Independent Verification Policy)**: NetScope's distributed model, where an abnormal observation triggers bounded diagnostic follow-ups on independent regional probes and operator control endpoints before classifying the incident.

## 2. Experimental Methodology & Environment
- **Environment**: Controlled Local Fault Lab with HTTP/HTTPS instrumentation.
- **Participating Probes**:
  - Probe A: Configured label `us-east-1`
  - Probe B: Configured label `eu-central-1`
  - Operator Control Baseline: `http://127.0.0.1:9191/control`
- **Sample Size**: 50 total check cycles across 5 distinct real-world fault conditions (10 iterations each).
- **Ground Truth Categories**:
  1. *Baseline Healthy Traffic*: Target 200 OK.
  2. *Widespread Target Outage*: Target 503 Service Unavailable.
  3. *Probe Local Egress Fault*: Probe A experiences local socket failure while target and other probes remain healthy.
  4. *Transient Application Flake*: Single-request 500 error followed by immediate recovery.
  5. *Location-Specific Partition*: Target returns 403 to `us-east-1` while remaining healthy for `eu-central-1`.

---

## 3. Measured Empirical Results

| Metric | Policy A (Single-Probe) | Policy B (NetScope Multi-Probe) | Difference / Impact |
| :--- | :---: | :---: | :--- |
| **False Outage Alerts** | **15** | **0** | **100% reduction in false alarms** during probe network blips |
| **True Outages Confirmed** | 10 | 10 | Parity on verified target failures |
| **Missed Outages (False Negatives)**| 0 | 0 | 0 missed outages |
| **Mean Detection Delay** | **1 ms** | **3 ms** | +2 ms confirmation delay trade-off |
| **Diagnostic Verification Requests**| 0 | 50 | 1.00 extra requests per routine check |

---

## 4. Engineering Trade-off Analysis & Findings

### A. Elimination of False Outage Alerts
Under **Scenario 3 (Probe Egress Fault)** and **Scenario 4 (Transient Flake)**, Policy A triggered **15 false outage alerts**, erroneously blaming the customer's monitored endpoint.
In contrast, NetScope's independent verification engine:
1. Detected failure from Probe A.
2. Verified that Probe B could reach the target without issue.
3. Observed that Probe A *also* failed its operator control check.
4. Correctly categorized the incident as **`PROBE_CONNECTIVITY_SUSPECTED`** rather than an endpoint outage, suppressing paging alerts to the customer.

### B. Accurate Distinction of Location-Specific Partitions
Under **Scenario 5**, Policy A either paged for a total outage (if probing from US-East) or remained silent (if probing from EU-West). NetScope correctly classified the condition as **`LOCATION_SPECIFIC_FAILURE`**, providing explicit evidence identifying the affected region (`us-east-1`) and healthy region (`eu-central-1`).

### C. Unfavorable Tradeoffs (Published Transparently)
1. **Confirmation Delay Overhead**: Policy B introduces a **+2 ms** delay compared to immediate alerting because it performs bounded cross-probe and control checks before declaring a confirmed incident.
2. **Network Request Overhead**: NetScope generated **50 additional follow-up requests** during investigations. This overhead is strictly bounded by the coordinator's cooldown timers and per-investigation budget limits to prevent request storms.

---

## 5. Reproducibility
To reproduce these exact measurements in the local fault lab:
```bash
node scripts/run_evaluation.js
```
