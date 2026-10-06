-- Retire the host-agent/AI/port-audit schema. Back up existing databases first.
-- Preserve users, supported HTTP monitors and distributed observations.
BEGIN;
DELETE FROM "Notification" WHERE "incidentId" IN (
  SELECT "id" FROM "Incident" WHERE "assessment" IS NULL
) OR "deviceId" IN (SELECT "id" FROM "Device" WHERE "type"::text NOT IN ('WEBSITE', 'API'))
  OR "type" IN ('ANOMALY', 'INVESTIGATION');
DELETE FROM "Incident" WHERE "assessment" IS NULL;
DELETE FROM "Device" WHERE "type"::text NOT IN ('WEBSITE', 'API');
-- HealthLog remains the read projection used by charts/reports. Remove legacy
-- rows and invalid control/late projections, retaining rows backed by target results.
DELETE FROM "HealthLog" AS h WHERE NOT EXISTS (
  SELECT 1 FROM "CheckResult" AS r JOIN "CheckAssignment" AS a ON a."id" = r."assignmentId"
  WHERE r."monitorId" = h."deviceId" AND r."observedAt" = h."checkedAt"
    AND r."isLate" = false AND a."kind" <> 'CONTROL_CHECK'
);
DELETE FROM "ActivityLog" WHERE "entity"::text IN ('AGENT', 'RECOVERY');
-- AlterEnum

CREATE TYPE "DeviceType_new" AS ENUM ('WEBSITE', 'API');
ALTER TABLE "Device" ALTER COLUMN "type" TYPE "DeviceType_new" USING ("type"::text::"DeviceType_new");
ALTER TYPE "DeviceType" RENAME TO "DeviceType_old";
ALTER TYPE "DeviceType_new" RENAME TO "DeviceType";
DROP TYPE "DeviceType_old";


-- AlterEnum

CREATE TYPE "ActivityEntity_new" AS ENUM ('DEVICE', 'USER');
ALTER TABLE "ActivityLog" ALTER COLUMN "entity" TYPE "ActivityEntity_new" USING ("entity"::text::"ActivityEntity_new");
ALTER TYPE "ActivityEntity" RENAME TO "ActivityEntity_old";
ALTER TYPE "ActivityEntity_new" RENAME TO "ActivityEntity";
DROP TYPE "ActivityEntity_old";


-- DropForeignKey
ALTER TABLE "AgentMetric" DROP CONSTRAINT "AgentMetric_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "SSLStatus" DROP CONSTRAINT "SSLStatus_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "PortScanLog" DROP CONSTRAINT "PortScanLog_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "Anomaly" DROP CONSTRAINT "Anomaly_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_anomalyId_fkey";

-- DropForeignKey
ALTER TABLE "RecoveryAction" DROP CONSTRAINT "RecoveryAction_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "RecoveryAction" DROP CONSTRAINT "RecoveryAction_deviceId_fkey";

-- DropIndex
DROP INDEX "Device_agentKey_key";

-- DropIndex
DROP INDEX "Device_agentKey_idx";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "agentKey",
DROP COLUMN "agentStatus",
DROP COLUMN "capabilities",
DROP COLUMN "containers",
DROP COLUMN "dockerComposeProjects",
DROP COLUMN "dockerStatus",
DROP COLUMN "lastSeen",
DROP COLUMN "metricsSource",
ALTER COLUMN "interval" SET DEFAULT 30;

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "anomalyId",
DROP COLUMN "businessImpact",
DROP COLUMN "confidence",
DROP COLUMN "currentValue",
DROP COLUMN "evidence",
DROP COLUMN "expectedValue",
DROP COLUMN "investigatedAt",
DROP COLUMN "possibleCauses",
DROP COLUMN "recommendedActions",
DROP COLUMN "recoveryRecommendation",
DROP COLUMN "riskLevel";

-- AlterTable
ALTER TABLE "CheckResult" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'ROUTINE';

-- DropTable
DROP TABLE "AgentMetric";

-- DropTable
DROP TABLE "SSLStatus";

-- DropTable
DROP TABLE "PortScanLog";

-- DropTable
DROP TABLE "Anomaly";

-- DropTable
DROP TABLE "RecoveryAction";

-- DropEnum
DROP TYPE "CertificateStatus";

-- Preserve the distinction even if an assignment is later removed.
UPDATE "CheckResult" AS r SET "kind" = a."kind"
FROM "CheckAssignment" AS a WHERE r."assignmentId" = a."id";
COMMIT;
