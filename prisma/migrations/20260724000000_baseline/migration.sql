-- Baseline for the schema that existed before Prisma Migrate was introduced.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."Clinician" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clinician_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Patient" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Clinician_email_key" ON "public"."Clinician"("email" ASC);
CREATE UNIQUE INDEX "Patient_mrn_key" ON "public"."Patient"("mrn" ASC);
