export const LAB_CSV_HEADERS = [
  "mrn",
  "collected_date",
  "test_code",
  "test_name",
  "value",
  "unit",
  "ref_low",
  "ref_high",
] as const;

export type LabCsvHeader = (typeof LAB_CSV_HEADERS)[number];

export const LAB_TESTS = {
  "GLU-F": {
    name: "Fasting Glucose",
  },
  HBA1C: {
    name: "Hemoglobin A1c",
  },
  SBP: {
    name: "Systolic Blood Pressure",
  },
} as const;

export type LabTestCode = keyof typeof LAB_TESTS;

export function isKnownLabTestCode(value: string): value is LabTestCode {
  return Object.hasOwn(LAB_TESTS, value);
}
