import { FhirConfigurationError } from "@/lib/fhir/config-values";
import {
  FHIR_LAB_IDENTIFIER_SYSTEM,
  FhirMappingError,
  FHIR_MRN_SYSTEM,
} from "@/lib/fhir/mapping";
import { FhirRequestError } from "@/lib/fhir/transport";
import type { FhirResource } from "@/lib/fhir/types";

export const FHIR_CANDIDATE_TAG_SYSTEM =
  "https://challenge.capadev.dev/tags";

const MAX_SYNC_ERROR_LENGTH = 500;

export function patientCreateCondition(mrn: string) {
  return `identifier=${FHIR_MRN_SYSTEM}|${mrn}`;
}

export function observationCreateCondition(labResultId: string) {
  return `identifier=${FHIR_LAB_IDENTIFIER_SYSTEM}|${labResultId}`;
}

export function isCandidateOwnedResource(
  resource: FhirResource,
  candidateId: string,
) {
  return Boolean(
    resource.meta?.tag?.some(
      (tag) =>
        tag.system === FHIR_CANDIDATE_TAG_SYSTEM &&
        tag.code === candidateId,
    ),
  );
}

export function isCandidateOwnedCreateResponse(
  status: number,
  resource: FhirResource,
  candidateId: string,
) {
  return status === 201 || isCandidateOwnedResource(resource, candidateId);
}

export function safeFhirSyncError(error: unknown) {
  if (
    error instanceof FhirRequestError ||
    error instanceof FhirConfigurationError ||
    error instanceof FhirMappingError
  ) {
    return error.message.slice(0, MAX_SYNC_ERROR_LENGTH);
  }

  return "FHIR synchronization failed unexpectedly.";
}
