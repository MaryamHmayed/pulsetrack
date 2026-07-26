import {
  FHIR_MRN_SYSTEM,
  FhirMappingError,
} from "@/lib/fhir/mapping";
import { isCandidateOwnedResource } from "@/lib/fhir/sync-values";
import type { FhirPatient } from "@/lib/fhir/types";

export const HISTORICAL_SEED_OWNER = "cand-admin";
export const EXPECTED_HISTORICAL_OBSERVATIONS_PER_PATIENT = 36;

export const HISTORICAL_SEED_MRNS = [
  "MRN-2001",
  "MRN-2002",
  "MRN-2003",
  "MRN-2004",
  "MRN-2005",
] as const;

export function patientSearchTarget(mrn: string) {
  const search = new URLSearchParams({
    identifier: `${FHIR_MRN_SYSTEM}|${mrn}`,
  });
  return `Patient?${search.toString()}`;
}

export function observationSearchTarget(patientFhirResourceId: string) {
  const search = new URLSearchParams({
    subject: `Patient/${patientFhirResourceId}`,
    _sort: "date",
    _count: "50",
  });
  return `Observation?${search.toString()}`;
}

export function selectHistoricalPatient(
  resources: FhirPatient[],
  mrn: string,
  candidateId: string,
) {
  const exactReadOnlyMatches = resources.filter(
    (resource) =>
      resource.identifier?.some(
        (identifier) =>
          identifier.system === FHIR_MRN_SYSTEM &&
          identifier.value?.trim().toUpperCase() === mrn.toUpperCase(),
      ) && !isCandidateOwnedResource(resource, candidateId),
  );
  const serverOwnedMatches = exactReadOnlyMatches.filter(
    isHistoricalSeedResource,
  );
  const matches =
    serverOwnedMatches.length > 0
      ? serverOwnedMatches
      : exactReadOnlyMatches;

  if (matches.length !== 1) {
    throw new FhirMappingError(
      `Expected exactly one read-only historical Patient for ${mrn}, but found ${matches.length}.`,
    );
  }

  return matches[0];
}

export function isHistoricalSeedResource(resource: {
  meta?: FhirPatient["meta"];
}) {
  return Boolean(
    resource.meta?.tag?.some(
      (tag) =>
        tag.system === "https://challenge.capadev.dev/tags" &&
        tag.code === HISTORICAL_SEED_OWNER,
    ),
  );
}
