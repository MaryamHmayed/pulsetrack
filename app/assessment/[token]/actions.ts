"use server";

import {
  completeAssessment,
  persistExpiredAssessment,
} from "@/lib/data/assessments";
import {
  readDsma8FormData,
  scoreDsma8,
} from "@/lib/questionnaire/dsma8";

export type AssessmentFormState = {
  kind?: "ERROR" | "SUCCESS" | "EXPIRED" | "COMPLETED" | "INVALID";
  message?: string;
  invalidItemIds?: string[];
  values?: Record<string, string>;
};

export async function submitAssessmentAction(
  token: string,
  _previousState: AssessmentFormState,
  formData: FormData,
): Promise<AssessmentFormState> {
  const submitted = readDsma8FormData(formData);
  const values = Object.fromEntries(
    Object.entries(submitted).map(([key, value]) => [
      key,
      typeof value === "string" ? value : "",
    ]),
  );
  const scored = scoreDsma8(submitted);

  if (!scored.success) {
    return {
      kind: "ERROR",
      message: scored.message,
      invalidItemIds: [
        ...scored.missingItemIds,
        ...scored.invalidItemIds,
      ],
      values,
    };
  }

  let result: Awaited<ReturnType<typeof completeAssessment>>;

  try {
    result = await completeAssessment(token, scored.data);
  } catch {
    return {
      kind: "ERROR",
      message:
        "Your responses could not be submitted right now. Please try again.",
      values,
    };
  }

  switch (result.kind) {
    case "SUCCESS":
      return {
        kind: "SUCCESS",
        message: "Your assessment was submitted successfully.",
      };
    case "COMPLETED":
      return {
        kind: "COMPLETED",
        message: "This assessment link has already been used.",
      };
    case "EXPIRED":
      return {
        kind: "EXPIRED",
        message: "This assessment link has expired.",
      };
    default:
      return {
        kind: "INVALID",
        message: "This assessment link is invalid.",
      };
  }
}

export async function markAssessmentExpiredAction(token: string) {
  await persistExpiredAssessment(token);
}
