import "server-only";

import { db } from "@/lib/db";
import { requireClinician } from "@/lib/auth/session";
import { dsma8, type Dsma8Score } from "@/lib/questionnaire/dsma8";
import {
  assessmentExpiresAt,
  createAssessmentToken,
  hashAssessmentToken,
  isValidAssessmentToken,
} from "@/lib/assessment/token";
import {
  EmailDeliveryError,
  getApplicationUrl,
  sendAssessmentEmail,
} from "@/lib/email/assessment-email";

export type PublicAssessmentState =
  | { kind: "ACTIVE" }
  | { kind: "COMPLETED" }
  | { kind: "EXPIRED" }
  | { kind: "INVALID" };

export async function persistClinicianExpiredAssessments(
  clinicianId: string,
  patientId?: string,
  now = new Date(),
) {
  return db.assessment.updateMany({
    where: {
      status: "SENT",
      expiresAt: { lte: now },
      patientId,
      patient: { clinicianId },
    },
    data: { status: "EXPIRED" },
  });
}

export async function issueAssessment(patientId: string) {
  const clinician = await requireClinician();
  const patient = await db.patient.findFirst({
    where: {
      id: patientId,
      clinicianId: clinician.id,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });

  if (!patient) {
    return { kind: "NOT_FOUND" as const };
  }

  if (!patient.email) {
    throw new EmailDeliveryError(
      "Add an email address to this patient before sending an assessment.",
    );
  }

  const token = createAssessmentToken();
  const assessmentUrl = `${getApplicationUrl()}/assessment/${token}`;
  const assessment = await db.assessment.create({
    data: {
      patientId: patient.id,
      questionnaireId: dsma8.id,
      questionnaireVersion: dsma8.version,
      tokenHash: hashAssessmentToken(token),
      expiresAt: assessmentExpiresAt(),
      deliveryMode: "EMAIL",
    },
    select: { id: true },
  });

  let delivery: Awaited<ReturnType<typeof sendAssessmentEmail>>;

  try {
    delivery = await sendAssessmentEmail({
      assessmentId: assessment.id,
      patientName: patient.fullName,
      recipient: patient.email,
      assessmentUrl,
    });
  } catch (error) {
    await db.assessment
      .deleteMany({
        where: {
          id: assessment.id,
          patient: { clinicianId: clinician.id },
        },
      })
      .catch(() => undefined);
    throw error;
  }

  await db.assessment.update({
    where: { id: assessment.id },
    data: { emailProviderId: delivery.providerId },
  });

  return {
    kind: "SENT" as const,
  };
}

export async function getAssessmentHistory(patientId: string) {
  const clinician = await requireClinician();
  const now = new Date();

  await persistClinicianExpiredAssessments(clinician.id, patientId, now);

  const assessments = await db.assessment.findMany({
    where: {
      patientId,
      patient: { clinicianId: clinician.id },
    },
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      questionnaireVersion: true,
      status: true,
      sentAt: true,
      expiresAt: true,
      completedAt: true,
      score: true,
      riskBand: true,
    },
  });

  return assessments.map((assessment) => ({
    ...assessment,
    displayStatus: assessment.status,
  }));
}

export async function getPublicAssessmentState(
  token: string,
): Promise<PublicAssessmentState> {
  if (!isValidAssessmentToken(token)) {
    return { kind: "INVALID" };
  }

  const assessment = await db.assessment.findUnique({
    where: { tokenHash: hashAssessmentToken(token) },
    select: {
      status: true,
      expiresAt: true,
      questionnaireId: true,
      questionnaireVersion: true,
    },
  });

  if (
    !assessment ||
    assessment.questionnaireId !== dsma8.id ||
    assessment.questionnaireVersion !== dsma8.version
  ) {
    return { kind: "INVALID" };
  }

  if (assessment.status === "COMPLETED") {
    return { kind: "COMPLETED" };
  }

  const now = new Date();

  if (assessment.status === "EXPIRED" || assessment.expiresAt <= now) {
    if (assessment.status === "SENT") {
      await db.assessment.updateMany({
        where: {
          tokenHash: hashAssessmentToken(token),
          status: "SENT",
          expiresAt: { lte: now },
        },
        data: { status: "EXPIRED" },
      });
    }

    return { kind: "EXPIRED" };
  }

  return { kind: "ACTIVE" };
}

export async function persistExpiredAssessment(token: string) {
  if (!isValidAssessmentToken(token)) {
    return;
  }

  await db.assessment.updateMany({
    where: {
      tokenHash: hashAssessmentToken(token),
      status: "SENT",
      expiresAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });
}

export async function completeAssessment(token: string, result: Dsma8Score) {
  if (!isValidAssessmentToken(token)) {
    return { kind: "INVALID" as const };
  }

  const tokenHash = hashAssessmentToken(token);

  return db.$transaction(
    async (transaction) => {
      const assessment = await transaction.assessment.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          questionnaireId: true,
          questionnaireVersion: true,
        },
      });

      if (
        !assessment ||
        assessment.questionnaireId !== dsma8.id ||
        assessment.questionnaireVersion !== dsma8.version
      ) {
        return { kind: "INVALID" as const };
      }

      if (assessment.status === "COMPLETED") {
        return { kind: "COMPLETED" as const };
      }

      const completedAt = new Date();

      if (
        assessment.status === "EXPIRED" ||
        assessment.expiresAt <= completedAt
      ) {
        await transaction.assessment.updateMany({
          where: {
            id: assessment.id,
            status: "SENT",
          },
          data: { status: "EXPIRED" },
        });
        return { kind: "EXPIRED" as const };
      }

      const updated = await transaction.assessment.updateMany({
        where: {
          id: assessment.id,
          status: "SENT",
          expiresAt: { gt: completedAt },
        },
        data: {
          status: "COMPLETED",
          completedAt,
          responses: result.responses,
          score: result.score,
          riskBand: result.riskBand,
        },
      });

      return updated.count === 1
        ? { kind: "SUCCESS" as const }
        : { kind: "COMPLETED" as const };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 10_000,
    },
  );
}
