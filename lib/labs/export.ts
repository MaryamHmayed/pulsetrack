import { LAB_CSV_HEADERS } from "@/lib/labs/definition";

export type LabCsvExportRow = {
  mrn: string;
  collectedDate: string;
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  refLow: string;
  refHigh: string;
};

function protectSpreadsheetText(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function createLabCsvExport(rows: LabCsvExportRow[]) {
  const lines = [
    LAB_CSV_HEADERS.join(","),
    ...rows.map((row) =>
      [
        protectSpreadsheetText(row.mrn),
        row.collectedDate,
        protectSpreadsheetText(row.testCode),
        protectSpreadsheetText(row.testName),
        row.value,
        protectSpreadsheetText(row.unit),
        row.refLow,
        row.refHigh,
      ]
        .map(escapeCsvCell)
        .join(","),
    ),
  ];

  return `${lines.join("\r\n")}\r\n`;
}
