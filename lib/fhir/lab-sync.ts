import "server-only";

import { db } from "@/lib/db";
import { requireClinician } from "@/lib/auth/session";
import { createConfiguredFhirClient } from "@/lib/fhir/client";
import {
  FhirMappingError,
  fromFhirObservation,
  toFhirObservation,
} from "@/lib/fhir/mapping";
import {
  isCandidateOwnedResource,
  observationCreateCondition,
  safeFhirSyncError,
} from "@/lib/fhir/sync-values";
import { syncCreatedPatientToFhir } from "@/lib/fhir/patient-sync";
import { isKnownLabTestCode } from "@/lib/labs/definition";

async function markLabSyncFailure(labResultId: string, error: unknown) {
  const message = safeFhirSyncError(error);

  await db.labResult.updateMany({
    where: {
      id: labResultId,
      fhirSyncStatus: "PENDING",
    },
    data: {
      fhirSyncStatus: "FAILED",
      fhirLastError: message,
    },
  });

  return message;
}

export async function syncLabImportToFhir(importId: string) {
  const clinician = await requireClinician();
  const results = await db.labResult.findMany({
    where: {
      importId,
      import: { clinicianId: clinician.id },
      source: "LOCAL",
      fhirSyncStatus: "PENDING",
    },
    orderBy: { id: "asc" },
    select: {
      id: true,
      collectedDate: true,
      testCode: true,
      testName: true,
      value: true,
      unit: true,
      refLow: true,
      refHigh: true,
      patient: {
        select: {
          id: true,
          fullName: true,
          dob: true,
          sex: true,
          mrn: true,
          email: true,
          phone: true,
          fhirResourceId: true,
          fhirOwnership: true,
        },
      },
    },
  });

  if (results.length === 0) {
    return { total: 0, synced: 0, failed: 0 };
  }

  let client: ReturnType<typeof createConfiguredFhirClient>;

  try {
    client = createConfiguredFhirClient();
  } catch (error) {
    await Promise.all(
      results.map((result) => markLabSyncFailure(result.id, error)),
    );
    return { total: results.length, synced: 0, failed: results.length };
  }

  const patientFhirIds = new Map<string, string | null>();
  let synced = 0;
  let failed = 0;

  for (const result of results) {
    let patientFhirResourceId = patientFhirIds.get(result.patient.id);

    if (patientFhirResourceId === undefined) {
      patientFhirResourceId = result.patient.fhirResourceId;

      if (
        !patientFhirResourceId &&
        result.patient.fhirOwnership !== "READ_ONLY" &&
        (result.patient.sex === "MALE" || result.patient.sex === "FEMALE")
      ) {
        await db.patient.updateMany({
          where: {
            id: result.patient.id,
            fhirResourceId: null,
            OR: [
              { fhirOwnership: null },
              { fhirOwnership: "OWNED" },
            ],
          },
          data: {
            fhirSyncStatus: "PENDING",
            fhirLastError: null,
          },
        });
        const patientSync = await syncCreatedPatientToFhir({
          ...result.patient,
          sex: result.patient.sex,
        });
        patientFhirResourceId =
          "fhirResourceId" in patientSync
            ? patientSync.fhirResourceId
            : null;
      }

      patientFhirIds.set(result.patient.id, patientFhirResourceId ?? null);
    }

    if (!patientFhirResourceId) {
      await markLabSyncFailure(
        result.id,
        new FhirMappingError(
          "The patient must be synchronized with FHIR before its lab results can be sent.",
        ),
      );
      failed += 1;
      continue;
    }

    if (!isKnownLabTestCode(result.testCode)) {
      await markLabSyncFailure(
        result.id,
        new FhirMappingError(
          "The stored lab result uses an unsupported test code.",
        ),
      );
      failed += 1;
      continue;
    }

    try {
      const response = await client.transport.create(
        "Observation",
        toFhirObservation({
          id: result.id,
          patientFhirResourceId,
          collectedDate: result.collectedDate,
          testCode: result.testCode,
          testName: result.testName,
          value: result.value.toNumber(),
          unit: result.unit,
          refLow: result.refLow?.toNumber() ?? null,
          refHigh: result.refHigh?.toNumber() ?? null,
        }),
        observationCreateCondition(result.id),
      );
      const mapped = fromFhirObservation(response.resource);

      if (mapped.patientFhirResourceId !== patientFhirResourceId) {
        throw new FhirMappingError(
          "The FHIR server linked the Observation to a different Patient.",
        );
      }

      const owned =
        response.status === 201 ||
        isCandidateOwnedResource(response.resource, client.candidateId);

      if (!owned) {
        throw new FhirMappingError(
          "The matching FHIR Observation is not owned by this candidate.",
        );
      }

      await db.labResult.updateMany({
        where: {
          id: result.id,
          fhirSyncStatus: "PENDING",
        },
        data: {
          fhirResourceId: mapped.fhirResourceId,
          fhirSyncStatus: "SYNCED",
          fhirLastSyncedAt: new Date(),
          fhirLastError: null,
        },
      });
      synced += 1;
    } catch (error) {
      await markLabSyncFailure(result.id, error);
      failed += 1;
    }
  }

  return { total: results.length, synced, failed };
}
