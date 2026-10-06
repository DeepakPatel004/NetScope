-- Add the host/notification schema that was previously absent from migrations.
-- IF NOT EXISTS also supports development databases populated with db push.
ALTER TYPE "DeviceType" ADD VALUE IF NOT EXISTS 'SERVER';
ALTER TYPE "DeviceType" ADD VALUE IF NOT EXISTS 'WORKER';
ALTER TYPE "ActivityEntity" ADD VALUE IF NOT EXISTS 'AGENT';
ALTER TYPE "ActivityEntity" ADD VALUE IF NOT EXISTS 'RECOVERY';

ALTER TABLE "Device"
  ADD COLUMN IF NOT EXISTS "agentKey" TEXT,
  ADD COLUMN IF NOT EXISTS "agentStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
  ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "metricsSource" TEXT NOT NULL DEFAULT 'EXTERNAL_HTTP',
  ADD COLUMN IF NOT EXISTS "dockerStatus" TEXT DEFAULT 'NOT_INSTALLED',
  ADD COLUMN IF NOT EXISTS "containers" JSONB,
  ADD COLUMN IF NOT EXISTS "dockerComposeProjects" JSONB,
  ADD COLUMN IF NOT EXISTS "capabilities" JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS "Device_agentKey_key" ON "Device"("agentKey");
CREATE INDEX IF NOT EXISTS "Device_agentKey_idx" ON "Device"("agentKey");

ALTER TABLE "Incident"
  ADD COLUMN IF NOT EXISTS "currentValue" TEXT,
  ADD COLUMN IF NOT EXISTS "expectedValue" TEXT,
  ADD COLUMN IF NOT EXISTS "riskLevel" TEXT DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS "businessImpact" TEXT,
  ADD COLUMN IF NOT EXISTS "recoveryRecommendation" TEXT,
  ADD COLUMN IF NOT EXISTS "evidence" JSONB,
  ADD COLUMN IF NOT EXISTS "investigatedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AgentMetric" (
  "id" TEXT PRIMARY KEY,
  "deviceId" TEXT NOT NULL REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "cpuPercent" DOUBLE PRECISION, "ramPercent" DOUBLE PRECISION,
  "ramUsedMb" DOUBLE PRECISION, "ramTotalMb" DOUBLE PRECISION,
  "diskPercent" DOUBLE PRECISION, "diskUsedGb" DOUBLE PRECISION, "diskTotalGb" DOUBLE PRECISION,
  "loadAvg" DOUBLE PRECISION, "netBytesSent" DOUBLE PRECISION, "netBytesRecv" DOUBLE PRECISION,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AgentMetric_deviceId_idx" ON "AgentMetric"("deviceId");
CREATE INDEX IF NOT EXISTS "AgentMetric_checkedAt_idx" ON "AgentMetric"("checkedAt");
CREATE INDEX IF NOT EXISTS "AgentMetric_deviceId_checkedAt_idx" ON "AgentMetric"("deviceId", "checkedAt");

CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "notifyAnomaly" BOOLEAN NOT NULL DEFAULT true,
  "notifyUnavailable" BOOLEAN NOT NULL DEFAULT true,
  "notifyCritical" BOOLEAN NOT NULL DEFAULT true,
  "notifyRecovery" BOOLEAN NOT NULL DEFAULT true,
  "minSeverity" "Severity" NOT NULL DEFAULT 'MEDIUM',
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "notifyRecovery" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "deviceId" TEXT, "incidentId" TEXT,
  "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
  "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_sentAt_idx" ON "Notification"("sentAt");

-- Retain the historical action/audit data model; no execution endpoints exist.
CREATE TABLE IF NOT EXISTS "RecoveryAction" (
  "id" TEXT PRIMARY KEY,
  "incidentId" TEXT REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "deviceId" TEXT NOT NULL REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "actionType" TEXT NOT NULL, "targetName" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'DOCKER', "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL, "reason" TEXT, "cliCommand" TEXT,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
  "approvedById" TEXT, "approvedAt" TIMESTAMP(3), "executedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "executionResult" TEXT, "verificationResult" TEXT, "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RecoveryAction_incidentId_idx" ON "RecoveryAction"("incidentId");
CREATE INDEX IF NOT EXISTS "RecoveryAction_deviceId_idx" ON "RecoveryAction"("deviceId");
CREATE INDEX IF NOT EXISTS "RecoveryAction_status_idx" ON "RecoveryAction"("status");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
