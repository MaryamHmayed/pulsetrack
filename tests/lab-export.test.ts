import assert from "node:assert/strict";
import test from "node:test";
import { createLabCsvExport } from "@/lib/labs/export";

test("exports accepted patient rows in the required template format", () => {
  const csv = createLabCsvExport([
    {
      mrn: "MRN-1001",
      collectedDate: "2026-07-01",
      testCode: "GLU-F",
      testName: "Fasting Glucose",
      value: "101",
      unit: "mg/dL",
      refLow: "70",
      refHigh: "99",
    },
  ]);

  assert.equal(
    csv,
    [
      "mrn,collected_date,test_code,test_name,value,unit,ref_low,ref_high",
      "MRN-1001,2026-07-01,GLU-F,Fasting Glucose,101,mg/dL,70,99",
      "",
    ].join("\r\n"),
  );
});

test("quotes CSV text and neutralizes spreadsheet formulas", () => {
  const csv = createLabCsvExport([
    {
      mrn: "MRN-1001",
      collectedDate: "2026-07-01",
      testCode: "GLU-F",
      testName: '=HYPERLINK("https://malicious.invalid","click")',
      value: "101",
      unit: "mg/dL, fasting",
      refLow: "70",
      refHigh: "99",
    },
  ]);

  assert.match(
    csv,
    /"'=HYPERLINK\(""https:\/\/malicious\.invalid"",""click""\)"/,
  );
  assert.match(csv, /"mg\/dL, fasting"/);
});
