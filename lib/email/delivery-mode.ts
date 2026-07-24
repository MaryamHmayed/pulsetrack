export type AssessmentDeliveryMode = "EMAIL" | "PREVIEW";

export function resolveAssessmentDeliveryMode(
  configuredMode: string | undefined,
  isProduction: boolean,
): AssessmentDeliveryMode {
  const configured = configuredMode?.trim().toLowerCase();

  if (!configured || configured === "resend" || configured === "email") {
    return "EMAIL";
  }

  if (configured === "preview") {
    if (isProduction) {
      throw new Error("Preview email delivery is not allowed in production.");
    }

    return "PREVIEW";
  }

  throw new Error(
    "EMAIL_DELIVERY_MODE must be either 'resend' or 'preview'.",
  );
}
