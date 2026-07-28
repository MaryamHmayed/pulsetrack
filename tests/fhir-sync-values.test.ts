import assert from "node:assert/strict";
import test from "node:test";
import { FhirRequestError } from "@/lib/fhir/transport";
import {
  FHIR_CANDIDATE_TAG_SYSTEM,
  isCandidateOwnedCreateResponse,
  isCandidateOwnedResource,
  observationCreateCondition,
  patientCreateCondition,
  safeFhirSyncError,
} from "@/lib/fhir/sync-values";

test("builds the conditional Patient create expression from the MRN", () => {
  assert.equal(
    patientCreateCondition("MRN-1001"),
    "identifier=https://challenge.capadev.dev/mrn|MRN-1001",
  );
});

test("builds the conditional Observation create expression from the local id", () => {
  assert.equal(
    observationCreateCondition("lab-result-1"),
    "identifier=https://challenge.capadev.dev/lab-result|lab-result-1",
  );
});

test("recognizes only the configured candidate ownership tag", () => {
  const resource = {
    resourceType: "Patient",
    meta: {
      tag: [
        {
          system: FHIR_CANDIDATE_TAG_SYSTEM,
          code: "candidate-1",
        },
      ],
    },
  };

  assert.equal(isCandidateOwnedResource(resource, "candidate-1"), true);
  assert.equal(isCandidateOwnedResource(resource, "candidate-2"), false);
});

test("accepts newly created or candidate-tagged writes and rejects unowned matches", () => {
  const unowned = {
    resourceType: "Patient",
    id: "patient-1",
  };
  const owned = {
    ...unowned,
    meta: {
      tag: [
        {
          system: "https://challenge.capadev.dev/tags",
          code: "candidate-1",
        },
      ],
    },
  };

  assert.equal(
    isCandidateOwnedCreateResponse(201, unowned, "candidate-1"),
    true,
  );
  assert.equal(
    isCandidateOwnedCreateResponse(200, owned, "candidate-1"),
    true,
  );
  assert.equal(
    isCandidateOwnedCreateResponse(200, unowned, "candidate-1"),
    false,
  );
});

test("surfaces bounded known FHIR errors and hides unknown failures", () => {
  const known = safeFhirSyncError(
    new FhirRequestError(`FHIR unavailable. ${"x".repeat(600)}`),
  );

  assert.equal(known.length, 500);
  assert.match(known, /^FHIR unavailable\./);
  assert.equal(
    safeFhirSyncError(new Error("database-password")),
    "FHIR synchronization failed unexpectedly.",
  );
});
