type ResendErrorPayload = {
  name?: unknown;
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

export function describeResendError(status: number, payload: unknown) {
  const error =
    payload && typeof payload === "object"
      ? (payload as ResendErrorPayload)
      : null;
  const name = safeProviderMessage(error?.name);
  const message = safeProviderMessage(error?.message);

  if (status === 422 && name === "invalid_from_address") {
    return "Resend rejected EMAIL_FROM. Use an address at your verified domain.";
  }

  if (
    status === 422 &&
    message &&
    /\b(?:example|test)\.(?:com|org|net)\b/i.test(message)
  ) {
    return "Resend blocks example/test recipient domains. Use a real inbox or delivered@resend.dev.";
  }

  if (message) {
    return `Resend rejected the email: ${message}`;
  }

  return `The email provider rejected the request (${status}).`;
}
