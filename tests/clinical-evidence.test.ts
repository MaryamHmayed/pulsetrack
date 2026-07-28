import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_AI_LAB_RESULTS,
  buildClinicalEvidenceSnapshot,
} from "@/lib/ai/clinical-evidence";

test("builds de-identified evidence and deterministic trends", () => {
  const snapshot = buildClinicalEvidenceSnapshot({
    asOf: new Date("2026-07-28T12:00:00.000Z"),
    dob: new Date("1980-08-10T00:00:00.000Z"),
    sex: "FEMALE",
    labResults: [
      {
        collectedDate: new Date("2026-01-10T00:00:00.000Z"),
        testCode: "HBA1C",
        testName: "Hemoglobin A1c",
        value: 7.1,
        unit: "%",
        refLow: 4,
        refHigh: 5.6,
        source: "FHIR",
      },
      {
        collectedDate: new Date("2026-06-10T00:00:00.000Z"),
        testCode: "HBA1C",
        testName: "Hemoglobin A1c",
        value: 6.4,
        unit: "%",
        refLow: 4,
        refHigh: 5.6,
        source: "LOCAL",
      },
    ],
    assessments: [
      {
        completedAt: new Date("2026-05-01T00:00:00.000Z"),
        score: 14,
        riskBand: "HIGH",
      },
      {
        completedAt: new Date("2026-07-01T00:00:00.000Z"),
        score: 9,
        riskBand: "MODERATE",
      },
    ],
  });

  assert.deepEqual(snapshot.patientContext, {
    ageYears: 45,
    gender: "female",
  });
  assert.deepEqual(
    snapshot.evidence.map((item) => item.id),
    ["LAB-001", "LAB-002", "ASM-001", "ASM-002"],
  );
  assert.deepEqual(snapshot.labTrends[0], {
    key: "HBA1C",
    label: "Hemoglobin A1c",
    resultCount: 2,
    firstEvidenceId: "LAB-001",
    latestEvidenceId: "LAB-002",
    firstValue: 7.1,
    latestValue: 6.4,
    unit: "%",
    direction: "DECREASED",
    absoluteChange: -0.7,
  });
  assert.equal(snapshot.evidence[0].kind, "LAB");
  assert.equal(
    snapshot.evidence[0].kind === "LAB"
      ? snapshot.evidence[0].rangeStatus
      : null,
    "HIGH",
  );
  assert.deepEqual(snapshot.assessmentTrend, {
    key: "DSMA-8",
    label: "DSMA-8 score",
    resultCount: 2,
    firstEvidenceId: "ASM-001",
    latestEvidenceId: "ASM-002",
    firstValue: 14,
    latestValue: 9,
    unit: "out of 24",
    direction: "DECREASED",
    absoluteChange: -5,
  });
  assert.deepEqual(snapshot.missingData, [
    "No fasting glucose results are available.",
  ]);
});

test("reports missing clinical inputs without inventing evidence", () => {
  const snapshot = buildClinicalEvidenceSnapshot({
    asOf: new Date("2026-07-28T00:00:00.000Z"),
    dob: new Date("1990-01-01T00:00:00.000Z"),
    sex: "MALE",
    labResults: [],
    assessments: [],
  });

  assert.deepEqual(snapshot.evidence, []);
  assert.deepEqual(snapshot.labTrends, []);
  assert.equal(snapshot.assessmentTrend, null);
  assert.deepEqual(snapshot.missingData, [
    "No fasting glucose results are available.",
    "No HbA1c results are available.",
    "No completed DSMA-8 assessments are available.",
  ]);
});

test("bounds the evidence sent to the model", () => {
  const labResults = Array.from(
    { length: MAX_AI_LAB_RESULTS + 5 },
    (_, index) => ({
      collectedDate: new Date(
        Date.UTC(2020 + Math.floor(index / 12), index % 12, 1),
      ),
      testCode: "GLU-F",
      testName: "Fasting Glucose",
      value: 90 + index,
      unit: "mg/dL",
      refLow: 70,
      refHigh: 99,
      source: "LOCAL" as const,
    }),
  );

  const snapshot = buildClinicalEvidenceSnapshot({
    asOf: new Date("2026-07-28T00:00:00.000Z"),
    dob: new Date("1985-01-01T00:00:00.000Z"),
    sex: "FEMALE",
    labResults,
    assessments: [],
  });

  assert.equal(snapshot.limits.labResultsIncluded, MAX_AI_LAB_RESULTS);
  assert.equal(
    snapshot.evidence.filter((item) => item.kind === "LAB").length,
    MAX_AI_LAB_RESULTS,
  );
  assert.equal(snapshot.evidence[0].id, "LAB-001");
  assert.equal(snapshot.evidence[0].date, "2020-06-01");
});
