# 🌐 NetScope | Asynchronous Host Diagnostics & Latency Audit Engine

NetScope is an enterprise-grade, developer-first health auditing platform designed to monitor the status, response codes, and latency profiles of websites, web services, and remote nodes.

Built on top of a highly resilient asynchronous event loop, NetScope integrates background schedulers with BullMQ and Redis queues to orchestrate latency sweeps in parallel, persisting audit histories to a PostgreSQL database via Prisma ORM.

---

## 🚀 Core Modules (v2.0)

*   **Real-Time Latency Ledger:** Display live performance aggregates, active status logs, and mean response metrics synced dynamically via an inline countdown worker tracker.
*   **Decoupled Auditing Registry:** Configure, update, and toggle active states of website, API, and ICMP endpoints dynamically with customizable scheduler frequencies.
*   **SSL Certificates Validator:** Continuously monitors TLS certificate expiry states, tracking days remaining, validity windows, issuers, subjects, and signatures.
*   **Port Scanner Sweeper:** Audits open TCP ports on targets, registering active socket routes and alerting on exposed services.
*   **Incident Lifecycle Manager:** Automatically logs system downtime alerts (opened/resolved incidents) to track overall reliability and Mean Time to Repair (MTTR).
*   **High-Resolution Analytics:** Calculates uptime ratios, average latencies, and peak latencies over configurable historical durations.
*   **Interactive Visual Timelines:** Uses smooth Chart.js lines to plot historical latencies and custom status grids to represent check histories.

---

## 📸 System Screenshots

### Real-Time Dashboard Catalog
![Dashboard Layout](Docs/screenshots/dashboard.png)

### Device Details - Performance Overview (Latency Sweep Chart)
![Overview details](Docs/screenshots/device_details_overview.png)

### Device Details - SSL Security Diagnostics
![SSL details](Docs/screenshots/device_details_ssl.png)

### Device Details - Port Scanner Registry
![Ports details](Docs/screenshots/device_details_ports.png)

### Device Details - Recent Health Ledger
![Logs details](Docs/screenshots/device_details_logs.png)

---

## 🏗️ System Architecture & Flow

NetScope uses a decoupled architecture separating client rendering, request routing, and background check scheduling.

```mermaid
graph TD
    subgraph Client Layer [Frontend Client]
        ReactApp[React 19 + Tailwind v4 Client]
    end

    subgraph API Layer [Backend Server]
        ExpressAPI[Express API Server]
        PrismaClient[Prisma ORM]
    end

    subgraph Cache & Storage Layer [Data Tier]
        Postgres[(PostgreSQL Database)]
        Redis[(Redis Cache & Queue)]
    end

    subgraph Workers Layer [Background Daemons]
        Scheduler[Node-Cron Scheduler]
        BullMQ[BullMQ Queue Manager]
        Worker[Health Check Worker]
        SSLWorker[SSL Cert Worker]
        PortWorker[Port Scan Worker]
    end

    ReactApp -->|HTTP Requests / REST| ExpressAPI
    ExpressAPI -->|Read/Write Queries| PrismaClient
    PrismaClient -->|Persist Data| Postgres
    ExpressAPI -->|Enqueue Manual Job| BullMQ
    
    Scheduler -->|Cron Poll every 1m| ExpressAPI
    Scheduler -->|Push Cron Jobs| BullMQ
    BullMQ <--->|Job Coordination| Redis
    Worker -->|Execute Ping / HTTP GET| ExternalHost[Monitored Targets]
    SSLWorker -->|Scan TLS Certificates| ExternalHost
    PortWorker -->|Audit TCP Sockets| ExternalHost
    Worker -->|Save Results| PrismaClient
    SSLWorker -->|Save Results| PrismaClient
    PortWorker -->|Save Results| PrismaClient
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite | Fast, responsive single-page client interface |
| | Tailwind CSS v4 | Curated dark mode gradients and micro-animations |
| | Chart.js, React-Chartjs-2 | High-performance HTML5 canvas performance logging charts |
| | Lucide React | High-quality responsive vector icons |
| **Backend** | Node.js, Express | REST API server handling configuration CRUD |
| | Prisma ORM | Object-Relational mapping for database schemas |
| | BullMQ | Redis-backed asynchronous queue for worker tasks |
| | Node-Cron | Periodic scheduler triggering background audits |
| **Database** | PostgreSQL | Relational database storing user and status check records |
| **Caching** | Redis | Job queue engine and fast execution state memory |

---

## 💾 Database Schema

The relational database model on PostgreSQL consists of four primary models managed via Prisma:

```mermaid
erDiagram
    USER ||--o{ DEVICE : "owns"
    DEVICE ||--o{ HEALTH_LOG : "has"
    DEVICE ||--o{ SSL_STATUS : "validates"
    DEVICE ||--o{ PORT_SCAN_LOG : "audits"
    DEVICE ||--o{ INCIDENT : "registers"
    USER ||--o{ ACTIVITY_LOG : "logs"

    USER {
        string id PK
        string username UNIQUE
        string email UNIQUE
        string passwordHash
        string fullName
        datetime createdAt
    }

    DEVICE {
        string id PK
        string userId FK
        string name
        string host
        enum type "WEBSITE | API | IP"
        int interval
        boolean enabled
        datetime createdAt
    }

    HEALTH_LOG {
        string id PK
        string deviceId FK
        enum status "UP | DOWN"
        int latency
        int responseCode
        string message
        datetime checkedAt
    }

    SSL_STATUS {
        string id PK
        string deviceId FK
        string issuer
        string subject
        datetime validFrom
        datetime validTo
        int daysRemaining
        string fingerprint
        enum status "VALID | EXPIRING | EXPIRED | INVALID"
        datetime checkedAt
    }

    PORT_SCAN_LOG {
        string id PK
        string deviceId FK
        int_array openPorts
        datetime checkedAt
    }

    INCIDENT {
        string id PK
        string deviceId FK
        string type
        string status "OPEN | RESOLVED"
        string error
        datetime openedAt
        datetime resolvedAt
    }
```

---

## 🔌 API Documentation

All REST routes are prefixed with `/api/v1`.

### 1. Devices Registry
*   `GET /devices` - Retrieve all registered devices.
*   `GET /devices/:id` - Retrieve configuration for a single device.
*   `POST /devices` - Register a new device.
*   `PUT /devices/:id` - Update device details.
*   `DELETE /devices/:id` - Delete device and wipe its historical log tables.

### 2. Dashboard Analytics
*   `GET /dashboard/summary` - Aggregate metrics (Total, Online, Offline, Avg Latency).
*   `GET /dashboard/devices` - Current statuses of all monitored hosts.

### 3. Latency Sweeps (Health Logs)
*   `GET /health/:deviceId` - Retrieve the recent 50 check logs.
*   `POST /health/check/:deviceId` - Dispatch an immediate manual health sweep job.

### 4. SSL Certificates
*   `GET /ssl` - List current certificate status maps for all devices.
*   `GET /ssl/:deviceId` - Historical certificates validation logs.
*   `POST /ssl/check/:deviceId` - Dispatch an immediate manual TLS certificate check job.

### 5. Port Scanner
*   `GET /ports` - List latest open ports registries for all devices.
*   `GET /ports/:deviceId` - Historical port scan logs.
*   `POST /ports/check/:deviceId` - Trigger an immediate TCP port scanner audit.

### 6. Analytics Aggregates
*   `GET /analytics/:deviceId` - Uptime percentages, mean latencies, and max latencies.

---

## ⚙️ How to Run

### Option A: Running with Docker Compose (Recommended)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/NetScope.git
    cd NetScope
    ```

2.  **Start the Services:**
    ```bash
    docker-compose up -d --build
    ```

3.  **Access the Dashboard:**
    Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option B: Running Locally (Manual Setup)

#### Prerequisites
*   Node.js (v18+)
*   PostgreSQL running locally (default port `5432`, password `postgres`, database `netscope`)
*   Redis server running locally (default port `6379`)

#### 1. Setup the Backend
1.  Navigate to the `Backend` directory:
    ```bash
    cd Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure `.env` environment variables:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/netscope?schema=public"
    REDIS_URL="redis://localhost:6379"
    PORT=5000
    NODE_ENV=development
    ```
4.  Sync database schema:
    ```bash
    npx prisma db push
    ```
5.  Seed database with demo configurations and logs:
    ```bash
    node prisma/seed.js
    ```
6.  Start backend API and workers daemon:
    ```bash
    npm run dev
    ```

#### 2. Setup the Frontend
1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch Vite development server:
    ```bash
    npm run dev
    ```
4.  Open the application at [http://localhost:5173](http://localhost:5173).