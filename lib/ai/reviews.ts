import "server-only";

import {
  MAX_AI_ASSESSMENTS,
  MAX_AI_LAB_RESULTS,
  buildClinicalEvidenceSnapshot,
} from "@/lib/ai/clinical-evidence";
import {
  generateConfiguredClinicalReview,
  getConfiguredGeminiModel,
} from "@/lib/ai/client";
import {
  ClinicalReviewError,
  parseClinicalReview,
} from "@/lib/ai/gemini";
import {
  clinicalEvidenceDataThrough,
  clinicalEvidenceFingerprint,
  parseStoredClinicalEvidence,
} from "@/lib/ai/review-values";
import { requireClinician } from "@/lib/auth/session";
import { db } from "@/lib/db";

const REVIEW_RATE_LIMIT = 5;
const REVIEW_RATE_WINDOW_MS = 60 * 60 * 1000;

function validPatientId(patientId: string) {
  const normalized = patientId.trim();
  return normalized.length >= 1 && normalized.length <= 128
    ? normalized
    : null;
}

async function getPatientEvidenceContext(
  clinicianId: string,
  patientId: string,
) {
  const patient = await db.patient.findFirst({
    where: {
      id: patientId,
      clinicianId,
    },
    select: {
      dob: true,
      sex: true,
      labResults: {
        orderBy: [{ collectedDate: "desc" }, { testCode: "asc" }],
        take: MAX_AI_LAB_RESULTS,
        select: {
          collectedDate: true,
          testCode: true,
          testName: true,
          value: true,
          unit: true,
          refLow: true,
          refHigh: true,
          source: true,
        },
      },
      assessments: {
        where: {
          status: "COMPLETED",
          completedAt: { not: null },
          score: { not: null },
          riskBand: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: MAX_AI_ASSESSMENTS,
        select: {
          completedAt: true,
          score: true,
          riskBand: true,
        },
      },
    },
  });

  if (!patient) {
    return null;
  }

  return buildClinicalEvidenceSnapshot({
    dob: patient.dob,
    sex: patient.sex,
    labResults: patient.labResults.map((result) => ({
      collectedDate: result.collectedDate,
      testCode: result.testCode,
      testName: result.testName,
      value: result.value.toNumber(),
      unit: result.unit,
      refLow: result.refLow?.toNumber() ?? null,
      refHigh: result.refHigh?.toNumber() ?? null,
      source: result.source,
    })),
    assessments: patient.assessments.flatMap((assessment) =>
      assessment.completedAt &&
      assessment.score !== null &&
      assessment.riskBand
        ? [
            {
              completedAt: assessment.completedAt,
              score: assessment.score,
              riskBand: assessment.riskBand,
            },
          ]
        : [],
    ),
  });
}

function safeStoredReview(row: {
  id: string;
  inputHash: string;
  model: string;
  evidence: unknown;
  review: unknown;
  dataThrough: Date;
  generatedAt: Date;
}, currentInputHash: string) {
  const evidence = parseStoredClinicalEvidence(row.evidence);
  const review = parseClinicalReview(
    row.review,
    evidence.map((item) => item.id),
  );

  return {
    id: row.id,
    model: row.model,
    evidence,
    review,
    dataThrough: row.dataThrough.toISOString().slice(0, 10),
    generatedAt: row.generatedAt.toISOString(),
    isStale: row.inputHash !== currentInputHash,
  };
}

export type PatientClinicalReview = NonNullable<
  Awaited<ReturnType<typeof getLatestPatientClinicalReview>>
>;

export async function getLatestPatientClinicalReview(patientId: string) {
  const clinician = await requireClinician();
  const normalizedPatientId = validPatientId(patientId);

  if (!normalizedPatientId) {
    return null;
  }

  const snapshot = await getPatientEvidenceContext(
    clinician.id,
    normalizedPatientId,
  );

  if (!snapshot || snapshot.evidence.length === 0) {
    return null;
  }

  const inputHash = clinicalEvidenceFingerprint(snapshot);
  const currentReview = await db.clinicalReview.findFirst({
    where: {
      patientId: normalizedPatientId,
      clinicianId: clinician.id,
      inputHash,
    },
    orderBy: { generatedAt: "desc" },
    select: {
      id: true,
      inputHash: true,
      model: true,
      evidence: true,
      review: true,
      dataThrough: true,
      generatedAt: true,
    },
  });
  const storedReview =
    currentReview ??
    (await db.clinicalReview.findFirst({
      where: {
        patientId: normalizedPatientId,
        clinicianId: clinician.id,
      },
      orderBy: { generatedAt: "desc" },
      select: {
        id: true,
        inputHash: true,
        model: true,
        evidence: true,
        review: true,
        dataThrough: true,
        generatedAt: true,
      },
    }));

  return storedReview ? safeStoredReview(storedReview, inputHash) : null;
}

export async function generatePatientClinicalReview(patientId: string) {
  const clinician = await requireClinician();
  const normalizedPatientId = validPatientId(patientId);

  if (!normalizedPatientId) {
    return { kind: "NOT_FOUND" as const };
  }

  const snapshot = await getPatientEvidenceContext(
    clinician.id,
    normalizedPatientId,
  );

  if (!snapshot) {
    return { kind: "NOT_FOUND" as const };
  }

  if (snapshot.evidence.length === 0) {
    return { kind: "NO_EVIDENCE" as const };
  }

  const model = getConfiguredGeminiModel();
  const inputHash = clinicalEvidenceFingerprint(snapshot);
  const existing = await db.clinicalReview.findUnique({
    where: {
      patientId_inputHash_model: {
        patientId: normalizedPatientId,
        inputHash,
        model,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return { kind: "REUSED" as const, reviewId: existing.id };
  }

  const recentReviews = await db.clinicalReview.count({
    where: {
      clinicianId: clinician.id,
      generatedAt: {
        gte: new Date(Date.now() - REVIEW_RATE_WINDOW_MS),
      },
    },
  });

  if (recentReviews >= REVIEW_RATE_LIMIT) {
    throw new ClinicalReviewError(
      "RATE_LIMIT",
      "The clinician AI review rate limit was reached.",
      "You have generated five new reviews in the last hour. Try again later.",
    );
  }

  const generated = await generateConfiguredClinicalReview(snapshot);

  try {
    const created = await db.clinicalReview.create({
      data: {
        patientId: normalizedPatientId,
        clinicianId: clinician.id,
        inputHash,
        model: generated.model,
        evidence: snapshot.evidence,
        review: generated.review,
        dataThrough: clinicalEvidenceDataThrough(snapshot),
      },
      select: { id: true },
    });

    return { kind: "CREATED" as const, reviewId: created.id };
  } catch (error) {
    const concurrentReview = await db.clinicalReview.findUnique({
      where: {
        patientId_inputHash_model: {
          patientId: normalizedPatientId,
          inputHash,
          model: generated.model,
        },
      },
      select: { id: true },
    });

    if (concurrentReview) {
      return {
        kind: "REUSED" as const,
        reviewId: concurrentReview.id,
      };
    }

    throw error;
  }
}
