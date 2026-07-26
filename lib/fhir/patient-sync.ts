import "server-only";

import { db } from "@/lib/db";
import { createConfiguredFhirClient } from "@/lib/fhir/client";
import {
  FhirMappingError,
  fromFhirPatient,
  toFhirPatient,
} from "@/lib/fhir/mapping";
import {
  isCandidateOwnedResource,
  patientCreateCondition,
  safeFhirSyncError,
} from "@/lib/fhir/sync-values";

type CreatedPatient = {
  id: string;
  fullName: string;
  dob: Date;
  sex: "MALE" | "FEMALE";
  mrn: string;
  email: string | null;
  phone: string | null;
};

export async function syncCreatedPatientToFhir(patient: CreatedPatient) {
  try {
    const client = createConfiguredFhirClient();
    const response = await client.transport.create(
      "Patient",
      toFhirPatient(patient),
      patientCreateCondition(patient.mrn),
    );
    const mapped = fromFhirPatient(response.resource);

    if (mapped.mrn !== patient.mrn) {
      throw new FhirMappingError(
        "The FHIR server returned a Patient with a different MRN.",
      );
    }

    const owned =
      response.status === 201 ||
      isCandidateOwnedResource(response.resource, client.candidateId);
    const syncStatus = owned ? "SYNCED" : "READ_ONLY";
    const ownership = owned ? "OWNED" : "READ_ONLY";

    await db.patient.updateMany({
      where: {
        id: patient.id,
        fhirSyncStatus: "PENDING",
      },
      data: {
        fhirResourceId: mapped.fhirResourceId,
        fhirOwnership: ownership,
        fhirSyncStatus: syncStatus,
        fhirLastSyncedAt: new Date(),
        fhirLastError: null,
      },
    });

    return { status: syncStatus, fhirResourceId: mapped.fhirResourceId };
  } catch (error) {
    const message = safeFhirSyncError(error);

    await db.patient.updateMany({
      where: {
        id: patient.id,
        fhirSyncStatus: "PENDING",
      },
      data: {
        fhirSyncStatus: "FAILED",
        fhirLastError: message,
      },
    });

    return { status: "FAILED" as const, error: message };
  }
}
