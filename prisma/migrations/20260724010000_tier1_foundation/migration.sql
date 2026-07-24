-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('SENT', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RiskBand" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- Add and backfill clinician audit data.
ALTER TABLE "Clinician" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Clinician" SET "updatedAt" = "createdAt";
ALTER TABLE "Clinician" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Add patient ownership and audit data without discarding legacy rows.
ALTER TABLE "Patient"
  ADD COLUMN "clinicianId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3),
  ADD COLUMN "sexNormalized" "Sex";

UPDATE "Patient"
SET
  "clinicianId" = (
    SELECT "id"
    FROM "Clinician"
    ORDER BY "createdAt" ASC
    LIMIT 1
  ),
  "updatedAt" = "createdAt",
  "sexNormalized" = CASE LOWER("sex")
    WHEN 'female' THEN 'FEMALE'::"Sex"
    WHEN 'f' THEN 'FEMALE'::"Sex"
    WHEN 'male' THEN 'MALE'::"Sex"
    WHEN 'm' THEN 'MALE'::"Sex"
    WHEN 'other' THEN 'OTHER'::"Sex"
    ELSE 'UNKNOWN'::"Sex"
  END;

ALTER TABLE "Patient"
  ALTER COLUMN "clinicianId" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "sexNormalized" SET NOT NULL,
  ALTER COLUMN "dob" SET DATA TYPE DATE USING "dob"::date,
  DROP COLUMN "sex";

ALTER TABLE "Patient" RENAME COLUMN "sexNormalized" TO "sex";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "responses" JSONB,
    "score" INTEGER,
    "riskBand" "RiskBand",

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabImport" (
    "id" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "acceptedCount" INTEGER NOT NULL,
    "rejectedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "importId" TEXT,
    "collectedDate" DATE NOT NULL,
    "testCode" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "refLow" DECIMAL(12,4) NOT NULL,
    "refHigh" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_clinicianId_idx" ON "Session"("clinicianId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Assessment_tokenHash_key" ON "Assessment"("tokenHash");
CREATE INDEX "Assessment_patientId_sentAt_idx" ON "Assessment"("patientId", "sentAt");
CREATE INDEX "Assessment_status_expiresAt_idx" ON "Assessment"("status", "expiresAt");
CREATE INDEX "LabImport_clinicianId_createdAt_idx" ON "LabImport"("clinicianId", "createdAt");
CREATE INDEX "LabResult_patientId_testCode_collectedDate_idx" ON "LabResult"("patientId", "testCode", "collectedDate");
CREATE INDEX "LabResult_importId_idx" ON "LabResult"("importId");
CREATE UNIQUE INDEX "LabResult_patientId_collectedDate_testCode_key" ON "LabResult"("patientId", "collectedDate", "testCode");
CREATE INDEX "Patient_clinicianId_idx" ON "Patient"("clinicianId");
CREATE INDEX "Patient_clinicianId_fullName_idx" ON "Patient"("clinicianId", "fullName");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabImport" ADD CONSTRAINT "LabImport_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_importId_fkey" FOREIGN KEY ("importId") REFERENCES "LabImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
