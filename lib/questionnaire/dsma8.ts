import definition from "@/data/questionnaire-dsma8.json";

export const dsma8 = definition;

export type Dsma8RiskBand = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export type Dsma8Response = {
  itemId: string;
  value: number;
};

export type Dsma8Score = {
  responses: Dsma8Response[];
  score: number;
  riskBand: Dsma8RiskBand;
  label: string;
  color: string;
  guidance: string;
};

export type Dsma8ValidationResult =
  | { success: true; data: Dsma8Score }
  | {
      success: false;
      message: string;
      missingItemIds: string[];
      invalidItemIds: string[];
    };

const riskBandByLabel: Record<string, Dsma8RiskBand> = {
  "Low risk": "LOW",
  "Moderate risk": "MODERATE",
  "High risk": "HIGH",
  "Very high risk": "VERY_HIGH",
};

const allowedValues = new Set(dsma8.options.map((option) => option.value));

export function readDsma8FormData(formData: FormData) {
  return Object.fromEntries(
    dsma8.items.map((item) => [item.id, formData.get(item.id)]),
  );
}

export function scoreDsma8(
  submittedResponses: Record<string, unknown>,
): Dsma8ValidationResult {
  const missingItemIds: string[] = [];
  const invalidItemIds: string[] = [];
  const responses: Dsma8Response[] = [];

  for (const item of dsma8.items) {
    const submitted = submittedResponses[item.id];

    if (submitted === null || submitted === undefined || submitted === "") {
      missingItemIds.push(item.id);
      continue;
    }

    const value =
      typeof submitted === "number"
        ? submitted
        : typeof submitted === "string" && submitted.trim() !== ""
          ? Number(submitted)
          : Number.NaN;

    if (!Number.isInteger(value) || !allowedValues.has(value)) {
      invalidItemIds.push(item.id);
      continue;
    }

    responses.push({ itemId: item.id, value });
  }

  if (missingItemIds.length > 0 || invalidItemIds.length > 0) {
    return {
      success: false,
      message: "Answer all eight questions using one of the provided options.",
      missingItemIds,
      invalidItemIds,
    };
  }

  const score = responses.reduce((total, response) => total + response.value, 0);
  const band = dsma8.scoring.bands.find(
    (candidate) => score >= candidate.min && score <= candidate.max,
  );
  const riskBand = band ? riskBandByLabel[band.label] : undefined;

  if (!band || !riskBand) {
    throw new Error("DSMA-8 scoring configuration does not cover this score.");
  }

  return {
    success: true,
    data: {
      responses,
      score,
      riskBand,
      label: band.label,
      color: band.color,
      guidance: band.guidance,
    },
  };
}
