"use server";

import { revalidatePath } from "next/cache";
import { ClinicalReviewError } from "@/lib/ai/gemini";
import { generatePatientClinicalReview } from "@/lib/ai/reviews";
import { requireClinician } from "@/lib/auth/session";

export type ClinicalReviewActionState = {
  kind?: "SUCCESS" | "ERROR";
  message?: string;
};

export async function generateClinicalReviewAction(
  patientId: string,
  _previousState: ClinicalReviewActionState,
): Promise<ClinicalReviewActionState> {
  void _previousState;
  await requireClinician();

  try {
    const result = await generatePatientClinicalReview(patientId);

    if (result.kind === "NOT_FOUND") {
      return {
        kind: "ERROR",
        message: "Patient not found or access was denied.",
      };
    }

    if (result.kind === "NO_EVIDENCE") {
      return {
        kind: "ERROR",
        message:
          "Add a lab result or complete an assessment before generating a review.",
      };
    }

    revalidatePath(`/patients/${patientId}`);

    return {
      kind: "SUCCESS",
      message:
        result.kind === "REUSED"
          ? "The existing review already matches the latest clinical data."
          : "Evidence-backed clinical review generated successfully.",
    };
  } catch (error) {
    return {
      kind: "ERROR",
      message:
        error instanceof ClinicalReviewError
          ? error.publicMessage
          : "The clinical review could not be generated. Try again later.",
    };
  }
}
