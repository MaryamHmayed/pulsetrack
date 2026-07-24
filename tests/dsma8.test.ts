import assert from "node:assert/strict";
import test from "node:test";
import { dsma8, scoreDsma8 } from "@/lib/questionnaire/dsma8";

function responses(values: number[]) {
  return Object.fromEntries(
    dsma8.items.map((item, index) => [item.id, values[index]]),
  );
}

test("uses the exact eight-item DSMA-8 definition", () => {
  assert.equal(dsma8.id, "dsma-8");
  assert.equal(dsma8.version, "1.0");
  assert.equal(dsma8.items.length, 8);
  assert.deepEqual(
    dsma8.options.map((option) => option.value),
    [0, 1, 2, 3],
  );
});

test("computes the total and low-risk band", () => {
  const result = scoreDsma8(responses([0, 1, 0, 1, 0, 1, 0, 1]));

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.score, 4);
    assert.equal(result.data.riskBand, "LOW");
    assert.equal(result.data.responses.length, 8);
  }
});

test("maps every scoring boundary to the required risk band", () => {
  const cases = [
    { values: [3, 3, 0, 0, 0, 0, 0, 0], score: 6, band: "LOW" },
    { values: [3, 3, 1, 0, 0, 0, 0, 0], score: 7, band: "MODERATE" },
    { values: [3, 3, 3, 3, 0, 0, 0, 0], score: 12, band: "MODERATE" },
    { values: [3, 3, 3, 3, 1, 0, 0, 0], score: 13, band: "HIGH" },
    { values: [3, 3, 3, 3, 3, 3, 0, 0], score: 18, band: "HIGH" },
    { values: [3, 3, 3, 3, 3, 3, 1, 0], score: 19, band: "VERY_HIGH" },
    { values: [3, 3, 3, 3, 3, 3, 3, 3], score: 24, band: "VERY_HIGH" },
  ] as const;

  for (const testCase of cases) {
    const result = scoreDsma8(responses([...testCase.values]));
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.score, testCase.score);
      assert.equal(result.data.riskBand, testCase.band);
    }
  }
});

test("rejects incomplete responses", () => {
  const result = scoreDsma8({
    q1: 0,
    q2: 1,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(result.missingItemIds, [
      "q3",
      "q4",
      "q5",
      "q6",
      "q7",
      "q8",
    ]);
  }
});

test("rejects values outside the provided answer options", () => {
  const result = scoreDsma8(
    responses([0, 1, 2, 3, 4, -1, 1.5, Number.NaN]),
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(result.invalidItemIds, ["q5", "q6", "q7", "q8"]);
  }
});
