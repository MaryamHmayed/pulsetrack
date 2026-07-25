import "server-only";

import {
  resolveAssessmentDeliveryMode,
  type AssessmentDeliveryMode,
} from "@/lib/email/delivery-mode";
import { describeResendError } from "@/lib/email/resend-error";

type AssessmentEmailInput = {
  assessmentId: string;
  patientName: string;
  recipient: string;
  assessmentUrl: string;
};

type AssessmentEmailResult = {
  mode: AssessmentDeliveryMode;
  providerId: string | null;
};

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export function getAssessmentDeliveryMode(): AssessmentDeliveryMode {
  try {
    return resolveAssessmentDeliveryMode(
      process.env.EMAIL_DELIVERY_MODE,
      process.env.NODE_ENV === "production",
    );
  } catch (error) {
    throw new EmailDeliveryError(
      error instanceof Error
        ? error.message
        : "Email delivery mode is not configured correctly.",
    );
  }
}

export function getApplicationUrl() {
  const configured = process.env.APP_URL?.trim();

  if (configured) {
    let url: URL;

    try {
      url = new URL(configured);
    } catch {
      throw new EmailDeliveryError("APP_URL must be a valid absolute URL.");
    }

    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:"
    ) {
      throw new EmailDeliveryError("APP_URL must use HTTPS in production.");
    }

    return url.origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new EmailDeliveryError("APP_URL is required in production.");
  }

  return "http://localhost:3000";
}

export async function sendAssessmentEmail(
  input: AssessmentEmailInput,
): Promise<AssessmentEmailResult> {
  const mode = getAssessmentDeliveryMode();

  if (mode === "PREVIEW") {
    return { mode, providerId: null };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new EmailDeliveryError(
      "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    );
  }

  const safeName = escapeHtml(input.patientName);
  const safeUrl = escapeHtml(input.assessmentUrl);
  let response: Response;

  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `assessment/${input.assessmentId}`,
        "User-Agent": "PulseTrack/1.0",
      },
      body: JSON.stringify({
        from,
        to: [input.recipient],
        subject: "Your diabetes self-management assessment",
        text: [
          `Hello ${input.patientName},`,
          "",
          "Your care team has asked you to complete a short diabetes self-management assessment.",
          `Open this secure link within 7 days: ${input.assessmentUrl}`,
          "",
          "This link can be used once. If you did not expect this message, contact your clinic.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:600px">
            <p>Hello ${safeName},</p>
            <p>Your care team has asked you to complete a short diabetes self-management assessment.</p>
            <p>
              <a href="${safeUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">
                Complete assessment
              </a>
            </p>
            <p>This secure link expires in 7 days and can be used once.</p>
            <p style="color:#64748b;font-size:14px">If you did not expect this message, contact your clinic.</p>
          </div>
        `,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new EmailDeliveryError(
      "The email provider could not be reached. Please try again.",
    );
  }

  if (!response.ok) {
    let errorPayload: unknown;

    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = null;
    }

    throw new EmailDeliveryError(
      describeResendError(response.status, errorPayload),
    );
  }

  const payload = (await response.json()) as { id?: unknown };

  if (typeof payload.id !== "string" || !payload.id) {
    throw new EmailDeliveryError(
      "The email provider returned an invalid response.",
    );
  }

  return {
    mode,
    providerId: payload.id,
  };
}
