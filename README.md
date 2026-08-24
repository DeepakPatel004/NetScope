# NetScope

### AI-Powered Infrastructure Observability & Incident Recovery

> [🎥 5-Min Demo](#) | [🌐 Live Demo](#) | [📐 Architecture](#)

> **Observe → Correlate → Detect → Investigate → Recover → Verify**

NetScope is an infrastructure observability platform designed to go beyond traditional monitoring.

It continuously collects application, network, and infrastructure telemetry, correlates multiple signals to identify meaningful incidents, uses AI-assisted investigation to determine probable root causes, and supports controlled remediation followed by post-recovery verification.

The goal is not simply to answer **"Is my server down?"**

The goal is to answer:

> **"What happened, why did it happen, what should we do about it, and did the system actually recover?"**

---

## 🚀 Why NetScope?

In a real production environment, an incident rarely appears as a single obvious failure.

For example:

```text
CPU ↑
     +
Latency ↑
     +
Container Errors
     +
HTTP Failures
     ↓
Potential Incident
```

Looking at these signals independently can create noisy alerts and unnecessary investigation.

NetScope combines these signals into an incident context before invoking the AI investigation layer.

This creates a closed-loop workflow:

```text
MONITOR
   ↓
CORRELATE
   ↓
DETECT
   ↓
INVESTIGATE
   ↓
RECOVER
   ↓
VERIFY
```

---

## 🔍 What NetScope Monitors

NetScope observes multiple layers of a monitored system.

### Network
- HTTP / HTTPS availability
- HTTP status codes
- DNS resolution
- TCP connection timing
- TLS handshake timing
- TLS certificate validity and expiry
- Network latency

### Application
- Response latency
- DNS → TCP → TLS → TTFB breakdown
- HTTP health checks
- Availability
- Recent application errors
- Service health

### Infrastructure
- CPU utilization
- Memory utilization
- Disk utilization
- Docker container state
- Server heartbeat
- Agent availability

These signals provide the context required for meaningful incident detection and investigation.

---

## 🧠 Intelligent Incident Detection

NetScope uses two complementary anomaly-detection approaches.

### 1. Statistical Detection
A rolling statistical engine evaluates telemetry against its recent baseline.

Examples include:
- Latency deviations
- Error-rate increases
- Consecutive failures
- CPU / memory / disk thresholds
- System load

This provides a simple and interpretable first layer of detection.

### 2. Machine Learning Detection
NetScope also uses an Isolation Forest model for unsupervised anomaly detection.

The model considers engineered signals such as:
- Latency
- Error State
- Error Rate
- Consecutive Failures
- Network Delay

This allows the system to detect unusual combinations of behaviour without requiring a labelled incident dataset.

---

## 🤖 AI SRE Investigation

Once NetScope determines that an incident is meaningful, the incident can be investigated by an AI-powered SRE agent.

The agent is implemented as a Python service using:
- FastAPI
- LangChain
- Groq-hosted LLM
- Model Context Protocol (MCP)

The agent does not simply receive: `"Server is down."`

Instead, it can gather evidence through structured observability tools.

### MCP Observability Tools
The SRE agent can query:
- `get_service_health`
- `get_service_metrics`
- `get_agent_status`
- `get_recent_logs`
- `get_incident_history`

The agent uses these signals to build context before producing a root-cause assessment and remediation recommendation.

**Example:**
```text
Observed:
- CPU significantly elevated
- Container unhealthy
- HTTP failures increasing
- Recent service errors detected

        ↓

AI Investigation

        ↓

Probable Root Cause:
Container process failure / service degradation

        ↓

Recommended Action:
Restart affected container
```

---

## 🛡️ Controlled AI Recovery

NetScope is designed around controlled automation, rather than giving an LLM unrestricted access to infrastructure.

The recovery workflow is:

```text
AI Investigation
       ↓
Recommended Action
       ↓
Recovery Policy
       ↓
Approved / Allowed Action
       ↓
Execution
       ↓
Post-Recovery Verification
```

For the current Docker-based recovery workflow, an allowed remediation can restart an affected container.

The important distinction is: **The AI proposes; the recovery layer controls what can actually execute.**

---

## 🔄 Closed-Loop Recovery

Recovery is not considered successful simply because a command completed.

NetScope performs verification after remediation.

```text
INCIDENT
   ↓
AI INVESTIGATION
   ↓
RECOVERY ACTION
   ↓
CONTAINER RESTART
   ↓
HEALTH CHECK
   ↓
HTTP 200
   ↓
HEALTHY
   ↓
INCIDENT RESOLVED ✓
```

This prevents the system from incorrectly marking an incident as resolved when the underlying service is still unhealthy.

---

## 🏗️ Architecture

High-level workflow:

```text
                    ┌─────────────────────┐
                    │   Monitored Server  │
                    │                     │
                    │  NetScope Agent     │
                    │  CPU / RAM / Disk   │
                    │  Docker / Heartbeat │
                    └──────────┬──────────┘
                               │
                               │ Telemetry
                               ▼
                    ┌─────────────────────┐
                    │   Node.js Backend   │
                    │      Express        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Redis + BullMQ   │
                    │ Async Job Processing│
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌────────────────┐          ┌──────────────────┐
        │   PostgreSQL   │          │ Incident Engine  │
        │ Persistent     │          │ Correlation &    │
        │ State          │          │ Debouncing       │
        └────────────────┘          └────────┬─────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │ Anomaly Detection   │
                                  │                     │
                                  │ Statistical Engine  │
                                  │ Isolation Forest    │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │  AI SRE Service     │
                                  │      FastAPI        │
                                  │                     │
                                  │ LangChain + Groq    │
                                  │ MCP Observability   │
                                  │ Tools               │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │ Recovery Controller │
                                  │                     │
                                  │ Allowlisted Actions │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │ Recovery Verification│
                                  │                     │
                                  │ Health Check         │
                                  │ HTTP / Container     │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                      INCIDENT RESOLVED
```

---

## 🧩 Core Components

| Component | Responsibility |
| :--- | :--- |
| **NetScope Agent** | Collects server and Docker telemetry |
| **Express Backend** | API gateway and orchestration |
| **Health Workers** | Execute background monitoring and health checks |
| **Redis** | Queue and temporary coordination layer |
| **BullMQ** | Background job processing |
| **PostgreSQL** | Persistent application and incident state |
| **Incident Engine** | Debouncing, correlation and incident creation |
| **Statistical Detector** | Rule/baseline-based anomaly detection |
| **Isolation Forest** | Unsupervised anomaly detection |
| **FastAPI AI Service** | AI/ML service boundary |
| **LangChain SRE Agent** | AI-driven incident investigation |
| **MCP Tools** | Structured observability access for the agent |
| **Groq LLM** | Root-cause analysis and remediation reasoning |
| **Recovery Controller** | Controlled remediation execution |
| **React Frontend** | Monitoring dashboard and incident interface |

---

## 🛠️ Technology Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Axios

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Zod
- JWT
- bcrypt
- Nodemailer

### AI / ML
- Python 3.11+
- FastAPI
- Uvicorn
- LangChain
- Groq API (`llama-3.3-70b-versatile`)
- Model Context Protocol (MCP)
- Scikit-learn (Isolation Forest)
- NumPy
- Pandas

### Infrastructure
- Linux
- Docker
- Docker Compose
- AWS EC2

---

## 📊 Network Latency Breakdown

Instead of treating latency as a single number, NetScope breaks an HTTP/HTTPS request into phases:

```text
Request
  │
  ├── DNS Lookup
  │
  ├── TCP Connection
  │
  ├── TLS Handshake
  │
  ├── Time To First Byte
  │
  └── Total Latency
```

This helps distinguish between different classes of network problems.

**Example Breakdown:**
```text
DNS     4ms
TCP     6ms
TLS     8ms
TTFB    6ms
────────────
Total  24ms
```

This provides significantly more diagnostic context than simply reporting: `Latency = 24ms`.

---

## 🔔 Incident Noise Reduction

A monitoring system that generates an alert for every failed request can quickly become noisy.

NetScope therefore introduces incident-level processing:

```text
Failure #1
    ↓
Failure #2
    ↓
Failure #3
    ↓
Meaningful Incident
```

This allows transient failures to be separated from persistent problems before expensive AI investigation is triggered.

---

## 🔐 Design Principles

- **Evidence before reasoning**: The AI agent should investigate available telemetry rather than blindly guessing the cause.
- **Controlled autonomy**: AI-generated recommendations do not automatically translate into unrestricted infrastructure commands.
- **Asynchronous processing**: Monitoring and background work are separated from the main API request path.
- **Verification after recovery**: A remediation is successful only when the system confirms that the service has recovered.
- **Observable AI**: The investigation process uses structured tools and system evidence rather than an opaque chatbot interaction.

---

## 🎬 Demonstration

The project can be demonstrated using a Linux server running on AWS EC2.

```text
Demo Scenario:
Healthy AWS Server
        ↓
NetScope Agent
        ↓
Normal Telemetry
        ↓
Controlled Load / Failure
        ↓
CPU + Latency + Service Signals Change
        ↓
NetScope Detects Anomaly
        ↓
Incident Created
        ↓
AI SRE Agent Investigates
        ↓
Root Cause + Remediation
        ↓
Controlled Docker Recovery
        ↓
Health Verification
        ↓
INCIDENT RESOLVED ✓
```

This demonstrates the complete observability-to-recovery loop using an actual monitored environment.

---

## 📁 Project Structure

```text
NetScope/
│
├── frontend/
│   ├── src/
│   └── ...
│
├── Backend/
│   ├── controllers/
│   ├── services/
│   ├── workers/
│   ├── routes/
│   ├── prisma/
│   └── ...
│
├── ai_service/
│   ├── models/
│   │   └── anomaly_detector.py
│   ├── agent/
│   │   └── sre_agent.py
│   ├── mcp/
│   │   └── netscope_mcp.py
│   └── ...
│
├── agent/
│   ├── agent.service.js
│   └── ...
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
Make sure the following are installed:
- Node.js (v18+)
- Python 3.11+
- PostgreSQL
- Redis
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd NetScope
```

### 2. Configure Environment Variables
Create `.env` files in `Backend/` and `ai_service/` using example keys (PostgreSQL, Redis, JWT, Groq API key, Gmail SMTP credentials).

### 3. Start Infrastructure Dependencies
```bash
docker compose up -d
```

### 4. Backend Setup
```bash
cd Backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 5. AI Service Setup
```bash
cd ai_service
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 6. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔑 Environment Variables Example

```env
DATABASE_URL=postgresql://user:password@localhost:5432/netscope
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 📈 Engineering Design Decisions

The project was designed around key SRE architectural questions:

- **How do we avoid noisy incidents?** $\rightarrow$ Failure debouncing + multi-signal correlation.
- **How do we avoid sending every event to an LLM?** $\rightarrow$ Incident-level processing before AI investigation (98% token reduction).
- **How can an AI agent investigate infrastructure?** $\rightarrow$ Grounded Model Context Protocol (MCP) observability tools.
- **How do we prevent unrestricted AI execution?** $\rightarrow$ Controlled and allowlisted human-approved recovery actions.
- **How do we know recovery actually worked?** $\rightarrow$ Empirical post-recovery health check verification.
- **How do we handle monitoring work without blocking APIs?** $\rightarrow$ Redis + BullMQ asynchronous background processing.

---

## 🚧 Current Scope & Future Directions

### Current Scope
- Linux-based monitored environments & Docker-based service recovery
- HTTP/HTTPS & TCP port monitoring with 24h phase breakdowns
- Statistical Z-score + Isolation Forest ML anomaly detection
- AI-assisted incident investigation & human-approved Docker remediation

### Future Directions
- Kubernetes cluster remediation playbooks
- Multi-server cross-node incident correlation
- Cost-aware remediation policies & distributed tracing integration

---

## 👨‍💻 Project Info

**NetScope — AI-Powered Infrastructure Observability & Incident Recovery**

*Built as an exploration of Infrastructure, Distributed Systems, Observability, Machine Learning, and Autonomous AI Agents.*

```text
Observe → Correlate → Detect → Investigate → Recover → Verify
```