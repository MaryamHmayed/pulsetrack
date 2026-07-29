import { createHash } from "node:crypto";
import type {
  ClinicalEvidenceItem,
  ClinicalEvidenceSnapshot,
} from "@/lib/ai/clinical-evidence";

const MAX_STORED_EVIDENCE_ITEMS = 72;
const EVIDENCE_ID_PATTERN = /^(LAB|ASM)-\d{3}$/;
const RANGE_STATUSES = new Set(["LOW", "NORMAL", "HIGH", "UNKNOWN"]);
const RISK_BANDS = new Set(["LOW", "MODERATE", "HIGH", "VERY_HIGH"]);
const SOURCES = new Set(["Local CSV", "FHIR history"]);

export class StoredClinicalReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoredClinicalReviewError";
  }
}

function objectValue(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StoredClinicalReviewError(`${field} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function stringValue(value: unknown, field: string, maximum = 200) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > maximum
  ) {
    throw new StoredClinicalReviewError(`${field} must be bounded text.`);
  }

  return value;
}

function finiteNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new StoredClinicalReviewError(`${field} must be a finite number.`);
  }

  return value;
}

function nullableString(value: unknown, field: string) {
  return value === null ? null : stringValue(value, field);
}

function parseLabEvidence(
  item: Record<string, unknown>,
  field: string,
): ClinicalEvidenceItem {
  const rangeStatus = stringValue(item.rangeStatus, `${field}.rangeStatus`);
  const source = stringValue(item.source, `${field}.source`);

  if (!RANGE_STATUSES.has(rangeStatus)) {
    throw new StoredClinicalReviewError(`${field}.rangeStatus is invalid.`);
  }

  if (!SOURCES.has(source)) {
    throw new StoredClinicalReviewError(`${field}.source is invalid.`);
  }

  return {
    id: stringValue(item.id, `${field}.id`, 7),
    kind: "LAB",
    date: stringValue(item.date, `${field}.date`, 10),
    label: stringValue(item.label, `${field}.label`),
    value: stringValue(item.value, `${field}.value`),
    testCode: stringValue(item.testCode, `${field}.testCode`, 30),
    numericValue: finiteNumber(
      item.numericValue,
      `${field}.numericValue`,
    ),
    unit: stringValue(item.unit, `${field}.unit`, 40),
    rangeStatus: rangeStatus as "LOW" | "NORMAL" | "HIGH" | "UNKNOWN",
    referenceRange: nullableString(
      item.referenceRange,
      `${field}.referenceRange`,
    ),
    source: source as "Local CSV" | "FHIR history",
  };
}

function parseAssessmentEvidence(
  item: Record<string, unknown>,
  field: string,
): ClinicalEvidenceItem {
  const riskBand = stringValue(item.riskBand, `${field}.riskBand`);

  if (!RISK_BANDS.has(riskBand)) {
    throw new StoredClinicalReviewError(`${field}.riskBand is invalid.`);
  }

  return {
    id: stringValue(item.id, `${field}.id`, 7),
    kind: "ASSESSMENT",
    date: stringValue(item.date, `${field}.date`, 10),
    label: "DSMA-8",
    value: stringValue(item.value, `${field}.value`),
    score: finiteNumber(item.score, `${field}.score`),
    riskBand: riskBand as "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH",
  };
}

export function parseStoredClinicalEvidence(
  value: unknown,
): ClinicalEvidenceItem[] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_STORED_EVIDENCE_ITEMS
  ) {
    throw new StoredClinicalReviewError(
      "Stored evidence must contain between one and 72 items.",
    );
  }

  const ids = new Set<string>();

  return value.map((value, index) => {
    const field = `evidence[${index}]`;
    const item = objectValue(value, field);
    const kind = stringValue(item.kind, `${field}.kind`, 10);
    const id = stringValue(item.id, `${field}.id`, 7);

    if (!EVIDENCE_ID_PATTERN.test(id) || ids.has(id)) {
      throw new StoredClinicalReviewError(`${field}.id is invalid.`);
    }

    ids.add(id);

    if (kind === "LAB" && id.startsWith("LAB-")) {
      return parseLabEvidence(item, field);
    }

    if (kind === "ASSESSMENT" && id.startsWith("ASM-")) {
      return parseAssessmentEvidence(item, field);
    }

    throw new StoredClinicalReviewError(`${field}.kind is invalid.`);
  });
}

export function clinicalEvidenceFingerprint(
  snapshot: ClinicalEvidenceSnapshot,
) {
  const stableInput = {
    patientContext: snapshot.patientContext,
    evidence: snapshot.evidence,
    labTrends: snapshot.labTrends,
    assessmentTrend: snapshot.assessmentTrend,
    missingData: snapshot.missingData,
  };

  return createHash("sha256")
    .update(JSON.stringify(stableInput))
    .digest("hex");
}

export function clinicalEvidenceDataThrough(
  snapshot: ClinicalEvidenceSnapshot,
) {
  const latestDate = snapshot.evidence.reduce(
    (latest, item) => (item.date > latest ? item.date : latest),
    "",
  );

  if (!latestDate) {
    throw new StoredClinicalReviewError(
      "Clinical evidence has no data-through date.",
    );
  }

  return new Date(`${latestDate}T00:00:00.000Z`);
}
