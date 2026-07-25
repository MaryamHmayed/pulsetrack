import "dotenv/config";

import {
  FhirConfigurationError,
  parseFhirConfiguration,
} from "../lib/fhir/config-values";
import {
  createFhirTransport,
  FhirRequestError,
} from "../lib/fhir/transport";
import type { FhirResource } from "../lib/fhir/types";

type CapabilityStatement = FhirResource & {
  resourceType: "CapabilityStatement";
  fhirVersion?: string;
};

async function main() {
  const configuration = parseFhirConfiguration({
    baseUrl: process.env.FHIR_BASE_URL,
    candidateId: process.env.FHIR_CANDIDATE_ID,
    apiKey: process.env.FHIR_API_KEY,
  });
  const transport = createFhirTransport({
    baseUrl: configuration.baseUrl,
    apiKey: configuration.apiKey,
  });
  const capability = await transport.get<CapabilityStatement>("metadata");

  if (capability.resourceType !== "CapabilityStatement") {
    throw new FhirRequestError(
      "The configured endpoint did not return a FHIR CapabilityStatement.",
    );
  }

  const version = capability.fhirVersion
    ? ` (FHIR ${capability.fhirVersion})`
    : "";

  console.log(`FHIR connection successful${version}.`);
}

main().catch((error: unknown) => {
  if (
    error instanceof FhirConfigurationError ||
    error instanceof FhirRequestError
  ) {
    console.error(error.message);
  } else {
    console.error("FHIR connection check failed unexpectedly.");
  }

  process.exitCode = 1;
});
