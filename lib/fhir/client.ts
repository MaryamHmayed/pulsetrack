import "server-only";

import { parseFhirConfiguration } from "@/lib/fhir/config-values";
import { createFhirTransport } from "@/lib/fhir/transport";

export function getFhirConfiguration() {
  return parseFhirConfiguration({
    baseUrl: process.env.FHIR_BASE_URL,
    candidateId: process.env.FHIR_CANDIDATE_ID,
    apiKey: process.env.FHIR_API_KEY,
  });
}

export function createConfiguredFhirClient() {
  const configuration = getFhirConfiguration();

  return {
    candidateId: configuration.candidateId,
    transport: createFhirTransport({
      baseUrl: configuration.baseUrl,
      apiKey: configuration.apiKey,
    }),
  };
}
