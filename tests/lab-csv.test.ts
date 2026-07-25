import assert from "node:assert/strict";
import test from "node:test";
import {
  createLabResultKey,
  LabCsvFileError,
  parseAndValidateLabCsv,
} from "@/lib/labs/csv";

const headers =
  "mrn,collected_date,test_code,test_name,value,unit,ref_low,ref_high";
const context = {
  knownMrns: new Set(["MRN-1001", "MRN-1002"]),
  today: new Date("2026-07-24T12:00:00.000Z"),
};

test("accepts valid rows and normalizes identifiers", () => {
  const report = parseAndValidateLabCsv(
    [
      headers,
      'mrn-1001,2026-06-01,glu-f,"Fasting Glucose",105,mg/dL,70,99',
      "MRN-1002,2026-06-02,HBA1C,Hemoglobin A1c,6.9,%,4.0,5.6",
    ].join("\r\n"),
    context,
  );

  assert.equal(report.totalRows, 2);
  assert.equal(report.accepted.length, 2);
  assert.equal(report.rejected.length, 0);
  assert.equal(report.accepted[0].mrn, "MRN-1001");
  assert.equal(report.accepted[0].testCode, "GLU-F");
  assert.equal(
    report.accepted[0].collectedDate.toISOString(),
    "2026-06-01T00:00:00.000Z",
  );
});

test("reports every required row-level validation category", () => {
  const report = parseAndValidateLabCsv(
    [
      headers,
      "MRN-9999,2026-02-30,UNKNOWN,Unknown Test,nope,,10,5",
      "MRN-1001,2026-07-25,GLU-F,Fasting Glucose,105,mg/dL,70,99",
      "MRN-1001,2026-06-01,GLU-F,Fasting Glucose,105,mg/dL,70,99",
      "MRN-1001,2026-06-01,GLU-F,Fasting Glucose,106,mg/dL,70,99",
    ].join("\n"),
    context,
  );

  assert.equal(report.accepted.length, 1);
  assert.equal(report.rejected.length, 3);
  assert.match(report.rejected[0].errors.join(" "), /Unknown MRN/);
  assert.match(report.rejected[0].errors.join(" "), /valid date/);
  assert.match(report.rejected[0].errors.join(" "), /Unknown test code/);
  assert.match(report.rejected[0].errors.join(" "), /value must be numeric/);
  assert.match(report.rejected[0].errors.join(" "), /Missing required fields/);
  assert.match(report.rejected[0].errors.join(" "), /ref_low cannot/);
  assert.match(report.rejected[1].errors.join(" "), /future/);
  assert.match(report.rejected[2].errors.join(" "), /Duplicate row/);
});

test("rejects rows that already exist so corrected re-uploads stay idempotent", () => {
  const existingResultKeys = new Set([
    createLabResultKey("MRN-1001", "2026-06-01", "GLU-F"),
  ]);
  const report = parseAndValidateLabCsv(
    [
      headers,
      "MRN-1001,2026-06-01,GLU-F,Fasting Glucose,105,mg/dL,70,99",
    ].join("\n"),
    { ...context, existingResultKeys },
  );

  assert.equal(report.accepted.length, 0);
  assert.match(report.rejected[0].errors.join(" "), /already stored/);
});

test("rejects numeric values that cannot fit the database decimal column", () => {
  const report = parseAndValidateLabCsv(
    [
      headers,
      "MRN-1001,2026-06-01,GLU-F,Fasting Glucose,100000000,mg/dL,70,99",
      "MRN-1002,2026-06-02,HBA1C,Hemoglobin A1c,6.12345,%,4.0,5.6",
    ].join("\n"),
    context,
  );

  assert.equal(report.accepted.length, 0);
  assert.equal(report.rejected.length, 2);
  assert.match(report.rejected[0].errors.join(" "), /8 whole-number digits/);
  assert.match(report.rejected[1].errors.join(" "), /4 decimal places/);
});

test("rejects empty files, wrong headers, and malformed CSV", () => {
  assert.throws(
    () => parseAndValidateLabCsv("", context),
    LabCsvFileError,
  );
  assert.throws(
    () => parseAndValidateLabCsv("mrn,date\nMRN-1001,2026-06-01", context),
    /required CSV headers/,
  );
  assert.throws(
    () =>
      parseAndValidateLabCsv(
        `${headers}\nMRN-1001,2026-06-01,GLU-F,"unclosed`,
        context,
      ),
    /not valid CSV/,
  );
});
