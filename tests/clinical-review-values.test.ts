import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClinicalEvidenceSnapshot,
  type ClinicalEvidenceSnapshot,
} from "@/lib/ai/clinical-evidence";
import {
  StoredClinicalReviewError,
  clinicalEvidenceDataThrough,
  clinicalEvidenceFingerprint,
  parseStoredClinicalEvidence,
} from "@/lib/ai/review-values";

function buildSnapshot(asOf: string): ClinicalEvidenceSnapshot {
  return buildClinicalEvidenceSnapshot({
    asOf: new Date(`${asOf}T00:00:00.000Z`),
    dob: new Date("1980-01-01T00:00:00.000Z"),
    sex: "FEMALE",
    labResults: [
      {
        collectedDate: new Date("2026-06-10T00:00:00.000Z"),
        testCode: "HBA1C",
        testName: "Hemoglobin A1c",
        value: 6.4,
        unit: "%",
        refLow: 4,
        refHigh: 5.6,
        source: "FHIR",
      },
    ],
    assessments: [],
  });
}

test("fingerprints evidence content without becoming stale every day", () => {
  const first = buildSnapshot("2026-07-28");
  const nextDay = buildSnapshot("2026-07-29");

  assert.equal(
    clinicalEvidenceFingerprint(first),
    clinicalEvidenceFingerprint(nextDay),
  );
  assert.equal(
    clinicalEvidenceDataThrough(first).toISOString(),
    "2026-06-10T00:00:00.000Z",
  );
});

test("validates stored evidence before returning it to the UI", () => {
  const snapshot = buildSnapshot("2026-07-28");

  assert.deepEqual(
    parseStoredClinicalEvidence(snapshot.evidence),
    snapshot.evidence,
  );

  assert.throws(
    () =>
      parseStoredClinicalEvidence([
        snapshot.evidence[0],
        snapshot.evidence[0],
      ]),
    StoredClinicalReviewError,
  );
  assert.throws(
    () =>
      parseStoredClinicalEvidence([
        {
          ...snapshot.evidence[0],
          id: "LAB-999",
          source: "Untrusted source",
        },
      ]),
    StoredClinicalReviewError,
  );
});
