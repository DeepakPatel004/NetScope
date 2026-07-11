# 🌐 NetScope | Asynchronous Host Diagnostics & Latency Audit Engine

NetScope is an enterprise-grade, developer-first health auditing platform designed to monitor the status, response codes, and latency profiles of websites, web services, and remote nodes.

Built on top of a highly resilient asynchronous event loop, NetScope integrates background schedulers with BullMQ and Redis queues to orchestrate latency sweeps in parallel, persisting audit histories to a PostgreSQL database via Prisma ORM.

---

## 🚀 Key Features

*   **Real-Time Latency Ledger:** Display live performance aggregates, active status logs, and mean response metrics synced dynamically via an inline countdown worker tracker.
*   **Decoupled Auditing Registry:** Configure, update, and toggle active states of website, API, and ICMP endpoints dynamically with customizable scheduler frequencies.
*   **Kuma-Style Health Timelines:** Visual status grids rendering a GitHub-style horizontal health block matrix showing log status, latency, and error states for the previous 50 audits.
*   **Asynchronous Check Dispatcher:** Bypass cron schedules to trigger immediate, high-priority inspection jobs dispatched to background BullMQ workers.
*   **System Engine Settings:** High-level diagnostic parameters dashboard showcasing timeouts, database record limits, and daemon runtime status.

---

## 🏗️ System Architecture & Flow

NetScope uses a decoupled architecture separating client rendering, request routing, and background check scheduling.

```mermaid
graph TD
    %% Frontend to Backend
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
    end

    %% Flow lines
    ReactApp -->|HTTP Requests / REST| ExpressAPI
    ExpressAPI -->|Read/Write Queries| PrismaClient
    PrismaClient -->|Persist Data| Postgres
    ExpressAPI -->|Enqueue Manual Job| BullMQ
    
    Scheduler -->|Cron Poll every 1m| ExpressAPI
    Scheduler -->|Push Cron Jobs| BullMQ
    BullMQ <--->|Job Coordination| Redis
    Worker -->|Fetch Jobs| BullMQ
    Worker -->|Execute Ping / HTTP GET| ExternalHost[Monitored Targets Website / API / IP]
    Worker -->|Save Results| PrismaClient
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite | Fast, responsive single-page client interface |
| | Tailwind CSS v4 | Curated dark mode gradients and micro-animations |
| | Lucide React | High-quality responsive modern vector iconography |
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

    ACTIVITY_LOG {
        string id PK
        string userId FK
        enum action "LOGIN | LOGOUT | CREATE | UPDATE | DELETE"
        string entityId
        datetime createdAt
    }
```

---

## ⚙️ How to Run

You can run the NetScope stack either using **Docker Compose** (recommended for simplicity) or as **Local Services**.

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
    This command will automatically download, configure, build, and link:
    *   `PostgreSQL` on port `5432`
    *   `Redis` on port `6379`
    *   `NetScope Backend` on port `5000`
    *   `NetScope Frontend` on port `5173`

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
3.  Configure `.env` environment variables (copy values from `.env.example` if available, or confirm credentials):
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/netscope?schema=public"
    REDIS_URL="redis://localhost:6379"
    PORT=5000
    NODE_ENV=development
    ```
4.  Sync database schema and generate the Prisma Client:
    ```bash
    npx prisma db push
    ```
5.  Seed the database with sample devices and health checks:
    ```bash
    node prisma/seed.js
    ```
6.  Start the backend API server and workers daemon:
    ```bash
    npm run dev
    ```

#### 2. Setup the Frontend
1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the Vite development server:
    ```bash
    npm run dev
    ```
4.  Open the application at [http://localhost:5173](http://localhost:5173).

---

## 🔮 Future Roadmap (v2.0)

*   [ ] **Authentication & Access Control:** Complete multi-user isolation and login screens.
*   [ ] **SSL Certificate Expiry Tracking:** Pre-emptively warn users about expiring certificates.
*   [ ] **Instant Notification Channels:** Integrate Discord webhooks, Slack bots, and Telegram alerts.
*   [ ] **Advanced Analytics & Charts:** Custom timeline charts showing day-by-day response time histograms.
*   [ ] **Port Scanner Integrations:** Monitor raw TCP sockets for database endpoints and SSH channels.