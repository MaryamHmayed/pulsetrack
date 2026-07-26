import "dotenv/config";

import {
  FhirConfigurationError,
  parseFhirConfiguration,
} from "../lib/fhir/config-values";
import {
  createFhirTransport,
  FhirRequestError,
} from "../lib/fhir/transport";
import { FHIR_MRN_SYSTEM } from "../lib/fhir/mapping";
import type { FhirPatient, FhirResource } from "../lib/fhir/types";

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

  const mrn = process.argv[2]?.trim().toUpperCase();

  if (mrn) {
    const search = new URLSearchParams({
      identifier: `${FHIR_MRN_SYSTEM}|${mrn}`,
    });
    const patients = await transport.searchAll<FhirPatient>(
      `Patient?${search.toString()}`,
    );

    if (patients.length === 0) {
      console.log(`No FHIR Patient found for MRN ${mrn}.`);
      process.exitCode = 1;
      return;
    }

    console.log(
      `Found ${patients.length} FHIR Patient resource(s) for MRN ${mrn}: ${patients
        .map(
          (patient) =>
            `${patient.id ?? "missing-id"} (version ${patient.meta?.versionId ?? "unknown"})`,
        )
        .join(", ")}.`,
    );
  }
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
