import "server-only";

import { describeBrevoError } from "@/lib/email/brevo-error";

type AssessmentEmailInput = {
  assessmentId: string;
  patientName: string;
  recipient: string;
  assessmentUrl: string;
};

type AssessmentEmailResult = {
  providerId: string;
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
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "PulseTrack";

  if (!apiKey || !senderEmail) {
    throw new EmailDeliveryError(
      "Email delivery is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.",
    );
  }

  const safeName = escapeHtml(input.patientName);
  const safeUrl = escapeHtml(input.assessmentUrl);
  let response: Response;

  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "api-key": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "PulseTrack/1.0",
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: senderName,
        },
        to: [
          {
            email: input.recipient,
            name: input.patientName,
          },
        ],
        subject: "Your diabetes self-management assessment",
        textContent: [
          `Hello ${input.patientName},`,
          "",
          "Your care team has asked you to complete a short diabetes self-management assessment.",
          `Open this secure link within 7 days: ${input.assessmentUrl}`,
          "",
          "This link can be used once. If you did not expect this message, contact your clinic.",
        ].join("\n"),
        htmlContent: `
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
        headers: {
          "Idempotency-Key": `assessment-${input.assessmentId}`,
        },
        tags: ["assessment"],
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
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
      describeBrevoError(response.status, errorPayload),
    );
  }

  const payload = (await response.json()) as { messageId?: unknown };

  if (typeof payload.messageId !== "string" || !payload.messageId) {
    throw new EmailDeliveryError(
      "The email provider returned an invalid response.",
    );
  }

  return {
    providerId: payload.messageId,
  };
}
