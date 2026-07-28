import "server-only";

import { db } from "@/lib/db";
import { createConfiguredFhirClient } from "@/lib/fhir/client";
import {
  FhirMappingError,
  fromFhirPatient,
  toFhirPatient,
} from "@/lib/fhir/mapping";
import {
  isCandidateOwnedCreateResponse,
  patientCreateCondition,
  safeFhirSyncError,
} from "@/lib/fhir/sync-values";

type PatientForFhirSync = {
  id: string;
  fullName: string;
  dob: Date;
  sex: "MALE" | "FEMALE";
  mrn: string;
  email: string | null;
  phone: string | null;
};

async function markPatientSyncFailure(
  patientId: string,
  error: unknown,
) {
  const message = safeFhirSyncError(error);

  await db.patient.updateMany({
    where: {
      id: patientId,
      fhirSyncStatus: "PENDING",
    },
    data: {
      fhirSyncStatus: "FAILED",
      fhirLastError: message,
    },
  });

  return { status: "FAILED" as const, error: message };
}

function assertMatchingPatient(
  patient: PatientForFhirSync,
  mapped: ReturnType<typeof fromFhirPatient>,
) {
  if (mapped.mrn !== patient.mrn) {
    throw new FhirMappingError(
      "The FHIR server returned a Patient with a different MRN.",
    );
  }
}

export async function syncCreatedPatientToFhir(
  patient: PatientForFhirSync,
) {
  try {
    const client = createConfiguredFhirClient();
    const response = await client.transport.create(
      "Patient",
      toFhirPatient(patient),
      patientCreateCondition(patient.mrn),
    );
    const mapped = fromFhirPatient(response.resource);
    assertMatchingPatient(patient, mapped);

    const owned = isCandidateOwnedCreateResponse(
      response.status,
      response.resource,
      client.candidateId,
    );

    if (!owned) {
      throw new FhirMappingError(
        "A FHIR Patient with this MRN already exists but is not owned by this account. Review the MRN before retrying.",
      );
    }

    await db.patient.updateMany({
      where: {
        id: patient.id,
        fhirSyncStatus: "PENDING",
      },
      data: {
        fhirResourceId: mapped.fhirResourceId,
        fhirOwnership: "OWNED",
        fhirSyncStatus: "SYNCED",
        fhirLastSyncedAt: new Date(),
        fhirLastError: null,
      },
    });

    return {
      status: "SYNCED" as const,
      fhirResourceId: mapped.fhirResourceId,
    };
  } catch (error) {
    return markPatientSyncFailure(patient.id, error);
  }
}

export async function syncUpdatedPatientToFhir(
  patient: PatientForFhirSync & {
    fhirResourceId: string;
    fhirOwnership: "OWNED";
  },
) {
  try {
    const client = createConfiguredFhirClient();
    const response = await client.transport.update(
      "Patient",
      patient.fhirResourceId,
      toFhirPatient(patient, patient.fhirResourceId),
    );
    const mapped = fromFhirPatient(response.resource);
    assertMatchingPatient(patient, mapped);

    if (mapped.fhirResourceId !== patient.fhirResourceId) {
      throw new FhirMappingError(
        "The FHIR server returned a different Patient resource id.",
      );
    }

    await db.patient.updateMany({
      where: {
        id: patient.id,
        fhirResourceId: patient.fhirResourceId,
        fhirOwnership: "OWNED",
        fhirSyncStatus: "PENDING",
      },
      data: {
        fhirSyncStatus: "SYNCED",
        fhirLastSyncedAt: new Date(),
        fhirLastError: null,
      },
    });

    return {
      status: "SYNCED" as const,
      fhirResourceId: mapped.fhirResourceId,
    };
  } catch (error) {
    return markPatientSyncFailure(patient.id, error);
  }
}
