import type {
  RejectedLabCsvRow,
  ValidLabCsvRow,
} from "@/lib/labs/csv";

export type LabReportValues = {
  mrn: string;
  collectedDate: string;
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  refLow: string;
  refHigh: string;
};

export type LabUploadReportRow = {
  rowNumber: number;
  status: "ACCEPTED" | "REJECTED";
  values: LabReportValues;
  reasons: string[];
};

export type LabUploadReport = {
  totalRows: number;
  acceptedCount: number;
  rejectedCount: number;
  rows: LabUploadReportRow[];
};

export function createLabUploadReport(input: {
  totalRows: number;
  accepted: ValidLabCsvRow[];
  rejected: RejectedLabCsvRow[];
}): LabUploadReport {
  const rows: LabUploadReportRow[] = [
    ...input.accepted.map((row) => ({
      rowNumber: row.rowNumber,
      status: "ACCEPTED" as const,
      values: {
        mrn: row.mrn,
        collectedDate: row.collectedDateText,
        testCode: row.testCode,
        testName: row.testName,
        value: row.value,
        unit: row.unit,
        refLow: row.refLow,
        refHigh: row.refHigh,
      },
      reasons: [],
    })),
    ...input.rejected.map((row) => ({
      rowNumber: row.rowNumber,
      status: "REJECTED" as const,
      values: {
        mrn: row.values.mrn,
        collectedDate: row.values.collected_date,
        testCode: row.values.test_code,
        testName: row.values.test_name,
        value: row.values.value,
        unit: row.values.unit,
        refLow: row.values.ref_low,
        refHigh: row.values.ref_high,
      },
      reasons: row.errors,
    })),
  ].sort((first, second) => first.rowNumber - second.rowNumber);

  return {
    totalRows: input.totalRows,
    acceptedCount: input.accepted.length,
    rejectedCount: input.rejected.length,
    rows,
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function readLabUploadReport(value: unknown): LabUploadReport | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const report = value as Partial<LabUploadReport>;
  if (
    !Number.isInteger(report.totalRows) ||
    !Number.isInteger(report.acceptedCount) ||
    !Number.isInteger(report.rejectedCount) ||
    !Array.isArray(report.rows)
  ) {
    return null;
  }

  const validRows = report.rows.every((row) => {
    if (!row || typeof row !== "object") {
      return false;
    }

    const candidate = row as Partial<LabUploadReportRow>;
    const values = candidate.values as Partial<LabReportValues> | undefined;
    return (
      Number.isInteger(candidate.rowNumber) &&
      (candidate.status === "ACCEPTED" ||
        candidate.status === "REJECTED") &&
      Boolean(values) &&
      isString(values?.mrn) &&
      isString(values.collectedDate) &&
      isString(values.testCode) &&
      isString(values.testName) &&
      isString(values.value) &&
      isString(values.unit) &&
      isString(values.refLow) &&
      isString(values.refHigh) &&
      Array.isArray(candidate.reasons) &&
      candidate.reasons.every(isString)
    );
  });

  return validRows ? (report as LabUploadReport) : null;
}
