# NetScope

### AI-Powered Infrastructure Observability & Incident Remediation Platform

```text
MONITOR ➔ CORRELATE ➔ DETECT ➔ INVESTIGATE ➔ RECOMMEND ➔ HUMAN APPROVAL ➔ RECOVER ➔ VERIFY
```

NetScope is an autonomous infrastructure risk and incident remediation system designed for modern SRE and DevOps engineering teams. It continuously collects cross-layer telemetry across network, application, and host infrastructure signals, correlates multi-metric anomalies, executes grounded AI investigations via Model Context Protocol (MCP) tools, and enforces safe, human-governed container remediation followed by post-recovery health verification.

---

## 🚀 Why NetScope?

In production infrastructure, a service failure rarely manifests as a single isolated metric spike. A typical incident looks like this:

```text
Host CPU Spike (94%)
       +
Latency Surge (185ms)
       +
Container Memory Limit (OOMKilled)
       +
HTTP 500 Failure Rate
       ↓
Scattered Telemetry Signals
```

Looking at these signals independently leads to noisy alerts, notification fatigue, and extended Mean Time to Resolution (MTTR). Traditional monitoring tools answer **"Is my server down?"** — NetScope answers:

> **"What failed across layers, what is the probable root cause based on telemetry evidence, what is the safe recovery action, and did the service actually recover after execution?"**

### The NetScope Closed-Loop Workflow

```text
 ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
 │ 1. MONITOR     │ ───► │ 2. CORRELATE   │ ───► │ 3. DETECT      │
 │ Cross-Layer    │      │ Multi-Signal   │      │ Z-Score +      │
 │ Telemetry      │      │ Fusion         │      │ Isolation Forest│
 └────────────────┘      └────────────────┘      └───────┬────────┘
                                                         │
 ┌────────────────┐      ┌────────────────┐              │
 │ 6. RECOVER     │ ◄─── │ 5. APPROVE     │ ◄────────────┘
 │ Allowlisted    │      │ Human SRE      │      ┌────────────────┐
 │ Execution      │      │ Governance     │ ◄─── │ 4. INVESTIGATE │
 └───────┬────────┘      └────────────────┘      │ LangChain LLM  │
         │                                       │ + MCP Tools    │
         ▼                                       └────────────────┘
 ┌────────────────┐
 │ 7. VERIFY      │ ───► INCIDENT RESOLVED ✓
 │ Post-Recovery  │
 │ Health Sweep   │
 └────────────────┘
```

---

## 🔍 What NetScope Monitors

NetScope monitors 16 continuous telemetry streams organized across three operational layers:

### 📡 Network Layer
- **HTTP / HTTPS Probes**: Endpoint availability, status code distribution (2xx, 3xx, 4xx, 5xx).
- **DNS Resolution Timing**: DNS lookup duration in milliseconds.
- **TCP Connection Timing**: Handshake establishment duration in milliseconds.
- **TLS Handshake Timing**: SSL/TLS negotiation duration in milliseconds.
- **TLS Certificate Security**: Certificate validity, cipher suite details, and expiry countdown tracking.
- **Synthetic Latency Probes**: End-to-end network round-trip delay.

### ⚡ Application Layer
- **Response Latency**: Phase breakdown (DNS → TCP → TLS → TTFB → Total Latency).
- **Service Availability Ratio**: Rolling 24-hour uptime percentage (e.g., 99.99%).
- **Error Rate Tracking**: Proportion of failed checks over rolling time windows.
- **Health Check Probes**: Endpoint application health check status (`Pass` / `Fail`).
- **Raw Check Logs**: Detailed payload responses, status codes, and execution timestamps.

### 🖥️ Infrastructure Layer
- **Host CPU Utilization**: Percentage utilization across host cores.
- **Memory (RAM) Metrics**: Memory utilization percentage, MB used, and MB total.
- **Disk Storage Metrics**: Storage utilization percentage, GB used, and GB free.
- **System Load Averages**: 1-minute, 5-minute, and 15-minute system load averages.
- **Network I/O**: Bytes sent and received over network interfaces.
- **Docker Container Health**: Running container states, container names, images, ports, and Docker Compose project associations.
- **Agent Daemon Heartbeat**: 15-second agent availability pulse and host capability discovery.

---

## 🏗️ System Architecture

NetScope is structured as a decoupled, microservices-oriented architecture designed for low-latency telemetry ingestion, asynchronous background processing, and deterministic AI execution.

```text
                             ┌──────────────────────────────┐
                             │       Monitored Host         │
                             │  NetScope Agent (Daemon)     │
                             │  - Host CPU/RAM/Disk/Load    │
                             │  - Docker & Container State  │
                             └──────────────┬───────────────┘
                                            │ Telemetry Pulse (15s)
                                            ▼
┌──────────────────┐         ┌──────────────────────────────┐
│  React 18 + Vite │ ◄─────► │     Express Backend API      │
│  SRE Console UI  │         │   Ingestion & API Gateway    │
└──────────────────┘         └──────┬────────────────┬──────┘
                                    │                │
                                    ▼                ▼
                         ┌────────────────────┐   ┌────────────────────┐
                         │   PostgreSQL DB    │   │   Redis + BullMQ   │
                         │   Prisma ORM       │   │  Background Jobs   │
                         └────────────────────┘   └──────────┬─────────┘
                                                             │
                                                             ▼
                                                  ┌────────────────────┐
                                                  │ Health & Anomaly   │
                                                  │ Worker Processes   │
                                                  └──────────┬─────────┘
                                                             │
                                                             ▼
                                                  ┌────────────────────┐
                                                  │ Anomaly Detection  │
                                                  │ Z-Score + ML Model │
                                                  └──────────┬─────────┘
                                                             │
                                                             ▼
                                                  ┌────────────────────┐
                                                  │ FastAPI AI Service │
                                                  │ LangChain + Groq   │
                                                  │ MCP Telemetry Tools│
                                                  └──────────┬─────────┘
                                                             │
                                                             ▼
                                                  ┌────────────────────┐
                                                  │ Human Approval UI  │
                                                  │ & Action Dispatch  │
                                                  └────────────────────┘
```

### Component Responsibilities

| Component | Technology | Operational Responsibility |
| :--- | :--- | :--- |
| **NetScope Agent** | Python 3.11, `psutil`, `httpx`, `docker` CLI | Lightweight host daemon collecting infrastructure & Docker metrics every 15s; executes allowlisted remediation commands upon approval. |
| **Backend Gateway** | Node.js, Express.js | Ingestion gateway, RESTful API, authentication (JWT/bcrypt), agent key verification, and audit logging. |
| **Storage Layer** | PostgreSQL, Prisma ORM | Relational storage for users, monitored resources, check logs, incidents, recovery actions, and notification history. |
| **Async Task Queue** | Redis, BullMQ | Asynchronous queueing system powering scheduled monitoring sweeps, anomaly processing, and email dispatches. |
| **Anomaly Detectors** | Node.js Z-Score Engine + Python `scikit-learn` | Dual-phase anomaly identification combining rolling statistical thresholds and multi-metric Isolation Forest ML. |
| **AI SRE Service** | Python, FastAPI, Uvicorn | Dedicated AI microservice hosting the LangChain SRE Agent and Model Context Protocol (MCP) tool integration. |
| **SRE Investigation Agent** | LangChain, Groq API (`llama-3.3-70b-versatile`) | LLM reasoning engine executing grounded MCP tool queries to determine incident root cause, business impact, and remediation recommendations. |
| **MCP Telemetry Tools** | Python MCP Protocol | 5 read-only data tools granting the SRE agent direct access to live health, 24h metrics, host infrastructure state, check logs, and incident history. |
| **Notification Engine** | Nodemailer, Gmail SMTP | HTML email alert dispatch engine sending real-time incident notifications with direct links to human remediation approval interfaces. |
| **Frontend Console** | React 18, Vite, Tailwind CSS, Recharts | Single-page SRE management dashboard featuring real-time health grids, latency phase charts, incident triage modals, and interactive topology visualizers. |

---

## 🧠 AI & Machine Learning

The core philosophy of NetScope is that **an LLM should never be invoked directly on raw telemetry streams**. Feeding thousands of normal monitoring events to an LLM creates astronomical API costs, high latency, and hallucination risks.

NetScope solves this by establishing a two-tier pipeline: **Statistical & ML Anomaly Detection precedes LLM Investigation**.

```text
Raw Telemetry Streams (1,000s events)
                 ↓
[ Tier 1: Z-Score & Isolation Forest ML ]  ── (Filters 98% Normal Signals)
                 ↓
     Correlated Incident Triggered
                 ↓
[ Tier 2: Grounded LangChain SRE Agent + MCP Tools ]
                 ↓
   Structured Remediation Recommendation
```

### 1. Statistical & Unsupervised Machine Learning Detection

NetScope implements two complementary detection engines:

#### Statistical Z-Score Engine
Evaluates rolling latency, status codes, and error rates against historical baselines. Anomalies are flagged when telemetry metrics exceed calculated standard deviation bounds:

$$Z = \frac{x - \mu}{\sigma} > 2.5$$

#### Isolation Forest Unsupervised ML Model (`scikit-learn`)
When a service exhibits complex, multi-metric degradation (e.g., latency increases slightly while CPU spikes and container errors accumulate), simple threshold rules miss the incident. NetScope utilizes an **Isolation Forest** model trained on 5 engineered telemetry features:

1. **`latency`**: End-to-end probe response time in milliseconds.
2. **`is_error`**: Binary indicator ($1.0$ for HTTP 4xx/5xx or `DOWN`, $0.0$ for HTTP 2xx/3xx).
3. **`error_rate`**: Rolling proportion of failed checks over the sample window.
4. **`consecutive_failures`**: Current streak count of failed checks.
5. **`network_delay`**: Aggregated phase latency ($\text{DNS} + \text{TCP} + \text{TLS} + \text{TTFB}$).

Isolation Forest isolates anomalies by building random decision trees. Because anomalous data points are rare and distinct, they require significantly shorter tree path lengths to isolate. Execution runs in $O(n \log n)$ time, ensuring real-time evaluation.

### 2. LangChain SRE Agent & Grounded Prompting

When the anomaly engine triggers an incident, the FastAPI AI service invokes the **LangChain SRE Agent**, powered by Groq's `llama-3.3-70b-versatile` model.

Rather than receiving a generic prompt like `"My server is slow, why?"`, the agent uses **Model Context Protocol (MCP)** tools to query real telemetry facts before formulating a response.

The agent enforces a strict JSON output contract:

```json
{
  "incident_summary": "Target application experiencing severe latency degradation due to Docker container memory pressure.",
  "severity": "CRITICAL",
  "risk_level": "HIGH",
  "business_impact": "E-commerce checkout service experiencing 185ms response delays; 4.2% of HTTP requests timing out.",
  "recommended_action": "restart_container",
  "observations": [
    "Host CPU utilization reached 94% at 14:22:00Z.",
    "Target container demo-api status changed to OOMKilled.",
    "HTTP 500 error count increased by 14 consecutive checks."
  ],
  "possible_causes": [
    "Container memory limit exceeded due to memory leak in application process.",
    "Unbounded thread creation under heavy synthetic load."
  ],
  "recommended_investigations": [
    "Inspect container memory limits in docker-compose.yml.",
    "Analyze heap dump logs from target process."
  ],
  "confidence": 0.92
}
```

*If the external LLM provider is offline or unreachable, NetScope automatically falls back to a deterministic, rule-grounded SRE investigation engine, ensuring system resilience.*

---

## 🛠️ Model Context Protocol (MCP) Tools

NetScope implements the **Model Context Protocol (MCP)** to provide a structured, read-only boundary between the AI Agent and application telemetry. The SRE agent executes 5 specialized MCP tools:

| MCP Tool Name | Access | Information Provided to SRE Agent |
| :--- | :--- | :--- |
| `get_service_health` | Read-Only | Current operational status, 24h availability ratio, and endpoint details. |
| `get_service_metrics` | Read-Only | Historical latency breakdown (DNS, TCP, TLS, TTFB) over 24 hours. |
| `get_agent_status` | Read-Only | Server infrastructure state (CPU %, RAM %, Disk %, System Load) from NetScope Agent. |
| `get_recent_logs` | Read-Only | Raw check payloads, HTTP status codes, and network error logs. |
| `get_incident_history` | Read-Only | Past incident occurrences, previous root causes, and prior recovery outcomes. |

**Key Security Guarantee**: MCP tools are strictly **read-only**. The AI agent cannot execute database writes, modify system configurations, or run shell commands through MCP.

---

## 🛡️ Controlled & Governed AI Recovery

NetScope is engineered around **Human-Governed Recovery**, rejecting unsafe, unrestricted AI shell execution.

```text
AI Investigation ➔ Recommends "restart_container"
                          ↓
              Human SRE Reviews in UI
                          ↓
               Approved? ───► NO  ──► Action Cancelled & Logged
                          │
                         YES
                          │
                          ▼
            NetScope Backend Validates Target
                          ↓
         Dispatch to NetScope Agent via Heartbeat
                          ↓
    Agent Executes Allowlisted Command: `docker restart <target>`
                          ↓
        Automated Post-Recovery Health Verification
                          ↓
             HTTP 200 OK Verified ➔ Incident Closed ✓
```

### Safety & Governance Enforcements

1. **Strict Action Allowlist**: The NetScope Agent only accepts pre-approved action types: `restart_container` and `restart_compose_service`. Arbitrary shell commands (`rm`, `chmod`, `curl`, `bash`) are rejected at the daemon level.
2. **Human SRE Approval Requirement**: Recovery actions remain in a `PENDING_APPROVAL` state until an authorized engineer clicks **Approve & Remediate** in the console.
3. **Agent Key Cryptographic Authorization**: Heartbeat pulses and action execution results require valid `X-NetScope-Agent-Key` header authentication.
4. **Post-Recovery Verification**: A recovery action is **never** assumed successful just because a command returned exit code `0`. Following container restart, the health worker executes a synthetic verification sweep. The incident transitions to `RESOLVED` only after HTTP 200 OK is confirmed.

---

## 🎬 Real Production Demo Scenario

NetScope was demonstrated on a monitored Linux server hosted on **AWS EC2** running Dockerized microservices:

```text
1. Normal State        : NetScope Agent streams host metrics (CPU 14%, RAM 42%) & HTTP 200 OK checks (24ms).
2. Failure Injection   : Stress condition applied to target container (:8081). Container enters degraded state.
3. Anomaly Triggered   : Multi-metric Isolation Forest detects latency spike + container error rate surge (Anomaly Score: 0.88).
4. Incident Creation   : Debounced incident created; alert notification email sent to SRE via Gmail SMTP.
5. AI Investigation    : SRE Agent queries MCP tools, synthesizes root cause ("Memory Limit Exceeded"), and recommends `restart_container`.
6. Human Approval      : Engineer reviews AI diagnosis in SRE UI and clicks "Approve Remediation".
7. Agent Execution     : Agent receives dispatch on next 15s heartbeat, executes `docker restart demo-api`.
8. Verification        : Post-recovery health check verifies HTTP 200 OK. Incident automatically marked RESOLVED ✓.
```

---

## 🛠️ Technology Stack

| Layer | Technology | Operational Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Recharts | Responsive SRE dashboard, interactive topology visualizer, and incident modal. |
| **Backend API** | Node.js, Express.js | REST API gateway, ingestion engine, JWT authentication, and agent controller. |
| **Database & ORM** | PostgreSQL 15, Prisma ORM | Relational schema management, check log telemetry storage, and incident audit trails. |
| **Task Queue** | Redis, BullMQ | Asynchronous scheduled health checks, worker processing queues, and notification dispatch. |
| **AI / LLM Framework** | Python 3.11, FastAPI, LangChain, Groq | AI service boundary, SRE agent orchestration, and Groq Llama-3.3 execution. |
| **ML & Data Science** | `scikit-learn`, `numpy`, `pandas` | Unsupervised Isolation Forest anomaly scoring and feature vector extraction. |
| **AI Tool Layer** | Model Context Protocol (MCP) | Standardized, read-only telemetry access tools for the SRE agent. |
| **Host Agent** | Python 3.11, `psutil`, `httpx`, `docker-py` | Cross-platform host metrics collection and allowlisted container remediation daemon. |
| **Alerting** | Nodemailer, Gmail SMTP | Real-time HTML email alert notification dispatch. |
| **Containerization** | Docker, Docker Compose | Multi-container local orchestration and EC2 target deployment. |

---

## 📁 Repository Structure

```text
NetScope/
├── frontend/                     # React 18 + Vite SRE Console Single-Page App
│   ├── src/
│   │   ├── components/           # Dashboard cards, incident modals, notification drawers
│   │   ├── pages/                # Dashboard, Incidents, Devices, Analytics, Documentation
│   │   ├── services/             # Axios API client & Auth services
│   │   └── App.jsx               # Router & global application state
│   ├── package.json
│   └── vite.config.js
│
├── Backend/                      # Node.js + Express API Gateway & Ingestion Server
│   ├── src/
│   │   ├── controllers/          # Devices, incidents, agent, recovery & AI handlers
│   │   ├── modules/              # Ingestion, statistical Z-score & incident engines
│   │   ├── workers/              # BullMQ health check & email notification workers
│   │   ├── routes/               # Express REST API routing definitions
│   │   └── server.js             # HTTP server entry point
│   ├── prisma/
│   │   └── schema.prisma         # Relational database schema
│   └── package.json
│
├── ai_service/                   # Python FastAPI Microservice & AI Engine
│   ├── agent/
│   │   └── sre_agent.py          # LangChain SRE Agent & prompt engineering
│   ├── models/
│   │   └── anomaly_detector.py   # scikit-learn Isolation Forest ML detector
│   ├── mcp/
│   │   └── netscope_mcp.py       # Model Context Protocol (MCP) read-only tools
│   ├── main.py                   # FastAPI server entry point
│   └── requirements.txt
│
├── agent/                        # NetScope Host Infrastructure Daemon
│   ├── agent.py                  # Host telemetry collector & allowlisted recovery executor
│   └── requirements.txt
│
├── Docs/                         # Interactive Presentation Slides
│   └── assets/
│       ├── 01-the-problem.html   # Presentation Page 1: The Problem (Light Theme)
│       └── 02-what-netscope-monitors.html # Presentation Page 2: What NetScope Monitors
│
├── docker-compose.yml            # PostgreSQL & Redis container orchestration
└── README.md
```

---

## ⚙️ Getting Started & Local Setup

Follow these steps to set up and run NetScope on your local development environment.

### Prerequisites
Ensure the following tools are installed:
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.11.0` or higher
- **Docker & Docker Compose**: Installed and daemon running
- **PostgreSQL**: `v15.0` (or running via Docker Compose)
- **Redis**: `v7.0` (or running via Docker Compose)

---

### 1. Clone Repository

```bash
git clone https://github.com/DeepakPatel004/NetScope.git
cd NetScope
```

---

### 2. Configure Environment Variables

#### Backend Environment (`Backend/.env`)
Create `Backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://netscope_user:netscope_password@localhost:5432/netscope_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_secure_jwt_secret_key_here"

# SMTP Alert Notifications (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_gmail_app_password"
SMTP_FROM="NetScope Alerts <your_email@gmail.com>"
```

#### AI Service Environment (`ai_service/.env`)
Create `ai_service/.env`:

```env
PORT=8000
AI_ENABLED=true
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="llama-3.3-70b-versatile"
NETSCOPE_BACKEND_URL="http://localhost:5000"
```

---

### 3. Start Infrastructure Dependencies (PostgreSQL & Redis)

```bash
docker-compose up -d
```

---

### 4. Start Node.js Backend API

```bash
cd Backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
*Backend API server runs at `http://localhost:5000`.*

---

### 5. Start Python FastAPI AI Service

Open a new terminal:

```bash
cd ai_service

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python main.py
```
*FastAPI AI Service runs at `http://localhost:8000`.*

---

### 6. Start React Frontend Dashboard

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```
*Frontend SRE Console opens at `http://localhost:5173`.*

---

### 7. Run NetScope Agent (Optional Host Daemon)

To connect local host telemetry to NetScope:

```bash
cd agent
pip install -r requirements.txt
python agent.py --server http://localhost:5000 --key YOUR_RESOURCE_AGENT_KEY --interval 15
```

---

## 📈 Engineering Design Decisions & Trade-Offs

1. **Why Asynchronous Task Queues (BullMQ + Redis)?**  
   Executing health checks, synthetic network probes, and ML scoring directly inside API request loops blocks the gateway. BullMQ offloads checks to worker processes, guaranteeing constant API response times ($<15\text{ms}$).

2. **Why Isolation Forest over Recurrent Neural Networks (RNN/LSTM)?**  
   LSTM models require massive pre-labeled historical failure datasets and GPU acceleration. Isolation Forest is unsupervised, non-parametric, runs in $O(n \log n)$ time, and performs exceptionally well on multi-metric infrastructure tabular features without pre-training.

3. **Why Structured JSON Output Constraints on the SRE Agent?**  
   Unstructured text from an LLM cannot be parsed programmatically by a recovery controller. NetScope enforces rigid Pydantic / JSON schemas, ensuring that fields like `recommended_action` can be validated deterministically.

4. **Why Human Governance for Recovery Actions?**  
   Fully autonomous AI execution risks cascading failures if an LLM misinterprets context. Requiring explicit human SRE approval while constraining actions to an allowlist (`restart_container`) provides the ideal balance between automation speed and infrastructure safety.

---

## 🚧 Future Improvements

- **Kubernetes Remediation Playbooks**: Extend allowlisted remediation beyond Docker containers to Kubernetes Pod rollouts and deployment scaling.
- **eBPF Kernel Telemetry Integration**: Replace polling probes with deep Linux eBPF kernel network socket tracking.
- **Cross-Node Distributed Trace Correlation**: Correlate multi-tier microservice latency using OpenTelemetry trace context propagation.
- **Cost-Aware Recovery Decision Matrix**: Incorporate cloud infrastructure cost metrics into AI remediation recommendations.

---

## 👨‍💻 Project Maintainer

**NetScope — AI-Powered Infrastructure Observability & Incident Remediation Platform**  
*Developed as an advanced exploration of Infrastructure Systems, Site Reliability Engineering (SRE), Machine Learning, and Autonomous AI Governance.*

```text
Observe ➔ Correlate ➔ Detect ➔ Investigate ➔ Recommend ➔ Approve ➔ Recover ➔ Verify
```