import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCompletionRate,
  countLatestPatientRiskBands,
} from "@/lib/dashboard/metrics";

test("calculates a rounded assessment completion percentage", () => {
  assert.equal(calculateCompletionRate(2, 3), 67);
  assert.equal(calculateCompletionRate(0, 0), 0);
});

test("counts only each patient's latest available risk band", () => {
  assert.deepEqual(
    countLatestPatientRiskBands([
      "LOW",
      "LOW",
      "MODERATE",
      "HIGH",
      "VERY_HIGH",
      null,
    ]),
    {
      LOW: 2,
      MODERATE: 1,
      HIGH: 1,
      VERY_HIGH: 1,
    },
  );
});
