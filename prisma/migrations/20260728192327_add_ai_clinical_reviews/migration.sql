-- CreateTable
CREATE TABLE "ClinicalReview" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "inputHash" CHAR(64) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "evidence" JSONB NOT NULL,
    "review" JSONB NOT NULL,
    "dataThrough" DATE NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalReview_patientId_generatedAt_idx" ON "ClinicalReview"("patientId", "generatedAt");

-- CreateIndex
CREATE INDEX "ClinicalReview_clinicianId_generatedAt_idx" ON "ClinicalReview"("clinicianId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalReview_patientId_inputHash_model_key" ON "ClinicalReview"("patientId", "inputHash", "model");

-- AddForeignKey
ALTER TABLE "ClinicalReview" ADD CONSTRAINT "ClinicalReview_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalReview" ADD CONSTRAINT "ClinicalReview_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE CASCADE ON UPDATE CASCADE;
