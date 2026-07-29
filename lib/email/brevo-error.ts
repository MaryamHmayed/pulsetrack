type BrevoErrorPayload = {
  code?: unknown;
  message?: unknown;
};

function safeProviderMessage(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);

  return sanitized || null;
}

export function describeBrevoError(status: number, payload: unknown) {
  const error =
    payload && typeof payload === "object"
      ? (payload as BrevoErrorPayload)
      : null;
  const code = safeProviderMessage(error?.code);
  const message = safeProviderMessage(error?.message);

  if (status === 401 || code === "unauthorized") {
    return "Brevo authentication failed. Check BREVO_API_KEY.";
  }

  if (code === "permission_denied") {
    return "Brevo transactional email is not active for this account. Contact Brevo support.";
  }

  if (
    code === "invalid_parameter" &&
    message &&
    /\bsender\b/i.test(message)
  ) {
    return "Brevo rejected the sender. Check that BREVO_SENDER_EMAIL is verified.";
  }

  if (status === 429) {
    return "Brevo temporarily rate-limited email delivery. Try again shortly.";
  }

  if (message) {
    return `Brevo rejected the email: ${message}`;
  }

  return `The email provider rejected the request (${status}).`;
}
