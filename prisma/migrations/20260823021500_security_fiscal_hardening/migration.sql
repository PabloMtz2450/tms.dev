-- TMS XOLUM security/fiscal hardening migration
-- Designed to migrate the pre-hardening schema without silently accepting cross-tenant data.

DO $$ BEGIN
  CREATE TYPE "FiscalDocumentStatus" AS ENUM ('DRAFT','VALIDATED','SIGNING','SIGNED','STAMPING','STAMPED','RECOVERY_REQUIRED','CANCEL_PENDING','CANCELLED','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Preflight: refuse to add tenant-safe constraints if historical data is already inconsistent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Shipment" s JOIN "Customer" c ON c.id = s."customerId"
    WHERE s."organizationId" <> c."organizationId"
  ) THEN
    RAISE EXCEPTION 'TENANT_INTEGRITY: Shipment references Customer from another organization';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Route" r JOIN "Vehicle" v ON v.id = r."vehicleId"
    WHERE r."vehicleId" IS NOT NULL AND r."organizationId" <> v."organizationId"
  ) THEN
    RAISE EXCEPTION 'TENANT_INTEGRITY: Route references Vehicle from another organization';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Route" r JOIN "Driver" d ON d.id = r."driverId"
    WHERE r."driverId" IS NOT NULL AND r."organizationId" <> d."organizationId"
  ) THEN
    RAISE EXCEPTION 'TENANT_INTEGRITY: Route references Driver from another organization';
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordSalt" TEXT,
  ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Stop" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
UPDATE "Stop" s
SET "organizationId" = sh."organizationId"
FROM "Shipment" sh
WHERE sh.id = s."shipmentId" AND s."organizationId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Stop" WHERE "organizationId" IS NULL) THEN
    RAISE EXCEPTION 'TENANT_INTEGRITY: Stop without organization after backfill';
  END IF;
END $$;
ALTER TABLE "Stop" ALTER COLUMN "organizationId" SET NOT NULL;

-- Composite uniqueness required by tenant-scoped foreign keys.
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_organizationId_id_key" ON "Customer"("organizationId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_organizationId_id_key" ON "Vehicle"("organizationId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Driver_organizationId_id_key" ON "Driver"("organizationId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_organizationId_id_key" ON "Shipment"("organizationId", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "Route_organizationId_id_key" ON "Route"("organizationId", "id");

ALTER TABLE "Shipment" DROP CONSTRAINT IF EXISTS "Shipment_customerId_fkey";
ALTER TABLE "Route" DROP CONSTRAINT IF EXISTS "Route_vehicleId_fkey";
ALTER TABLE "Route" DROP CONSTRAINT IF EXISTS "Route_driverId_fkey";
ALTER TABLE "Stop" DROP CONSTRAINT IF EXISTS "Stop_routeId_fkey";
ALTER TABLE "Stop" DROP CONSTRAINT IF EXISTS "Stop_shipmentId_fkey";

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_organizationId_customerId_fkey"
  FOREIGN KEY ("organizationId", "customerId") REFERENCES "Customer"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_organizationId_vehicleId_fkey"
  FOREIGN KEY ("organizationId", "vehicleId") REFERENCES "Vehicle"("organizationId", "id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_organizationId_driverId_fkey"
  FOREIGN KEY ("organizationId", "driverId") REFERENCES "Driver"("organizationId", "id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Stop" ADD CONSTRAINT "Stop_organizationId_routeId_fkey"
  FOREIGN KEY ("organizationId", "routeId") REFERENCES "Route"("organizationId", "id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Stop" ADD CONSTRAINT "Stop_organizationId_shipmentId_fkey"
  FOREIGN KEY ("organizationId", "shipmentId") REFERENCES "Shipment"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "Session_organizationId_expiresAt_idx" ON "Session"("organizationId", "expiresAt");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "FiscalDocument" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "sourceFingerprint" TEXT,
  "unsignedXmlHash" TEXT,
  "signedXmlHash" TEXT,
  "stampedXmlHash" TEXT,
  "uuid" TEXT,
  "finkokWorkProcessId" TEXT,
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "recoveryAttempts" INTEGER NOT NULL DEFAULT 0,
  "xmlObjectKey" TEXT,
  "pdfObjectKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "stampedAt" TIMESTAMP(3),
  CONSTRAINT "FiscalDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FiscalDocument_organizationId_idempotencyKey_key" ON "FiscalDocument"("organizationId", "idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "FiscalDocument_organizationId_uuid_key" ON "FiscalDocument"("organizationId", "uuid");
CREATE INDEX IF NOT EXISTS "FiscalDocument_organizationId_status_updatedAt_idx" ON "FiscalDocument"("organizationId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "FiscalDocument_sourceFingerprint_idx" ON "FiscalDocument"("sourceFingerprint");
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "previousHash" TEXT,
  "eventHash" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditEvent_organizationId_occurredAt_idx" ON "AuditEvent"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_organizationId_resourceType_resourceId_occurredAt_idx" ON "AuditEvent"("organizationId", "resourceType", "resourceId", "occurredAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_actorId_occurredAt_idx" ON "AuditEvent"("actorId", "occurredAt");
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

CREATE INDEX IF NOT EXISTS "User_email_lockedUntil_idx" ON "User"("email", "lockedUntil");
CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX IF NOT EXISTS "Membership_organizationId_role_idx" ON "Membership"("organizationId", "role");
CREATE INDEX IF NOT EXISTS "Customer_organizationId_name_idx" ON "Customer"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "Vehicle_organizationId_label_idx" ON "Vehicle"("organizationId", "label");
CREATE INDEX IF NOT EXISTS "Driver_organizationId_name_idx" ON "Driver"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "Shipment_organizationId_status_createdAt_idx" ON "Shipment"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Shipment_organizationId_customerId_idx" ON "Shipment"("organizationId", "customerId");
CREATE INDEX IF NOT EXISTS "Route_organizationId_status_createdAt_idx" ON "Route"("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Route_organizationId_vehicleId_idx" ON "Route"("organizationId", "vehicleId");
CREATE INDEX IF NOT EXISTS "Route_organizationId_driverId_idx" ON "Route"("organizationId", "driverId");
CREATE INDEX IF NOT EXISTS "Stop_organizationId_routeId_sequence_idx" ON "Stop"("organizationId", "routeId", "sequence");
CREATE INDEX IF NOT EXISTS "Stop_organizationId_shipmentId_idx" ON "Stop"("organizationId", "shipmentId");
