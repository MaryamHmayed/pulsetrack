import assert from "node:assert/strict";
import test from "node:test";
import type { ClinicalEvidenceSnapshot } from "@/lib/ai/clinical-evidence";
import {
  ClinicalReviewError,
  generateClinicalReview,
  getGeminiConfiguration,
  parseClinicalReview,
} from "@/lib/ai/gemini";

const snapshot: ClinicalEvidenceSnapshot = {
  asOf: "2026-07-28",
  patientContext: { ageYears: 52, gender: "female" },
  evidence: [
    {
      id: "LAB-001",
      kind: "LAB",
      date: "2026-01-10",
      label: "Hemoglobin A1c",
      value: "7.1 %",
      testCode: "HBA1C",
      numericValue: 7.1,
      unit: "%",
      rangeStatus: "HIGH",
      referenceRange: "4–5.6 %",
      source: "FHIR history",
    },
    {
      id: "LAB-002",
      kind: "LAB",
      date: "2026-06-10",
      label: "Hemoglobin A1c",
      value: "6.4 %",
      testCode: "HBA1C",
      numericValue: 6.4,
      unit: "%",
      rangeStatus: "HIGH",
      referenceRange: "4–5.6 %",
      source: "Local CSV",
    },
  ],
  labTrends: [
    {
      key: "HBA1C",
      label: "Hemoglobin A1c",
      resultCount: 2,
      firstEvidenceId: "LAB-001",
      latestEvidenceId: "LAB-002",
      firstValue: 7.1,
      latestValue: 6.4,
      unit: "%",
      direction: "DECREASED",
      absoluteChange: -0.7,
    },
  ],
  assessmentTrend: null,
  missingData: [
    "No fasting glucose results are available.",
    "No completed DSMA-8 assessments are available.",
  ],
  limits: {
    labResultsIncluded: 2,
    assessmentsIncluded: 0,
    labResultsMaximum: 60,
    assessmentsMaximum: 12,
  },
};

const validReview = {
  summary: {
    text: "HbA1c decreased between the two recorded results.",
    evidenceIds: ["LAB-001", "LAB-002"],
  },
  combinedPerspective: [],
  attentionAreas: [
    {
      title: "Latest HbA1c",
      text: "The latest HbA1c remains above its supplied reference range.",
      evidenceIds: ["LAB-002"],
    },
  ],
  followUpQuestions: [
    {
      text: "What factors may have accompanied the change between these results?",
      evidenceIds: ["LAB-001", "LAB-002"],
    },
  ],
};

test("validates Gemini configuration without exposing the key", () => {
  assert.deepEqual(
    getGeminiConfiguration({
      apiKey: "  secret-key  ",
      model: "gemini-3.1-flash-lite",
    }),
    {
      apiKey: "secret-key",
      model: "gemini-3.1-flash-lite",
    },
  );

  assert.throws(
    () => getGeminiConfiguration({}),
    (error: unknown) =>
      error instanceof ClinicalReviewError &&
      error.code === "CONFIGURATION" &&
      !error.publicMessage.includes("GEMINI_API_KEY"),
  );
});

test("accepts only reviews whose citations exist in the snapshot", () => {
  assert.deepEqual(
    parseClinicalReview(validReview, ["LAB-001", "LAB-002"]),
    validReview,
  );

  assert.throws(
    () =>
      parseClinicalReview(
        {
          ...validReview,
          summary: {
            text: "Unsupported statement.",
            evidenceIds: ["LAB-999"],
          },
        },
        ["LAB-001", "LAB-002"],
      ),
    (error: unknown) =>
      error instanceof ClinicalReviewError &&
      error.code === "INVALID_RESPONSE",
  );

  assert.throws(
    () =>
      parseClinicalReview(
        {
          ...validReview,
          unsupportedClinicalClaim: "This field must not be ignored.",
        },
        ["LAB-001", "LAB-002"],
      ),
    (error: unknown) =>
      error instanceof ClinicalReviewError &&
      error.code === "INVALID_RESPONSE",
  );
});

test("requires a non-causal cross-domain item to cite lab and assessment evidence", () => {
  const crossDomainReview = {
    ...validReview,
    combinedPerspective: [
      {
        relationship: "DIVERGENT",
        headline: "Improving lab value with ongoing self-management risk",
        text: "The recorded HbA1c decreased while the latest DSMA-8 remained in a moderate-risk band.",
        clinicalRelevance:
          "The differing signals make it useful to clarify which barriers remain despite the objective improvement.",
        evidenceIds: ["LAB-002", "ASM-001"],
      },
    ],
  };

  assert.deepEqual(
    parseClinicalReview(
      crossDomainReview,
      ["LAB-001", "LAB-002", "ASM-001"],
      { requireCombinedPerspectiveField: true },
    ),
    crossDomainReview,
  );

  assert.throws(
    () =>
      parseClinicalReview(
        {
          ...crossDomainReview,
          combinedPerspective: [
            {
              relationship: "ALIGNED",
              headline: "Unsupported relationship",
              text: "This does not cite both domains.",
              clinicalRelevance: "This should be rejected.",
              evidenceIds: ["LAB-002"],
            },
          ],
        },
        ["LAB-001", "LAB-002", "ASM-001"],
        { requireCombinedPerspectiveField: true },
      ),
    (error: unknown) =>
      error instanceof ClinicalReviewError &&
      error.code === "INVALID_RESPONSE",
  );

  assert.throws(
    () =>
      parseClinicalReview(
        {
          ...validReview,
          combinedPerspective: [
            {
              relationship: "COMPLEMENTARY",
              headline: "Invented assessment context",
              text: "An assessment must not be invented.",
              clinicalRelevance: "This should be rejected.",
              evidenceIds: ["LAB-002"],
            },
          ],
        },
        ["LAB-001", "LAB-002"],
        { requireCombinedPerspectiveField: true },
      ),
    (error: unknown) =>
      error instanceof ClinicalReviewError &&
      error.code === "INVALID_RESPONSE",
  );
});

test("sends only the anonymous snapshot and parses structured output", async () => {
  let requestUrl = "";
  let requestBody = "";
  let requestApiKey = "";

  const review = await generateClinicalReview(
    snapshot,
    { apiKey: "secret-key", model: "gemini-3.1-flash-lite" },
    {
      fetchImplementation: async (input, init) => {
        requestUrl = String(input);
        requestBody = String(init?.body);
        requestApiKey = new Headers(init?.headers).get("x-goog-api-key") ?? "";

        return new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: "STOP",
                content: {
                  parts: [{ text: JSON.stringify(validReview) }],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  );

  assert.deepEqual(review, validReview);
  assert.match(requestUrl, /gemini-3\.1-flash-lite:generateContent$/);
  assert.equal(requestApiKey, "secret-key");
  assert.match(requestBody, /LAB-001/);
  assert.doesNotMatch(requestBody, /secret-key/);
  assert.doesNotMatch(requestBody, /patient@example\.com|MRN-/);

  const body = JSON.parse(requestBody) as {
    generationConfig: {
      responseMimeType: string;
      responseSchema: {
        properties: {
          summary: {
            properties: {
              evidenceIds: { items: { enum: string[] } };
            };
          };
        };
      };
    };
  };
  assert.equal(
    body.generationConfig.responseMimeType,
    "application/json",
  );
  assert.deepEqual(
    body.generationConfig.responseSchema.properties.summary.properties
      .evidenceIds.items.enum,
    ["LAB-001", "LAB-002"],
  );
});

test("surfaces rate limits and safety blocks with bounded messages", async () => {
  await assert.rejects(
    generateClinicalReview(
      snapshot,
      { apiKey: "secret-key", model: "gemini-3.1-flash-lite" },
      {
        fetchImplementation: async () =>
          new Response("provider diagnostics should stay private", {
            status: 429,
          }),
      },
    ),
    (error: unknown) =>
      error instanceof ClinicalReviewError &&
      error.code === "RATE_LIMIT" &&
      !error.publicMessage.includes("provider diagnostics"),
  );

  await assert.rejects(
    generateClinicalReview(
      snapshot,
      { apiKey: "secret-key", model: "gemini-3.1-flash-lite" },
      {
        fetchImplementation: async () =>
          new Response(
            JSON.stringify({
              promptFeedback: { blockReason: "SAFETY" },
            }),
            { status: 200 },
          ),
      },
    ),
    (error: unknown) =>
      error instanceof ClinicalReviewError && error.code === "SAFETY",
  );
});
