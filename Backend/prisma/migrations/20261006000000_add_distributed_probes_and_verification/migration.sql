-- Add distributed probes, check assignments, check results, and multi-probe incident verification fields
ALTER TABLE "Device"
  ADD COLUMN IF NOT EXISTS "selectedProbes" JSONB,
  ADD COLUMN IF NOT EXISTS "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS "baselineLatency" DOUBLE PRECISION;

ALTER TABLE "Incident"
  ADD COLUMN IF NOT EXISTS "assessment" TEXT,
  ADD COLUMN IF NOT EXISTS "failedStage" TEXT,
  ADD COLUMN IF NOT EXISTS "affectedLocations" JSONB,
  ADD COLUMN IF NOT EXISTS "supportingEvidence" JSONB,
  ADD COLUMN IF NOT EXISTS "uncertainties" JSONB,
  ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acknowledgedBy" TEXT;

CREATE TABLE IF NOT EXISTS "Probe" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'ONLINE',
  "isRevoked" BOOLEAN NOT NULL DEFAULT false,
  "version" TEXT DEFAULT '1.0.0',
  "lastHeartbeatAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Probe_region_idx" ON "Probe"("region");
CREATE INDEX IF NOT EXISTS "Probe_status_idx" ON "Probe"("status");

CREATE TABLE IF NOT EXISTS "ControlEndpoint" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "expectedStatus" INTEGER NOT NULL DEFAULT 200,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CheckAssignment" (
  "id" TEXT PRIMARY KEY,
  "monitorId" TEXT NOT NULL REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "probeId" TEXT NOT NULL REFERENCES "Probe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "kind" TEXT NOT NULL DEFAULT 'ROUTINE',
  "targetUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "leasedAt" TIMESTAMP(3),
  "leaseExpiresAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CheckAssignment_probeId_status_idx" ON "CheckAssignment"("probeId", "status");
CREATE INDEX IF NOT EXISTS "CheckAssignment_status_leaseExpiresAt_idx" ON "CheckAssignment"("status", "leaseExpiresAt");
CREATE INDEX IF NOT EXISTS "CheckAssignment_monitorId_idx" ON "CheckAssignment"("monitorId");

CREATE TABLE IF NOT EXISTS "CheckResult" (
  "id" TEXT PRIMARY KEY,
  "assignmentId" TEXT UNIQUE REFERENCES "CheckAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "monitorId" TEXT NOT NULL REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "probeId" TEXT NOT NULL REFERENCES "Probe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "status" "HealthStatus" NOT NULL,
  "latency" INTEGER,
  "dnsTime" INTEGER DEFAULT 0,
  "tcpTime" INTEGER DEFAULT 0,
  "tlsTime" INTEGER DEFAULT 0,
  "ttfbTime" INTEGER DEFAULT 0,
  "responseCode" INTEGER,
  "failureStage" TEXT,
  "message" TEXT,
  "resolvedIp" TEXT,
  "tlsCert" JSONB,
  "isLate" BOOLEAN NOT NULL DEFAULT false,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CheckResult_monitorId_observedAt_idx" ON "CheckResult"("monitorId", "observedAt");
CREATE INDEX IF NOT EXISTS "CheckResult_probeId_observedAt_idx" ON "CheckResult"("probeId", "observedAt");
CREATE INDEX IF NOT EXISTS "CheckResult_status_idx" ON "CheckResult"("status");
