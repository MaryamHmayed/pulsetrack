"use server";

import { revalidatePath } from "next/cache";
import { requireClinician } from "@/lib/auth/session";
import { issueAssessment } from "@/lib/data/assessments";
import { EmailDeliveryError } from "@/lib/email/assessment-email";

export type SendAssessmentState = {
  kind?: "SUCCESS" | "ERROR";
  message?: string;
  previewUrl?: string;
};

export async function sendAssessmentAction(
  patientId: string,
  _previousState: SendAssessmentState,
): Promise<SendAssessmentState> {
  void _previousState;
  await requireClinician();

  try {
    const result = await issueAssessment(patientId);

    if (result.kind === "NOT_FOUND") {
      return {
        kind: "ERROR",
        message: "Patient not found or access was denied.",
      };
    }

    revalidatePath(`/patients/${patientId}`);

    if (result.mode === "PREVIEW") {
      return {
        kind: "SUCCESS",
        message:
          "Preview assessment created. Open the link below to test the patient flow.",
        previewUrl: result.previewUrl ?? undefined,
      };
    }

    return {
      kind: "SUCCESS",
      message: "Assessment email sent successfully.",
    };
  } catch (error) {
    return {
      kind: "ERROR",
      message:
        error instanceof EmailDeliveryError
          ? error.message
          : "Unable to create the assessment right now. Please try again.",
    };
  }
}
