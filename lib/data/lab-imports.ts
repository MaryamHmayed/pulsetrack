import "server-only";

import { requireClinician } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  createLabResultKey,
  LabCsvFileError,
  parseAndValidateLabCsv,
  type LabCsvValidationReport,
} from "@/lib/labs/csv";
import {
  MAX_LAB_CSV_BYTES,
  sanitizeLabImportFileName,
} from "@/lib/labs/upload";
import {
  createLabUploadReport,
  readLabUploadReport,
  type LabUploadReport,
} from "@/lib/labs/report";

export type LabImportResult = LabCsvValidationReport & {
  importId: string;
  importedCount: number;
  report: LabUploadReport;
};

export async function importLabCsv(
  fileName: string,
  content: string,
): Promise<LabImportResult> {
  const clinician = await requireClinician();

  if (Buffer.byteLength(content, "utf8") > MAX_LAB_CSV_BYTES) {
    throw new LabCsvFileError("The CSV file must be 1 MB or smaller.");
  }

  const patients = await db.patient.findMany({
    where: { clinicianId: clinician.id },
    select: { id: true, mrn: true },
  });
  const patientIdByMrn = new Map(
    patients.map((patient) => [patient.mrn.toUpperCase(), patient.id]),
  );

  const existingResults = await db.labResult.findMany({
    where: {
      patient: { clinicianId: clinician.id },
    },
    select: {
      collectedDate: true,
      testCode: true,
      patient: { select: { mrn: true } },
    },
  });
  const existingResultKeys = new Set(
    existingResults.map((result) =>
      createLabResultKey(
        result.patient.mrn,
        result.collectedDate.toISOString().slice(0, 10),
        result.testCode,
      ),
    ),
  );

  const validation = parseAndValidateLabCsv(content, {
    knownMrns: new Set(patientIdByMrn.keys()),
    existingResultKeys,
  });
  const safeFileName = sanitizeLabImportFileName(fileName);

  return db.$transaction(
    async (transaction) => {
      const labImport = await transaction.labImport.create({
        data: {
          clinicianId: clinician.id,
          fileName: safeFileName,
          totalRows: validation.totalRows,
          acceptedCount: 0,
          rejectedCount: validation.totalRows,
        },
        select: { id: true },
      });

      if (validation.accepted.length > 0) {
        await transaction.labResult.createMany({
          data: validation.accepted.map((row) => ({
            patientId: patientIdByMrn.get(row.mrn)!,
            importId: labImport.id,
            collectedDate: row.collectedDate,
            testCode: row.testCode,
            testName: row.testName,
            value: row.value,
            unit: row.unit,
            refLow: row.refLow,
            refHigh: row.refHigh,
          })),
          skipDuplicates: true,
        });
      }

      const insertedResults = await transaction.labResult.findMany({
        where: { importId: labImport.id },
        select: {
          collectedDate: true,
          testCode: true,
          patient: { select: { mrn: true } },
        },
      });
      const insertedKeys = new Set(
        insertedResults.map((result) =>
          createLabResultKey(
            result.patient.mrn,
            result.collectedDate.toISOString().slice(0, 10),
            result.testCode,
          ),
        ),
      );
      const accepted = validation.accepted.filter((row) =>
        insertedKeys.has(row.deduplicationKey),
      );
      const concurrentDuplicates = validation.accepted
        .filter((row) => !insertedKeys.has(row.deduplicationKey))
        .map((row) => ({
          rowNumber: row.rowNumber,
          values: {
            mrn: row.mrn,
            collected_date: row.collectedDateText,
            test_code: row.testCode,
            test_name: row.testName,
            value: row.value,
            unit: row.unit,
            ref_low: row.refLow,
            ref_high: row.refHigh,
          },
          errors: ["Duplicate lab result detected while importing."],
        }));
      const rejected = [...validation.rejected, ...concurrentDuplicates].sort(
        (first, second) => first.rowNumber - second.rowNumber,
      );
      const report = createLabUploadReport({
        totalRows: validation.totalRows,
        accepted,
        rejected,
      });

      await transaction.labImport.update({
        where: { id: labImport.id },
        data: {
          acceptedCount: accepted.length,
          rejectedCount: rejected.length,
          report,
        },
      });

      return {
        importId: labImport.id,
        totalRows: validation.totalRows,
        importedCount: accepted.length,
        accepted,
        rejected,
        report,
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
}

export async function getLabImportReport(importId: string) {
  const clinician = await requireClinician();
  const labImport = await db.labImport.findFirst({
    where: {
      id: importId,
      clinicianId: clinician.id,
    },
    select: {
      id: true,
      fileName: true,
      createdAt: true,
      report: true,
      labResults: {
        select: {
          fhirSyncStatus: true,
          fhirLastError: true,
        },
      },
    },
  });

  if (!labImport) {
    return null;
  }

  const report = readLabUploadReport(labImport.report);
  if (!report) {
    return null;
  }

  return {
    id: labImport.id,
    fileName: labImport.fileName,
    createdAt: labImport.createdAt,
    report,
    fhirSync: {
      total: labImport.labResults.length,
      synced: labImport.labResults.filter(
        (result) => result.fhirSyncStatus === "SYNCED",
      ).length,
      failed: labImport.labResults.filter(
        (result) => result.fhirSyncStatus === "FAILED",
      ).length,
      pending: labImport.labResults.filter(
        (result) => result.fhirSyncStatus === "PENDING",
      ).length,
      errors: [
        ...new Set(
          labImport.labResults.flatMap((result) =>
            result.fhirLastError ? [result.fhirLastError] : [],
          ),
        ),
      ],
    },
  };
}

export async function listLabImports() {
  const clinician = await requireClinician();

  return db.labImport.findMany({
    where: { clinicianId: clinician.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      fileName: true,
      totalRows: true,
      acceptedCount: true,
      rejectedCount: true,
      createdAt: true,
      report: true,
    },
  });
}
