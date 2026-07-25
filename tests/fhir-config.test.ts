import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FHIR_BASE_URL,
  FhirConfigurationError,
  parseFhirConfiguration,
} from "@/lib/fhir/config-values";

test("parses and normalizes the private FHIR configuration", () => {
  assert.deepEqual(
    parseFhirConfiguration({
      baseUrl: `${DEFAULT_FHIR_BASE_URL}/`,
      candidateId: "cand-pulsetrack-1",
      apiKey: "secret-test-key",
    }),
    {
      baseUrl: DEFAULT_FHIR_BASE_URL,
      candidateId: "cand-pulsetrack-1",
      apiKey: "secret-test-key",
    },
  );
});

test("requires credentials and an HTTPS credential-free base URL", () => {
  assert.throws(
    () =>
      parseFhirConfiguration({
        candidateId: "",
        apiKey: "secret-test-key",
      }),
    FhirConfigurationError,
  );
  assert.throws(
    () =>
      parseFhirConfiguration({
        candidateId: "candidate_unsupported",
        apiKey: "secret-test-key",
      }),
    FhirConfigurationError,
  );
  assert.throws(
    () =>
      parseFhirConfiguration({
        baseUrl: "http://example.com/fhir",
        candidateId: "cand-pulsetrack-1",
        apiKey: "secret-test-key",
      }),
    FhirConfigurationError,
  );
  assert.throws(
    () =>
      parseFhirConfiguration({
        baseUrl: "https://user:password@example.com/fhir",
        candidateId: "cand-pulsetrack-1",
        apiKey: "secret-test-key",
      }),
    FhirConfigurationError,
  );
});
