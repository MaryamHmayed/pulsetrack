-- CreateEnum
CREATE TYPE "FhirSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "FhirOwnership" AS ENUM ('OWNED', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "ClinicalDataSource" AS ENUM ('LOCAL', 'FHIR');

-- AlterTable
ALTER TABLE "LabResult" ADD COLUMN     "fhirLastError" VARCHAR(500),
ADD COLUMN     "fhirLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "fhirResourceId" TEXT,
ADD COLUMN     "fhirSyncStatus" "FhirSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "source" "ClinicalDataSource" NOT NULL DEFAULT 'LOCAL';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "fhirLastError" VARCHAR(500),
ADD COLUMN     "fhirLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "fhirOwnership" "FhirOwnership",
ADD COLUMN     "fhirResourceId" TEXT,
ADD COLUMN     "fhirSyncStatus" "FhirSyncStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "LabResult_fhirResourceId_key" ON "LabResult"("fhirResourceId");

-- CreateIndex
CREATE INDEX "LabResult_fhirSyncStatus_idx" ON "LabResult"("fhirSyncStatus");

-- CreateIndex
CREATE INDEX "LabResult_source_idx" ON "LabResult"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_fhirResourceId_key" ON "Patient"("fhirResourceId");

-- CreateIndex
CREATE INDEX "Patient_clinicianId_fhirSyncStatus_idx" ON "Patient"("clinicianId", "fhirSyncStatus");
