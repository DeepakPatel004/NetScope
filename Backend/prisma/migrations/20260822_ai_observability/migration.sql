-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anomalyScore" DOUBLE PRECISION NOT NULL,
    "severity" "Severity" NOT NULL,
    "detectionReason" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "priority" "Severity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN "priorityReason" TEXT,
ADD COLUMN "summary" TEXT,
ADD COLUMN "possibleCauses" JSONB,
ADD COLUMN "recommendedActions" JSONB,
ADD COLUMN "confidence" DOUBLE PRECISION,
ADD COLUMN "timeline" JSONB,
ADD COLUMN "anomalyId" TEXT;

-- CreateIndex
CREATE INDEX "Anomaly_deviceId_idx" ON "Anomaly"("deviceId");
CREATE INDEX "Anomaly_timestamp_idx" ON "Anomaly"("timestamp");
CREATE INDEX "Anomaly_deviceId_timestamp_idx" ON "Anomaly"("deviceId", "timestamp");
CREATE INDEX "Anomaly_severity_idx" ON "Anomaly"("severity");
CREATE INDEX "Incident_priority_idx" ON "Incident"("priority");

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_anomalyId_fkey" FOREIGN KEY ("anomalyId") REFERENCES "Anomaly"("id") ON DELETE SET NULL ON UPDATE CASCADE;
