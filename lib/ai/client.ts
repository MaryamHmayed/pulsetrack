import "server-only";

import {
  generateClinicalReview,
  getGeminiConfiguration,
} from "@/lib/ai/gemini";
import type { ClinicalEvidenceSnapshot } from "@/lib/ai/clinical-evidence";

function configuredGemini() {
  return getGeminiConfiguration({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  });
}

export function getConfiguredGeminiModel() {
  return configuredGemini().model;
}

export function generateConfiguredClinicalReview(
  snapshot: ClinicalEvidenceSnapshot,
) {
  const configuration = configuredGemini();

  return generateClinicalReview(snapshot, configuration).then((review) => ({
    model: configuration.model,
    review,
  }));
}
