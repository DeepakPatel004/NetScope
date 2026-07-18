-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'EXPIRING', 'EXPIRED', 'INVALID');

-- CreateTable
CREATE TABLE "SSLStatus" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "issuer" TEXT,
    "subject" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "daysRemaining" INTEGER,
    "serialNumber" TEXT,
    "fingerprint" TEXT,
    "status" "CertificateStatus" NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSLStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SSLStatus_deviceId_idx" ON "SSLStatus"("deviceId");

-- CreateIndex
CREATE INDEX "SSLStatus_checkedAt_idx" ON "SSLStatus"("checkedAt");

-- CreateIndex
CREATE INDEX "SSLStatus_deviceId_checkedAt_idx" ON "SSLStatus"("deviceId", "checkedAt");

-- AddForeignKey
ALTER TABLE "SSLStatus" ADD CONSTRAINT "SSLStatus_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
