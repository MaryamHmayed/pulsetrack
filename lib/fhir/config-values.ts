export const DEFAULT_FHIR_BASE_URL =
  "https://fhir-challenge.vihagent.net/fhir";

export type FhirConfiguration = {
  baseUrl: string;
  candidateId: string;
  apiKey: string;
};

export class FhirConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FhirConfigurationError";
  }
}

function normalizeBaseUrl(value: string | undefined) {
  const configured = value?.trim() || DEFAULT_FHIR_BASE_URL;
  let url: URL;

  try {
    url = new URL(configured);
  } catch {
    throw new FhirConfigurationError(
      "FHIR_BASE_URL must be a valid absolute URL.",
    );
  }

  if (url.protocol !== "https:") {
    throw new FhirConfigurationError("FHIR_BASE_URL must use HTTPS.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new FhirConfigurationError(
      "FHIR_BASE_URL must not contain credentials, a query, or a fragment.",
    );
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

export function parseFhirConfiguration(values: {
  baseUrl?: string;
  candidateId?: string;
  apiKey?: string;
}): FhirConfiguration {
  const candidateId = values.candidateId?.trim() ?? "";
  const apiKey = values.apiKey?.trim() ?? "";

  if (!candidateId) {
    throw new FhirConfigurationError("FHIR_CANDIDATE_ID is not configured.");
  }

  if (!/^[a-z0-9][a-z0-9-]{2,127}$/i.test(candidateId)) {
    throw new FhirConfigurationError(
      "FHIR_CANDIDATE_ID contains unsupported characters.",
    );
  }

  if (!apiKey) {
    throw new FhirConfigurationError("FHIR_API_KEY is not configured.");
  }

  return {
    baseUrl: normalizeBaseUrl(values.baseUrl),
    candidateId,
    apiKey,
  };
}
