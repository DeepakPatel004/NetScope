BEGIN;
-- Older notification rows did not always retain an incident FK.
DELETE FROM "Notification" AS n WHERE n."type" IN ('INCIDENT', 'RECOVERY')
AND NOT EXISTS (SELECT 1 FROM "Incident" AS i WHERE i."id" = n."incidentId");
DELETE FROM "AuditLog" WHERE "action" IN (
 'RECOVERY_POLICY_UPDATED', 'RECOVERY_APPROVED', 'RECOVERY_VERIFIED_SUCCESS',
 'AI_RECOVERY_RECOMMENDED', 'RECOVERY_EXECUTED_SUCCESS', 'USER_APPROVAL_GRANTED',
 'AI_INVESTIGATION', 'RECOVERY_EXECUTED', 'RECOVERY_VERIFIED'
);
-- Align hand-written distributed migration defaults with Prisma @updatedAt.
ALTER TABLE "CheckAssignment" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ControlEndpoint" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Probe" ALTER COLUMN "updatedAt" DROP DEFAULT;
COMMIT;
