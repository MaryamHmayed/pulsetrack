 import { classifyLabRange, type LabRangeStatus } from "@/lib/labs/range";

export const MAX_AI_LAB_RESULTS = 60;
export const MAX_AI_ASSESSMENTS = 12;

type ClinicalSex = "FEMALE" | "MALE" | "OTHER" | "UNKNOWN";
type ClinicalSource = "LOCAL" | "FHIR";
type AssessmentRiskBand = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export type ClinicalEvidenceLabResult = {
  collectedDate: Date;
  testCode: string;
  testName: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  source: ClinicalSource;
};

export type ClinicalEvidenceAssessment = {
  completedAt: Date;
  score: number;
  riskBand: AssessmentRiskBand;
};

export type ClinicalEvidenceItem =
  | {
      id: string;
      kind: "LAB";
      date: string;
      label: string;
      value: string;
      testCode: string;
      numericValue: number;
      unit: string;
      rangeStatus: LabRangeStatus;
      referenceRange: string | null;
      source: "Local CSV" | "FHIR history";
    }
  | {
      id: string;
      kind: "ASSESSMENT";
      date: string;
      label: "DSMA-8";
      value: string;
      score: number;
      riskBand: AssessmentRiskBand;
    };

export type ClinicalTrend = {
  key: string;
  label: string;
  resultCount: number;
  firstEvidenceId: string;
  latestEvidenceId: string;
  firstValue: number;
  latestValue: number;
  unit: string;
  direction: "INCREASED" | "DECREASED" | "UNCHANGED";
  absoluteChange: number;
};

export type ClinicalEvidenceSnapshot = {
  asOf: string;
  patientContext: {
    ageYears: number;
    gender: "female" | "male" | "other" | "unknown";
  };
  evidence: ClinicalEvidenceItem[];
  labTrends: ClinicalTrend[];
  assessmentTrend: ClinicalTrend | null;
  missingData: string[];
  limits: {
    labResultsIncluded: number;
    assessmentsIncluded: number;
    labResultsMaximum: number;
    assessmentsMaximum: number;
  };
};

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateAge(dob: Date, asOf: Date) {
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear();
  const monthDifference = asOf.getUTCMonth() - dob.getUTCMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && asOf.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }

  return Math.max(0, age);
}

function trendDirection(firstValue: number, latestValue: number) {
  if (latestValue > firstValue) {
    return "INCREASED" as const;
  }

  if (latestValue < firstValue) {
    return "DECREASED" as const;
  }

  return "UNCHANGED" as const;
}

function clinicalDifference(firstValue: number, latestValue: number) {
  return Number((latestValue - firstValue).toFixed(4));
}

function referenceRange(
  refLow: number | null,
  refHigh: number | null,
  unit: string,
) {
  return refLow === null || refHigh === null
    ? null
    : `${refLow}–${refHigh} ${unit}`;
}

function selectMostRecent<T>(
  values: T[],
  date: (value: T) => Date,
  maximum: number,
) {
  return [...values]
    .sort((left, right) => date(right).getTime() - date(left).getTime())
    .slice(0, maximum)
    .sort((left, right) => date(left).getTime() - date(right).getTime());
}

export function buildClinicalEvidenceSnapshot(input: {
  asOf?: Date;
  dob: Date;
  sex: ClinicalSex;
  labResults: ClinicalEvidenceLabResult[];
  assessments: ClinicalEvidenceAssessment[];
}): ClinicalEvidenceSnapshot {
  const asOf = input.asOf ?? new Date();
  const labs = selectMostRecent(
    input.labResults,
    (result) => result.collectedDate,
    MAX_AI_LAB_RESULTS,
  );
  const assessments = selectMostRecent(
    input.assessments,
    (assessment) => assessment.completedAt,
    MAX_AI_ASSESSMENTS,
  );

  const labEvidence = labs.map(
    (result, index): ClinicalEvidenceItem & { kind: "LAB" } => {
      const rangeStatus = classifyLabRange(
        result.value,
        result.refLow,
        result.refHigh,
      );

      return {
        id: `LAB-${String(index + 1).padStart(3, "0")}`,
        kind: "LAB",
        date: dateOnly(result.collectedDate),
        label: result.testName,
        value: `${result.value} ${result.unit}`,
        testCode: result.testCode,
        numericValue: result.value,
        unit: result.unit,
        rangeStatus,
        referenceRange: referenceRange(
          result.refLow,
          result.refHigh,
          result.unit,
        ),
        source: result.source === "FHIR" ? "FHIR history" : "Local CSV",
      };
    },
  );

  const assessmentEvidence = assessments.map(
    (assessment, index): ClinicalEvidenceItem & { kind: "ASSESSMENT" } => ({
      id: `ASM-${String(index + 1).padStart(3, "0")}`,
      kind: "ASSESSMENT",
      date: dateOnly(assessment.completedAt),
      label: "DSMA-8",
      value: `${assessment.score}/24 (${assessment.riskBand.toLowerCase().replace("_", " ")} risk)`,
      score: assessment.score,
      riskBand: assessment.riskBand,
    }),
  );

  const labSeries = new Map<string, typeof labEvidence>();

  for (const item of labEvidence) {
    const series = labSeries.get(item.testCode) ?? [];
    series.push(item);
    labSeries.set(item.testCode, series);
  }

  const labTrends = [...labSeries.entries()]
    .map(([testCode, series]): ClinicalTrend => {
      const first = series[0];
      const latest = series[series.length - 1];

      return {
        key: testCode,
        label: latest.label,
        resultCount: series.length,
        firstEvidenceId: first.id,
        latestEvidenceId: latest.id,
        firstValue: first.numericValue,
        latestValue: latest.numericValue,
        unit: latest.unit,
        direction: trendDirection(first.numericValue, latest.numericValue),
        absoluteChange: clinicalDifference(
          first.numericValue,
          latest.numericValue,
        ),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const firstAssessment = assessmentEvidence[0];
  const latestAssessment =
    assessmentEvidence[assessmentEvidence.length - 1];
  const assessmentTrend =
    firstAssessment && latestAssessment
      ? {
          key: "DSMA-8",
          label: "DSMA-8 score",
          resultCount: assessmentEvidence.length,
          firstEvidenceId: firstAssessment.id,
          latestEvidenceId: latestAssessment.id,
          firstValue: firstAssessment.score,
          latestValue: latestAssessment.score,
          unit: "out of 24",
          direction: trendDirection(
            firstAssessment.score,
            latestAssessment.score,
          ),
          absoluteChange: clinicalDifference(
            firstAssessment.score,
            latestAssessment.score,
          ),
        }
      : null;

  const testCodes = new Set(labEvidence.map((item) => item.testCode));
  const missingData = [
    !testCodes.has("GLU-F") ? "No fasting glucose results are available." : null,
    !testCodes.has("HBA1C") ? "No HbA1c results are available." : null,
    assessmentEvidence.length === 0
      ? "No completed DSMA-8 assessments are available."
      : null,
  ].filter((message): message is string => message !== null);

  return {
    asOf: dateOnly(asOf),
    patientContext: {
      ageYears: calculateAge(input.dob, asOf),
      gender: input.sex.toLowerCase() as
        | "female"
        | "male"
        | "other"
        | "unknown",
    },
    evidence: [...labEvidence, ...assessmentEvidence],
    labTrends,
    assessmentTrend,
    missingData,
    limits: {
      labResultsIncluded: labEvidence.length,
      assessmentsIncluded: assessmentEvidence.length,
      labResultsMaximum: MAX_AI_LAB_RESULTS,
      assessmentsMaximum: MAX_AI_ASSESSMENTS,
    },
  };
}
