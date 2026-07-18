-- CreateTable
CREATE TABLE "PortScanLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "openPorts" INTEGER[],
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortScanLog_deviceId_idx" ON "PortScanLog"("deviceId");

-- CreateIndex
CREATE INDEX "PortScanLog_checkedAt_idx" ON "PortScanLog"("checkedAt");

-- CreateIndex
CREATE INDEX "PortScanLog_deviceId_checkedAt_idx" ON "PortScanLog"("deviceId", "checkedAt");

-- AddForeignKey
ALTER TABLE "PortScanLog" ADD CONSTRAINT "PortScanLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
