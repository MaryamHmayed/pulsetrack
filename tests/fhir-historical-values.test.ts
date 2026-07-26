import assert from "node:assert/strict";
import test from "node:test";
import {
  FHIR_CANDIDATE_TAG_SYSTEM,
} from "@/lib/fhir/sync-values";
import { FHIR_MRN_SYSTEM, FhirMappingError } from "@/lib/fhir/mapping";
import {
  observationSearchTarget,
  patientSearchTarget,
  selectHistoricalPatient,
} from "@/lib/fhir/historical-values";

test("builds encoded FHIR searches for historical resources", () => {
  assert.equal(
    patientSearchTarget("MRN-2001"),
    "Patient?identifier=https%3A%2F%2Fchallenge.capadev.dev%2Fmrn%7CMRN-2001",
  );
  assert.equal(
    observationSearchTarget("patient-1"),
    "Observation?subject=Patient%2Fpatient-1&_sort=date&_count=50",
  );
});

test("selects the exact read-only seed patient instead of candidate-owned data", () => {
  const seed = {
    resourceType: "Patient" as const,
    id: "seed-1",
    identifier: [{ system: FHIR_MRN_SYSTEM, value: "MRN-2001" }],
    meta: {
      tag: [
        { system: FHIR_CANDIDATE_TAG_SYSTEM, code: "cand-admin" },
      ],
    },
  };
  const owned = {
    ...seed,
    id: "owned-1",
    meta: {
      tag: [
        { system: FHIR_CANDIDATE_TAG_SYSTEM, code: "candidate-1" },
      ],
    },
  };

  assert.equal(
    selectHistoricalPatient([owned, seed], "MRN-2001", "candidate-1").id,
    "seed-1",
  );
});

test("rejects missing or ambiguous historical patient matches", () => {
  const seed = {
    resourceType: "Patient" as const,
    id: "seed-1",
    identifier: [{ system: FHIR_MRN_SYSTEM, value: "MRN-2001" }],
  };

  assert.throws(
    () => selectHistoricalPatient([], "MRN-2001", "candidate-1"),
    FhirMappingError,
  );
  assert.throws(
    () =>
      selectHistoricalPatient(
        [seed, { ...seed, id: "seed-2" }],
        "MRN-2001",
        "candidate-1",
      ),
    FhirMappingError,
  );
});
