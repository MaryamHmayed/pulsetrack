import "dotenv/config";

import { buildClinicalEvidenceSnapshot } from "../lib/ai/clinical-evidence";
import {
  ClinicalReviewError,
  generateClinicalReview,
  getGeminiConfiguration,
} from "../lib/ai/gemini";

async function main() {
  const configuration = getGeminiConfiguration({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  });
  const snapshot = buildClinicalEvidenceSnapshot({
    asOf: new Date("2026-07-28T00:00:00.000Z"),
    dob: new Date("1980-01-01T00:00:00.000Z"),
    sex: "FEMALE",
    labResults: [
      {
        collectedDate: new Date("2026-01-10T00:00:00.000Z"),
        testCode: "HBA1C",
        testName: "Hemoglobin A1c",
        value: 7.1,
        unit: "%",
        refLow: 4,
        refHigh: 5.6,
        source: "FHIR",
      },
      {
        collectedDate: new Date("2026-06-10T00:00:00.000Z"),
        testCode: "HBA1C",
        testName: "Hemoglobin A1c",
        value: 6.4,
        unit: "%",
        refLow: 4,
        refHigh: 5.6,
        source: "LOCAL",
      },
    ],
    assessments: [],
  });
  const review = await generateClinicalReview(snapshot, configuration);
  const citedIds = new Set([
    ...review.summary.evidenceIds,
    ...review.attentionAreas.flatMap((item) => item.evidenceIds),
    ...review.followUpQuestions.flatMap((item) => item.evidenceIds),
  ]);

  console.log(`Gemini connection successful (${configuration.model}).`);
  console.log(
    `Validated ${1 + review.attentionAreas.length + review.followUpQuestions.length} cited review item(s) using ${citedIds.size} fabricated evidence reference(s).`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof ClinicalReviewError
    ? `${error.publicMessage} [${error.code}: ${error.message}]`
    : "Gemini connection check failed.";

  console.error(message);
  process.exitCode = 1;
});
