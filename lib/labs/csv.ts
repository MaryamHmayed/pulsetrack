import { parse } from "csv-parse/sync";
import {
  isKnownLabTestCode,
  LAB_CSV_HEADERS,
  type LabCsvHeader,
  type LabTestCode,
} from "@/lib/labs/definition";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

type RawLabRow = Record<LabCsvHeader, string>;

export type ValidLabCsvRow = {
  rowNumber: number;
  mrn: string;
  collectedDate: Date;
  collectedDateText: string;
  testCode: LabTestCode;
  testName: string;
  value: string;
  unit: string;
  refLow: string;
  refHigh: string;
  deduplicationKey: string;
};

export type RejectedLabCsvRow = {
  rowNumber: number;
  values: RawLabRow;
  errors: string[];
};

export type LabCsvValidationReport = {
  totalRows: number;
  accepted: ValidLabCsvRow[];
  rejected: RejectedLabCsvRow[];
};

export type LabCsvValidationContext = {
  knownMrns: ReadonlySet<string>;
  existingResultKeys?: ReadonlySet<string>;
  today?: Date;
};

export class LabCsvFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabCsvFileError";
  }
}

function dateAtUtcMidnight(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function parseDateOnly(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

function isDecimal(value: string) {
  return DECIMAL_PATTERN.test(value) && Number.isFinite(Number(value));
}

function fitsLabDecimalColumn(value: string) {
  if (!isDecimal(value)) {
    return false;
  }

  const unsigned = value.replace(/^[+-]/, "");
  const [wholePart = "", fractionalPart = ""] = unsigned.split(".");
  const significantWholeDigits = wholePart.replace(/^0+/, "").length;

  return significantWholeDigits <= 8 && fractionalPart.length <= 4;
}

export function createLabResultKey(
  mrn: string,
  collectedDate: string,
  testCode: string,
) {
  return `${mrn.trim().toUpperCase()}|${collectedDate}|${testCode.trim().toUpperCase()}`;
}

function toRawLabRow(record: string[]): RawLabRow {
  return Object.fromEntries(
    LAB_CSV_HEADERS.map((header, index) => [
      header,
      (record[index] ?? "").trim(),
    ]),
  ) as RawLabRow;
}

function assertValidHeaders(record: string[] | undefined) {
  if (!record) {
    throw new LabCsvFileError("The CSV file is empty.");
  }

  const normalized = record.map((header) => header.trim().toLowerCase());
  const valid =
    normalized.length === LAB_CSV_HEADERS.length &&
    LAB_CSV_HEADERS.every((header, index) => normalized[index] === header);

  if (!valid) {
    throw new LabCsvFileError(
      `Use the required CSV headers in this order: ${LAB_CSV_HEADERS.join(", ")}.`,
    );
  }
}

export function parseAndValidateLabCsv(
  content: string,
  context: LabCsvValidationContext,
): LabCsvValidationReport {
  let records: string[][];

  try {
    records = parse(content, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
  } catch {
    throw new LabCsvFileError(
      "The file is not valid CSV. Check its quotes, commas, and line endings.",
    );
  }

  assertValidHeaders(records[0]);

  const today = dateAtUtcMidnight(context.today ?? new Date());
  const knownMrns = new Set(
    [...context.knownMrns].map((mrn) => mrn.trim().toUpperCase()),
  );
  const existingKeys = new Set(context.existingResultKeys ?? []);
  const acceptedKeys = new Set<string>();
  const accepted: ValidLabCsvRow[] = [];
  const rejected: RejectedLabCsvRow[] = [];

  records.slice(1).forEach((record, index) => {
    const rowNumber = index + 2;
    const values = toRawLabRow(record);
    const errors: string[] = [];

    if (record.length !== LAB_CSV_HEADERS.length) {
      errors.push(
        `Expected ${LAB_CSV_HEADERS.length} columns but found ${record.length}.`,
      );
    }

    const missingFields = LAB_CSV_HEADERS.filter(
      (header) => values[header] === "",
    );
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(", ")}.`);
    }

    const mrn = values.mrn.toUpperCase();
    const testCode = values.test_code.toUpperCase();
    const collectedDate = parseDateOnly(values.collected_date);

    if (values.mrn && !knownMrns.has(mrn)) {
      errors.push(`Unknown MRN: ${values.mrn}.`);
    }

    if (!collectedDate && values.collected_date) {
      errors.push("Collected date must be a valid date in YYYY-MM-DD format.");
    } else if (collectedDate && collectedDate > today) {
      errors.push("Collected date cannot be in the future.");
    }

    if (values.test_code && !isKnownLabTestCode(testCode)) {
      errors.push(`Unknown test code: ${values.test_code}.`);
    }

    const numericFields = [
      ["value", values.value],
      ["ref_low", values.ref_low],
      ["ref_high", values.ref_high],
    ] as const;
    for (const [field, value] of numericFields) {
      if (value && !isDecimal(value)) {
        errors.push(`${field} must be numeric.`);
      } else if (value && !fitsLabDecimalColumn(value)) {
        errors.push(
          `${field} must use at most 8 whole-number digits and 4 decimal places.`,
        );
      }
    }

    if (
      isDecimal(values.ref_low) &&
      isDecimal(values.ref_high) &&
      Number(values.ref_low) > Number(values.ref_high)
    ) {
      errors.push("ref_low cannot be greater than ref_high.");
    }

    const key = createLabResultKey(
      mrn,
      values.collected_date,
      testCode,
    );
    if (existingKeys.has(key)) {
      errors.push("Duplicate of a lab result already stored.");
    } else if (acceptedKeys.has(key)) {
      errors.push("Duplicate row in this file.");
    }

    if (
      errors.length > 0 ||
      !collectedDate ||
      !isKnownLabTestCode(testCode)
    ) {
      rejected.push({ rowNumber, values, errors });
      return;
    }

    acceptedKeys.add(key);
    accepted.push({
      rowNumber,
      mrn,
      collectedDate,
      collectedDateText: values.collected_date,
      testCode,
      testName: values.test_name,
      value: values.value,
      unit: values.unit,
      refLow: values.ref_low,
      refHigh: values.ref_high,
      deduplicationKey: key,
    });
  });

  return {
    totalRows: records.length - 1,
    accepted,
    rejected,
  };
}
