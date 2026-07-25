import assert from "node:assert/strict";
import test from "node:test";
import {
  createLabUploadReport,
  readLabUploadReport,
} from "@/lib/labs/report";

test("creates a serializable row-level import report", () => {
  const report = createLabUploadReport({
    totalRows: 2,
    accepted: [
      {
        rowNumber: 2,
        mrn: "MRN-1001",
        collectedDate: new Date("2026-07-01T00:00:00.000Z"),
        collectedDateText: "2026-07-01",
        testCode: "GLU-F",
        testName: "Fasting Glucose",
        value: "101",
        unit: "mg/dL",
        refLow: "70",
        refHigh: "99",
        deduplicationKey: "MRN-1001|2026-07-01|GLU-F",
      },
    ],
    rejected: [
      {
        rowNumber: 3,
        values: {
          mrn: "MRN-9999",
          collected_date: "2026-07-01",
          test_code: "HBA1C",
          test_name: "Hemoglobin A1c",
          value: "6.2",
          unit: "%",
          ref_low: "4.0",
          ref_high: "5.6",
        },
        errors: ["Unknown MRN: MRN-9999."],
      },
    ],
  });

  assert.equal(report.acceptedCount, 1);
  assert.equal(report.rejectedCount, 1);
  assert.equal(report.rows[0].status, "ACCEPTED");
  assert.equal(report.rows[1].reasons[0], "Unknown MRN: MRN-9999.");
  assert.deepEqual(readLabUploadReport(JSON.parse(JSON.stringify(report))), report);
});

test("rejects malformed stored report data", () => {
  assert.equal(readLabUploadReport(null), null);
  assert.equal(
    readLabUploadReport({
      totalRows: 1,
      acceptedCount: 1,
      rejectedCount: 0,
      rows: [{ status: "ACCEPTED" }],
    }),
    null,
  );
});
